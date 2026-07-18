import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  const makeContext = (user: any): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  const guardRequiring = (required: string[] | undefined) => {
    const reflector = {
      getAllAndOverride: jest.fn(() => required),
    } as unknown as Reflector;
    return new PermissionsGuard(reflector);
  };

  it('allows requests when no permissions are required', async () => {
    const guard = guardRequiring(undefined);
    await expect(guard.canActivate(makeContext(undefined))).resolves.toBe(
      true,
    );
  });

  it('allows a user holding the required permission', async () => {
    const guard = guardRequiring(['assets.manage']);
    await expect(
      guard.canActivate(
        makeContext({ id: 1, permissions: ['assets.manage', 'assets.view'] }),
      ),
    ).resolves.toBe(true);
  });

  it('throws 403 for a user missing the permission', async () => {
    const guard = guardRequiring(['inventory.manage']);
    await expect(
      guard.canActivate(makeContext({ id: 2, permissions: ['assets.view'] })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires ALL listed permissions', async () => {
    const guard = guardRequiring(['assets.view', 'assets.manage']);
    await expect(
      guard.canActivate(makeContext({ id: 3, permissions: ['assets.view'] })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('denies when there is no authenticated user', async () => {
    const guard = guardRequiring(['assets.view']);
    await expect(guard.canActivate(makeContext(undefined))).resolves.toBe(
      false,
    );
  });
});
