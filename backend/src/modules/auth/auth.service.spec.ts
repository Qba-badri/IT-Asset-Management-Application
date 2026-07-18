import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../../entities/user.entity';
import { PasswordResetToken } from '../../entities/password-reset-token.entity';
import { AuditEventsService } from '../audit-events/audit-events.service';
import { MailService } from '../mail/mail.service';

describe('AuthService', () => {
  let service: AuthService;

  const usersRepository = {
    findOne: jest.fn(),
    save: jest.fn(async (u) => u),
  };
  const tokenRepository = {
    findOne: jest.fn(),
    save: jest.fn(async (t) => t),
    create: jest.fn((t) => t),
    update: jest.fn(),
  };
  const jwtService = { sign: jest.fn(() => 'signed.jwt.token') };
  const auditEventsService = { logEvent: jest.fn() };
  const mailService = { sendPasswordResetOtp: jest.fn(), isEnabled: true };

  const genericMessage =
    'If an account exists for this email, password reset instructions have been sent.';

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: tokenRepository,
        },
        { provide: JwtService, useValue: jwtService },
        { provide: AuditEventsService, useValue: auditEventsService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  const makeUser = async (overrides: Partial<User> = {}): Promise<User> =>
    ({
      id: 1,
      email: 'user@example.com',
      passwordHash: await bcrypt.hash('Correct#Pass1', 10),
      tokenVersion: 0,
      isSsoUser: false,
      isActive: true,
      role: { id: 1, name: 'Admin', permissions: [{ slug: 'assets.view' }] },
      ...overrides,
    }) as unknown as User;

  describe('login', () => {
    it('returns a token and permissions on valid credentials', async () => {
      usersRepository.findOne.mockResolvedValue(await makeUser());
      const result = await service.login({
        email: 'user@example.com',
        password: 'Correct#Pass1',
      });
      expect(result.token).toBe('signed.jwt.token');
      expect(result.user.permissions).toEqual(['assets.view']);
    });

    it('rejects a wrong password', async () => {
      usersRepository.findOne.mockResolvedValue(await makeUser());
      await expect(
        service.login({ email: 'user@example.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an unknown email with the same error', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      await expect(
        service.login({ email: 'nobody@example.com', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects SSO-provisioned accounts even with a "matching" hash', async () => {
      usersRepository.findOne.mockResolvedValue(
        await makeUser({ isSsoUser: true } as any),
      );
      await expect(
        service.login({ email: 'user@example.com', password: 'Correct#Pass1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('emails an OTP and returns the generic response for a known user', async () => {
      usersRepository.findOne.mockResolvedValue(await makeUser());
      const result = await service.forgotPassword({
        email: 'user@example.com',
      });
      expect(result.message).toBe(genericMessage);
      expect(mailService.sendPasswordResetOtp).toHaveBeenCalledTimes(1);
      const [, otp] = mailService.sendPasswordResetOtp.mock.calls[0];
      expect(otp).toMatch(/^\d{6}$/);
      // stored token contains only the hash, never the plaintext OTP
      const saved = tokenRepository.save.mock.calls[0][0];
      expect(saved.otpHash).toBeDefined();
      expect(JSON.stringify(saved)).not.toContain(otp);
      // response never contains the OTP
      expect(JSON.stringify(result)).not.toContain(otp);
    });

    it('returns the identical generic response for an unknown email', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      const result = await service.forgotPassword({
        email: 'nobody@example.com',
      });
      expect(result.message).toBe(genericMessage);
      expect(mailService.sendPasswordResetOtp).not.toHaveBeenCalled();
      expect(tokenRepository.save).not.toHaveBeenCalled();
    });

    it('does not create a reset token for SSO users but stays generic', async () => {
      usersRepository.findOne.mockResolvedValue(
        await makeUser({ isSsoUser: true } as any),
      );
      const result = await service.forgotPassword({
        email: 'user@example.com',
      });
      expect(result.message).toBe(genericMessage);
      expect(tokenRepository.save).not.toHaveBeenCalled();
    });

    it('never logs the OTP', async () => {
      const logs: string[] = [];
      const spies = ['log', 'warn', 'error', 'debug'].map((m) =>
        jest
          .spyOn(console, m as any)
          .mockImplementation((...args: unknown[]) => {
            logs.push(args.join(' '));
          }),
      );
      usersRepository.findOne.mockResolvedValue(await makeUser());
      await service.forgotPassword({ email: 'user@example.com' });
      const [, otp] = mailService.sendPasswordResetOtp.mock.calls[0];
      expect(logs.join('\n')).not.toContain(otp);
      spies.forEach((s) => s.mockRestore());
    });
  });

  describe('verifyOtp / resetPassword', () => {
    const activeToken = async (otp: string, overrides = {}) => ({
      id: 10,
      userId: 1,
      otpHash: await bcrypt.hash(otp, 10),
      attempts: 0,
      isUsed: false,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      createdAt: new Date(),
      ...overrides,
    });

    it('accepts the correct OTP', async () => {
      usersRepository.findOne.mockResolvedValue(await makeUser());
      tokenRepository.findOne.mockResolvedValue(await activeToken('123456'));
      await expect(
        service.verifyOtp({ email: 'user@example.com', otp: '123456' }),
      ).resolves.toMatchObject({ success: true });
    });

    it('rejects a wrong OTP and increments attempts', async () => {
      usersRepository.findOne.mockResolvedValue(await makeUser());
      const token = await activeToken('123456');
      tokenRepository.findOne.mockResolvedValue(token);
      await expect(
        service.verifyOtp({ email: 'user@example.com', otp: '000000' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(token.attempts).toBe(1);
      expect(tokenRepository.save).toHaveBeenCalledWith(token);
    });

    it('locks the token after the max failed attempts', async () => {
      usersRepository.findOne.mockResolvedValue(await makeUser());
      const token = await activeToken('123456', { attempts: 4 });
      tokenRepository.findOne.mockResolvedValue(token);
      await expect(
        service.verifyOtp({ email: 'user@example.com', otp: '000000' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(token.isUsed).toBe(true);
      // even the CORRECT otp is now rejected
      await expect(
        service.verifyOtp({ email: 'user@example.com', otp: '123456' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an expired OTP', async () => {
      usersRepository.findOne.mockResolvedValue(await makeUser());
      tokenRepository.findOne.mockResolvedValue(
        await activeToken('123456', {
          expiresAt: new Date(Date.now() - 1000),
        }),
      );
      await expect(
        service.verifyOtp({ email: 'user@example.com', otp: '123456' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('uses the same generic error for unknown accounts', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      await expect(
        service.verifyOtp({ email: 'nobody@example.com', otp: '123456' }),
      ).rejects.toThrow('Invalid or expired OTP');
    });

    it('resets the password once and marks the token used', async () => {
      const user = await makeUser();
      usersRepository.findOne.mockResolvedValue(user);
      const token = await activeToken('123456');
      tokenRepository.findOne.mockResolvedValue(token);

      await service.resetPassword({
        email: 'user@example.com',
        otp: '123456',
        newPassword: 'New#Passw0rd',
      });
      expect(token.isUsed).toBe(true);
      expect(await bcrypt.compare('New#Passw0rd', user.passwordHash)).toBe(
        true,
      );
      expect(user.tokenVersion).toBe(1); // sessions invalidated

      // token can not be reused
      tokenRepository.findOne.mockResolvedValue(null); // isUsed filter excludes it
      await expect(
        service.resetPassword({
          email: 'user@example.com',
          otp: '123456',
          newPassword: 'Another#Pass1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
