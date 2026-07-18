import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { effectivePermissions } from './permission-utils';
import { User } from '../../entities/user.entity';

/**
 * Authorization must require the user, the role, AND each individual
 * permission to be active. The strategy re-reads the chain per request, so a
 * deactivation takes effect immediately.
 */
describe('JwtStrategy active-status enforcement', () => {
  const configService = {
    getOrThrow: jest.fn(() => 'test-secret'),
  } as unknown as ConfigService;

  const makeStrategy = (user: any) => {
    const usersRepository = { findOne: jest.fn().mockResolvedValue(user) };
    return new JwtStrategy(usersRepository as any, configService);
  };

  const baseUser = (overrides: Partial<any> = {}) => ({
    id: 7,
    email: 'user@test.dev',
    tokenVersion: 1,
    isActive: true,
    departmentId: null,
    role: {
      id: 2,
      name: 'Manager',
      isActive: true,
      permissions: [
        { id: 1, slug: 'assets.view', isActive: true },
        { id: 2, slug: 'assets.manage', isActive: true },
      ],
    },
    ...overrides,
  });

  const payload = { sub: 7, tokenVersion: 1 };

  it('rejects a deactivated user', async () => {
    const strategy = makeStrategy(baseUser({ isActive: false }));
    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('returns no permissions when the role is inactive (assignment preserved)', async () => {
    const user = baseUser();
    user.role.isActive = false;
    const strategy = makeStrategy(user);
    const result = await strategy.validate(payload);
    expect(result.permissions).toEqual([]);
    // The role itself is still attached — only its effect is suppressed.
    expect(result.role).toBeDefined();
  });

  it('filters out inactive permissions while keeping active ones', async () => {
    const user = baseUser();
    user.role.permissions[1].isActive = false;
    const strategy = makeStrategy(user);
    const result = await strategy.validate(payload);
    expect(result.permissions).toEqual(['assets.view']);
  });

  it('returns all slugs when user, role, and permissions are active', async () => {
    const strategy = makeStrategy(baseUser());
    const result = await strategy.validate(payload);
    expect(result.permissions).toEqual(['assets.view', 'assets.manage']);
  });
});

describe('effectivePermissions', () => {
  it('is empty without a role', () => {
    expect(effectivePermissions({ role: null } as unknown as User)).toEqual([]);
  });

  it('treats legacy rows without isActive as active', () => {
    const user = {
      role: { permissions: [{ slug: 'assets.view' }] },
    } as unknown as User;
    expect(effectivePermissions(user)).toEqual(['assets.view']);
  });
});
