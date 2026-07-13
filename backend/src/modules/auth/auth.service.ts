import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
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
import { AuditEventsService } from '../audit-events/audit-events.service';
import { AuditAction } from '../../entities/audit-event.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
    private jwtService: JwtService,
    private auditEventsService: AuditEventsService,
  ) {}

  async login(loginDto: LoginDto) {
    // Load role AND its permissions (ManyToMany - not eager by default)
    // Without 'role.permissions', user.role.permissions is undefined → empty slugs array
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email },
      relations: ['role', 'role.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
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
        // Include permission slugs so the frontend mirrors the backend PermissionsGuard
        permissions: user.role?.permissions?.map((p) => p.slug) ?? [],
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersRepository.findOne({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Generate OTP
    const otp = this.generateOTP();
    const token = this.generateRandomToken();

    // Create password reset token
    const resetToken = this.passwordResetTokenRepository.create({
      userId: user.id,
      token,
      otp,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      user,
    });

    await this.passwordResetTokenRepository.save(resetToken);

    // TODO: Send OTP via email
    console.log(`OTP for ${user.email}: ${otp}`);

    return {
      message: 'OTP sent to your email',
      success: true,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const user = await this.usersRepository.findOne({
      where: { email: verifyOtpDto.email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: {
        userId: user.id,
        otp: verifyOtpDto.otp,
        isUsed: false,
      },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid OTP');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    return {
      message: 'OTP verified successfully',
      success: true,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersRepository.findOne({
      where: { email: resetPasswordDto.email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: {
        userId: user.id,
        otp: resetPasswordDto.otp,
        isUsed: false,
      },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid OTP');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    // Update user password
    user.passwordHash = hashedPassword;
    await this.usersRepository.save(user);

    // Mark token as used
    resetToken.isUsed = true;
    await this.passwordResetTokenRepository.save(resetToken);

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

  async updateProfile(userId: number, updateDto: any) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (updateDto.firstName) user.firstName = updateDto.firstName;
    if (updateDto.lastName) user.lastName = updateDto.lastName;
    if (updateDto.email) user.email = updateDto.email;
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

  async changePassword(userId: number, changeDto: any) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
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
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateRandomToken(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }
}
