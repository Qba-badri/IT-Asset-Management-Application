import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { effectivePermissions } from './permission-utils';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Throws at startup if JWT_SECRET is not configured — no fallback secret
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
      relations: ['role', 'role.permissions'],
    });

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Session expired or invalidated');
    }

    // Defence in depth: reject tokens for accounts that have been deactivated,
    // even if a revocation path failed to bump tokenVersion.
    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    // Effective permissions require role AND each permission to be active;
    // computed per request, so deactivations apply immediately.
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId ?? null,
      permissions: effectivePermissions(user)
    };
  }
}
