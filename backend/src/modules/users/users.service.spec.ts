import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';

describe('UsersService status protections', () => {
  let usersRepository: any;
  let rolesRepository: any;
  let manager: any;
  let dataSource: any;
  let auditEvents: any;
  let service: UsersService;

  /** Active users holding a system role, as seen by the locked read. */
  let lockedActiveAdmins: Array<{ id: number }>;

  const adminUser = (id: number) => ({
    id,
    email: `admin${id}@test.dev`,
    isActive: true,
    tokenVersion: 1,
    roleId: 1,
    role: { id: 1, name: 'Admin', isSystem: true, isActive: true },
  });

  const regularUser = (id: number) => ({
    id,
    email: `user${id}@test.dev`,
    isActive: true,
    tokenVersion: 1,
    roleId: 2,
    role: { id: 2, name: 'Viewer', isSystem: false, isActive: true },
  });

  beforeEach(() => {
    lockedActiveAdmins = [];
    usersRepository = {
      findOne: jest.fn(),
      save: jest.fn(async (u: any) => u),
    };
    rolesRepository = { findOne: jest.fn(), findOneBy: jest.fn() };

    const userQb = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => lockedActiveAdmins),
    };
    manager = {
      save: jest.fn(async (u: any) => u),
      getRepository: jest.fn((entity: any) => {
        if (entity === Role) {
          return { find: jest.fn(async () => [{ id: 1, isSystem: true }]) };
        }
        return {
          createQueryBuilder: jest.fn(() => userQb),
          increment: jest.fn(),
          update: jest.fn(async () => ({ affected: 1 })),
        };
      }),
    };
    dataSource = { transaction: jest.fn(async (cb: any) => cb(manager)) };
    auditEvents = { logEvent: jest.fn() };

    service = new UsersService(
      usersRepository,
      rolesRepository,
      {} as any, // inventory assignments — not used here
      dataSource,
      auditEvents,
    );
  });

  it('blocks self-deactivation with 400', async () => {
    usersRepository.findOne.mockResolvedValue(adminUser(9));
    await expect(
      service.update(9, { isActive: false }, { id: 9, permissions: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks deactivating the last active admin with 409', async () => {
    const target = adminUser(9);
    usersRepository.findOne.mockResolvedValue(target);
    lockedActiveAdmins = [{ id: 9 }]; // target is the only active admin
    await expect(
      service.update(9, { isActive: false }, { id: 1, permissions: [] }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('serialized concurrent deactivations: the second attempt sees the first and gets 409', async () => {
    // Two admins; a competing transaction deactivates admin 8 first. The
    // pessimistic lock serializes us behind it, so our locked read returns
    // only admin 9 as still active — deactivating 9 must fail.
    const target = adminUser(9);
    usersRepository.findOne.mockResolvedValue(target);
    lockedActiveAdmins = [{ id: 9 }]; // admin 8 already deactivated by the other tx
    await expect(
      service.update(9, { isActive: false }, { id: 1, permissions: [] }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deactivates an admin when another active admin remains, bumping tokenVersion and auditing atomically', async () => {
    const target = adminUser(9);
    usersRepository.findOne.mockResolvedValue(target);
    lockedActiveAdmins = [{ id: 9 }, { id: 8 }];

    const result: any = await service.update(
      9,
      { isActive: false },
      { id: 1, permissions: [] },
    );

    expect(result.isActive).toBe(false);
    expect(result.tokenVersion).toBe(2); // sessions invalidated
    expect(auditEvents.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'User',
        entityId: 9,
        metadata: expect.objectContaining({ field: 'isActive', from: true, to: false }),
      }),
      manager,
    );
  });

  it('deactivating a non-admin user does not consult the admin guard result', async () => {
    const target = regularUser(5);
    usersRepository.findOne.mockResolvedValue(target);
    lockedActiveAdmins = [{ id: 9 }]; // unrelated admin set
    const result: any = await service.update(
      5,
      { isActive: false },
      { id: 1, permissions: [] },
    );
    expect(result.isActive).toBe(false);
  });

  it('blocks bulk-deactivating all remaining active admins with 409', async () => {
    lockedActiveAdmins = [{ id: 9 }, { id: 8 }];
    await expect(
      service.bulkSetActive([9, 8], false, 1),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects creating a user with an inactive role (400)', async () => {
    rolesRepository.findOneBy.mockResolvedValue({
      id: 3,
      name: 'Retired',
      isActive: false,
    });
    await expect(
      service.create({ email: 'x@test.dev', password: 'pw', roleId: 3 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects changing a user onto an inactive role (400) but leaves an unchanged inactive role alone', async () => {
    const target = { ...regularUser(5), roleId: 3, role: { id: 3, name: 'Retired', isSystem: false, isActive: false } };
    usersRepository.findOne.mockResolvedValue(target);

    // Unrelated update, roleId untouched → retention is allowed.
    await expect(
      service.update(5, { firstName: 'New' }, { id: 1, permissions: [] }),
    ).resolves.toBeDefined();

    // Explicitly switching to another inactive role → rejected.
    rolesRepository.findOne.mockResolvedValue({
      id: 4,
      name: 'AlsoRetired',
      isActive: false,
      permissions: [],
    });
    await expect(
      service.update(5, { roleId: 4 }, { id: 1, permissions: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows replacing an inactive role with an active one the actor can grant', async () => {
    const target = { ...regularUser(5), roleId: 3, role: { id: 3, name: 'Retired', isSystem: false, isActive: false } };
    usersRepository.findOne.mockResolvedValue(target);
    rolesRepository.findOne.mockResolvedValue({
      id: 2,
      name: 'Viewer',
      isActive: true,
      permissions: [{ slug: 'assets.view' }],
    });
    const result: any = await service.update(
      5,
      { roleId: 2 },
      { id: 1, permissions: ['assets.view'] },
    );
    expect(result.role.name).toBe('Viewer');
  });
});
