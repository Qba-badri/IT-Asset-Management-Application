import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../../entities/user.entity';
import { PasswordResetToken } from '../../entities/password-reset-token.entity';
import { Role } from '../../entities/role.entity';

import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuditEventsModule } from '../audit-events/audit-events.module';
import { MailModule } from '../mail/mail.module';

import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PasswordResetToken, Role]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        // Throws at startup if JWT_SECRET is not configured — no fallback secret
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // Default kept in sync with env.validation.ts (JWT_EXPIRATION default).
          expiresIn: configService.get('JWT_EXPIRATION', '1h') as any,
        },
      }),
      inject: [ConfigService],
    }),
    AuditEventsModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PermissionsGuard],
  exports: [AuthService, TypeOrmModule, PermissionsGuard],
})
export class AuthModule { }
