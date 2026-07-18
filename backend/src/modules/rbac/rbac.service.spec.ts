import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { RbacService } from './rbac.service';
import { AuditAction } from '../../entities/audit-event.entity';

describe('RbacService status management', () => {
  let roleRepository: any;
  let permissionRepository: any;
  let userRepository: any;
  let manager: any;
  let dataSource: any;
  let auditEvents: any;
  let service: RbacService;

  const adminRole = { id: 1, name: 'Admin', isActive: true, isSystem: true, permissions: [] };
  const managerRole = { id: 2, name: 'Manager', isActive: true, isSystem: false, permissions: [] };

  beforeEach(() => {
    roleRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      remove: jest.fn(),
      create: jest.fn((x: any) => x),
      save: jest.fn(async (x: any) => x),
      createQueryBuilder: jest.fn(),
    };
    permissionRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      remove: jest.fn(),
      create: jest.fn((x: any) => x),
      save: jest.fn(async (x: any) => x),
    };
    userRepository = { count: jest.fn().mockResolvedValue(0) };
    manager = {
      findOne: jest.fn(),
      save: jest.fn(async (x: any) => x),
    };
    dataSource = { transaction: jest.fn(async (cb: any) => cb(manager)) };
    auditEvents = { logEvent: jest.fn() };
    service = new RbacService(
      roleRepository,
      permissionRepository,
      userRepository,
      dataSource,
      auditEvents,
    );
  });

  describe('setRoleStatus', () => {
    it('refuses to deactivate a system role (403)', async () => {
      manager.findOne.mockResolvedValue({ ...adminRole });
      userRepository.count.mockResolvedValue(1);
      roleRepository.findOne = jest.fn().mockResolvedValue({ ...adminRole });
      await expect(service.setRoleStatus(1, false, 99)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(manager.save).not.toHaveBeenCalled();
      expect(auditEvents.logEvent).not.toHaveBeenCalled();
    });

    it('deactivates a normal role and writes the audit record in the same transaction', async () => {
      roleRepository.findOne = jest.fn().mockResolvedValue({ ...managerRole });
      userRepository.count
        .mockResolvedValueOnce(5) // totalAssignedCount
        .mockResolvedValueOnce(3); // activeAssignedCount
      manager.findOne.mockResolvedValue({ ...managerRole });

      const result = await service.setRoleStatus(2, false, 99);

      expect(result.isActive).toBe(false);
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(auditEvents.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.UPDATE,
          entityType: 'Role',
          entityId: 2,
          actorId: 99,
          metadata: expect.objectContaining({
            field: 'isActive',
            from: true,
            to: false,
            totalAssignedCount: 5,
            activeAssignedCount: 3,
          }),
        }),
        manager, // same transaction — atomic with the status write
      );
    });

    it('is a no-op (no audit) when the status is unchanged', async () => {
      roleRepository.findOne = jest.fn().mockResolvedValue({ ...managerRole });
      manager.findOne.mockResolvedValue({ ...managerRole });
      await service.setRoleStatus(2, true, 99);
      expect(manager.save).not.toHaveBeenCalled();
      expect(auditEvents.logEvent).not.toHaveBeenCalled();
    });
  });

  describe('deleteRole protections', () => {
    it('never deletes a system role (403)', async () => {
      roleRepository.findOne = jest.fn().mockResolvedValue({ ...adminRole });
      await expect(service.deleteRole(1)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(roleRepository.remove).not.toHaveBeenCalled();
    });

    it('refuses to hard-delete a role with assigned users (409)', async () => {
      roleRepository.findOne = jest.fn().mockResolvedValue({ ...managerRole });
      userRepository.count.mockResolvedValue(4);
      await expect(service.deleteRole(2)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(roleRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('updateRole', () => {
    it('refuses to rename a system role (403)', async () => {
      roleRepository.findOne = jest.fn().mockResolvedValue({ ...adminRole });
      await expect(
        service.updateRole(1, 'SuperUser', 'renamed', []),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects newly-added inactive permissions (400) but preserves already-assigned ones', async () => {
      const inactiveAssigned = { id: 10, slug: 'legacy.view', isActive: false };
      const inactiveNew = { id: 11, slug: 'dead.manage', isActive: false };
      const active = { id: 12, slug: 'assets.view', isActive: true };

      roleRepository.findOne = jest.fn().mockResolvedValue({
        ...managerRole,
        permissions: [inactiveAssigned],
      });

      // Retaining the assigned inactive permission plus an active one is fine.
      permissionRepository.find.mockResolvedValueOnce([inactiveAssigned, active]);
      const updated = await service.updateRole(2, 'Manager', 'd', [10, 12]);
      expect(updated.permissions).toEqual([inactiveAssigned, active]);

      // Adding a NEW inactive permission is rejected, naming the slug.
      roleRepository.findOne = jest.fn().mockResolvedValue({
        ...managerRole,
        permissions: [inactiveAssigned],
      });
      permissionRepository.find.mockResolvedValueOnce([inactiveAssigned, inactiveNew]);
      await expect(
        service.updateRole(2, 'Manager', 'd', [10, 11]),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects assigning an inactive permission to a new role (400)', async () => {
      permissionRepository.find.mockResolvedValueOnce([
        { id: 11, slug: 'dead.manage', isActive: false },
      ]);
      await expect(
        service.createRole('New', 'd', [11]),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('impact + permission status', () => {
    it('reports total vs active assignment counts for a role', async () => {
      roleRepository.findOne = jest.fn().mockResolvedValue({ ...managerRole });
      userRepository.count
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(4);
      await expect(service.getRoleImpact(2)).resolves.toEqual({
        totalAssignedCount: 7,
        activeAssignedCount: 4,
      });
    });

    it('reports affected role names for a permission and audits with the same counts', async () => {
      const perm = { id: 5, slug: 'assets.view', isActive: true };
      permissionRepository.findOne.mockResolvedValue(perm);
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([
            { id: 1, name: 'Admin', isActive: true },
            { id: 2, name: 'Manager', isActive: false },
          ]),
      };
      roleRepository.createQueryBuilder.mockReturnValue(qb);
      manager.findOne.mockResolvedValue({ ...perm });

      await service.setPermissionStatus(5, false, 99);

      expect(auditEvents.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'Permission',
          metadata: expect.objectContaining({
            totalAssignedCount: 2,
            activeAssignedCount: 1,
            affectedNames: ['Admin'],
          }),
        }),
        manager,
      );
    });

    it('refuses to delete a permission still mapped to roles (409)', async () => {
      permissionRepository.findOne.mockResolvedValue({ id: 5, slug: 'assets.view' });
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 1, name: 'Admin', isActive: true }]),
      };
      roleRepository.createQueryBuilder.mockReturnValue(qb);
      await expect(service.deletePermission(5)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(permissionRepository.remove).not.toHaveBeenCalled();
    });
  });
});
