import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomInt, randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { PasswordResetToken } from '../../entities/password-reset-token.entity';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UpdateProfileDto, ChangePasswordDto } from './dto/profile.dto';
import { AuditEventsService } from '../audit-events/audit-events.service';
import { AuditAction } from '../../entities/audit-event.entity';
import { effectivePermissions } from './permission-utils';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
    private jwtService: JwtService,
    private auditEventsService: AuditEventsService,
    private mailService: MailService,
  ) {}

  private readonly logger = new Logger(AuthService.name);
  private static readonly MAX_OTP_ATTEMPTS = 5;
  private static readonly OTP_TTL_MS = 15 * 60 * 1000;
  // Same public response whether or not the account exists (anti-enumeration)
  private static readonly GENERIC_RESET_RESPONSE = {
    message:
      'If an account exists for this email, password reset instructions have been sent.',
    success: true,
  };

  async login(loginDto: LoginDto) {
    // Load role AND its permissions (ManyToMany - not eager by default)
    // Without 'role.permissions', user.role.permissions is undefined → empty slugs array
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email },
      relations: ['role', 'role.permissions'],
    });

    // SSO-provisioned accounts have no usable local password
    if (!user || user.isSsoUser) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    // Update last login
    user.lastLogin = new Date();
    await this.usersRepository.save(user);

    // Record Audit Event
    await this.auditEventsService.logEvent({
      action: AuditAction.LOGIN,
      entityType: 'user',
      entityId: user.id,
      actorId: user.id,
      metadata: { email: user.email },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        // Include role so the frontend can redirect appropriately
        role: user.role
          ? { id: user.role.id, name: user.role.name }
          : null,
        // Include permission slugs so the frontend mirrors the backend PermissionsGuard.
        // Same active-role/active-permission filtering as JwtStrategy.
        permissions: effectivePermissions(user),
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersRepository.findOne({
      where: { email: forgotPasswordDto.email },
    });

    // Unknown account or SSO-managed account: return the same generic
    // response without creating a token, so responses don't reveal whether
    // (or how) the account exists.
    if (!user || user.isSsoUser) {
      return AuthService.GENERIC_RESET_RESPONSE;
    }

    // Invalidate any outstanding reset tokens for this user
    await this.passwordResetTokenRepository.update(
      { userId: user.id, isUsed: false },
      { isUsed: true },
    );

    const otp = this.generateOTP();
    const resetToken = this.passwordResetTokenRepository.create({
      userId: user.id,
      token: this.generateRandomToken(),
      otpHash: await bcrypt.hash(otp, 10),
      expiresAt: new Date(Date.now() + AuthService.OTP_TTL_MS),
    });
    await this.passwordResetTokenRepository.save(resetToken);

    try {
      await this.mailService.sendPasswordResetOtp(user.email, otp);
    } catch (error) {
      // Never include the OTP in logs
      this.logger.error(
        `Failed to send password reset email to ${user.email}: ${error.message}`,
      );
    }

    return AuthService.GENERIC_RESET_RESPONSE;
  }

  /**
   * Finds the active reset token for the email and checks the OTP against its
   * bcrypt hash, enforcing expiry and the failed-attempt limit. Throws the
   * same generic error for every failure mode (anti-enumeration).
   */
  private async consumeOtpCheck(email: string, otp: string) {
    const genericError = new BadRequestException('Invalid or expired OTP');

    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user || user.isSsoUser) {
      throw genericError;
    }

    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { userId: user.id, isUsed: false },
      order: { createdAt: 'DESC' },
    });

    if (
      !resetToken ||
      !resetToken.otpHash ||
      resetToken.expiresAt < new Date() ||
      resetToken.attempts >= AuthService.MAX_OTP_ATTEMPTS
    ) {
      throw genericError;
    }

    const otpMatches = await bcrypt.compare(otp, resetToken.otpHash);
    if (!otpMatches) {
      resetToken.attempts += 1;
      if (resetToken.attempts >= AuthService.MAX_OTP_ATTEMPTS) {
        resetToken.isUsed = true; // lock the token after too many failures
      }
      await this.passwordResetTokenRepository.save(resetToken);
      throw genericError;
    }

    return { user, resetToken };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    await this.consumeOtpCheck(verifyOtpDto.email, verifyOtpDto.otp);
    return {
      message: 'OTP verified successfully',
      success: true,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { user, resetToken } = await this.consumeOtpCheck(
      resetPasswordDto.email,
      resetPasswordDto.otp,
    );

    user.passwordHash = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    // Invalidate existing sessions after a password reset
    user.tokenVersion += 1;
    await this.usersRepository.save(user);

    resetToken.isUsed = true;
    await this.passwordResetTokenRepository.save(resetToken);

    await this.auditEventsService.logEvent({
      action: AuditAction.UPDATE,
      entityType: 'user',
      entityId: user.id,
      actorId: user.id,
      metadata: { field: 'password', via: 'password-reset' },
    });

    return {
      message: 'Password reset successfully',
      success: true,
    };
  }

  async getProfile(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Remove sensitive information
    const { passwordHash, ...result } = user;
    return result;
  }

  async updateProfile(userId: number, updateDto: UpdateProfileDto) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Email changes are intentionally not self-service (identity integrity)
    if (updateDto.firstName) user.firstName = updateDto.firstName;
    if (updateDto.lastName) user.lastName = updateDto.lastName;
    if (updateDto.settings) user.settings = updateDto.settings;
    if (updateDto.location) user.location = updateDto.location;
    if (updateDto.phoneNumber) user.phoneNumber = updateDto.phoneNumber;

    await this.usersRepository.save(user);

    const { passwordHash, ...result } = user;
    return result;
  }

  async logoutOthers(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.tokenVersion += 1;
    await this.usersRepository.save(user);

    return {
      message: 'Logged out from all other devices',
      success: true,
    };
  }

  async changePassword(userId: number, changeDto: ChangePasswordDto) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isSsoUser) {
      throw new BadRequestException(
        'This account is managed by your identity provider',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      changeDto.currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid current password');
    }

    user.passwordHash = await bcrypt.hash(changeDto.newPassword, 10);
    await this.usersRepository.save(user);

    // Record Audit Event
    await this.auditEventsService.logEvent({
      action: AuditAction.UPDATE,
      entityType: 'user',
      entityId: user.id,
      actorId: user.id,
      metadata: { field: 'password' },
    });

    return {
      message: 'Password changed successfully',
      success: true,
    };
  }

  private generateOTP(): string {
    // Cryptographically secure 6-digit code
    return randomInt(100000, 1000000).toString();
  }

  private generateRandomToken(): string {
    return randomBytes(32).toString('hex');
  }
}
