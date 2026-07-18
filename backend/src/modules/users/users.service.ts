import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import {
  InventoryAssignment,
  InventoryAssignmentStatus,
} from '../../entities/inventory-assignment.entity';
import * as bcrypt from 'bcrypt';
import { AuditEventsService } from '../audit-events/audit-events.service';
import { AuditAction } from '../../entities/audit-event.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(InventoryAssignment)
    private inventoryAssignmentRepository: Repository<InventoryAssignment>,
    private dataSource: DataSource,
    private auditEvents: AuditEventsService,
  ) {}

  /**
   * Concurrency-safe last-admin guard. Locks the rows of all currently
   * active users holding a system role (FOR UPDATE), so two simultaneous
   * deactivations cannot both observe "another admin remains" and jointly
   * remove the last one. Throws 409 when deactivating `targetIds` would
   * leave no active system-role user.
   *
   * Must run inside the same transaction that performs the deactivation.
   */
  private async assertNotLastActiveSystemAdmins(
    manager: EntityManager,
    targetIds: number[],
  ): Promise<void> {
    const systemRoleIds = (
      await manager.getRepository(Role).find({ where: { isSystem: true } })
    ).map((r) => r.id);
    if (systemRoleIds.length === 0) return;

    // Lock the active system-admin rows to serialize concurrent deactivations.
    const activeAdmins = await manager
      .getRepository(User)
      .createQueryBuilder('user')
      .setLock('pessimistic_write')
      .where('user.role_id IN (:...roleIds)', { roleIds: systemRoleIds })
      .andWhere('user.is_active = true')
      .getMany();

    const targets = new Set(targetIds);
    const affectsSystemAdmin = activeAdmins.some((u) => targets.has(u.id));
    if (!affectsSystemAdmin) return;

    const remaining = activeAdmins.filter((u) => !targets.has(u.id));
    if (remaining.length === 0) {
      throw new ConflictException(
        'Cannot deactivate the last active administrator account.',
      );
    }
  }

  /** Strips credential material before a user object leaves the API. */
  private sanitize<T extends User>(user: T): Omit<T, 'passwordHash'> {
    const { passwordHash, ...safe } = user;
    return safe as Omit<T, 'passwordHash'>;
  }

  async findAll(): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.usersRepository.find({
      relations: ['role'],
      order: { createdAt: 'DESC' },
    });
    return users.map((u) => this.sanitize(u));
  }

  /** Internal use only — includes passwordHash. */
  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** API-facing variant of findOne with credentials stripped. */
  async findOnePublic(id: number): Promise<Omit<User, 'passwordHash'>> {
    return this.sanitize(await this.findOne(id));
  }

  async create(data: any): Promise<User> {
    // Hash password
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(data.password, salt);

    // Find role
    const role = await this.rolesRepository.findOneBy({ id: data.roleId });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isActive === false) {
      throw new BadRequestException(
        `Role "${role.name}" is inactive and cannot be assigned.`,
      );
    }

    const newUser = this.usersRepository.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordHash,
      role,
      isActive: true,
      departmentId: data.departmentId ?? null,
      designation: data.designation ?? null,
    });

    return this.sanitize(await this.usersRepository.save(newUser)) as User;
  }

  /**
   * @param actor The authenticated user performing the update. Required when the
   *   update may change privileged fields (roleId) so we can enforce that a user
   *   cannot escalate their own privileges or grant a role more powerful than
   *   their own. Omit only for trusted internal callers with no role change.
   */
  async update(
    id: number,
    data: any,
    actor?: { id: number; permissions: string[] },
  ): Promise<User> {
    const user = await this.findOne(id);

    if (data.firstName) user.firstName = data.firstName;
    if (data.lastName) user.lastName = data.lastName;
    if (data.email) user.email = data.email;

    if (data.roleId && data.roleId !== user.roleId) {
      await this.applyRoleChange(user, data.roleId, actor);
    }

    if (data.password) {
      const salt = await bcrypt.genSalt();
      user.passwordHash = await bcrypt.hash(data.password, salt);
    }

    if (data.departmentId !== undefined) {
      user.departmentId = data.departmentId;
      // Keep the eager-loaded relation from resaving a stale department
      user.department = undefined;
    }
    if (data.designation !== undefined) user.designation = data.designation;

    const statusChanging =
      data.isActive !== undefined && data.isActive !== user.isActive;

    if (!statusChanging) {
      return this.sanitize(await this.usersRepository.save(user)) as User;
    }

    const deactivating = data.isActive === false;
    if (deactivating && actor && actor.id === user.id) {
      throw new BadRequestException('You cannot deactivate your own account.');
    }

    // Status changes run in a transaction: the last-admin guard locks the
    // active admin rows (concurrency-safe), and the audit record commits
    // atomically with the change.
    return this.dataSource.transaction(async (manager) => {
      if (deactivating) {
        await this.assertNotLastActiveSystemAdmins(manager, [user.id]);
        // Deactivation also invalidates existing sessions immediately
        user.tokenVersion += 1;
      }
      const from = user.isActive;
      user.isActive = data.isActive;
      const saved = await manager.save(user);

      await this.auditEvents.logEvent(
        {
          action: AuditAction.UPDATE,
          entityType: 'User',
          entityId: user.id,
          actorId: actor?.id,
          metadata: { field: 'isActive', from, to: data.isActive, email: user.email },
        },
        manager,
      );
      return this.sanitize(saved) as User;
    });
  }

  /**
   * Assigns a new role to `user`, enforcing anti-escalation rules:
   *  - the actor cannot change their own role (prevents self-escalation);
   *  - the actor cannot grant a role that carries any permission the actor does
   *    not already hold (prevents privilege amplification).
   */
  private async applyRoleChange(
    user: User,
    roleId: number,
    actor?: { id: number; permissions: string[] },
  ): Promise<void> {
    if (!actor) {
      throw new ForbiddenException('Role changes require an authenticated actor');
    }
    if (actor.id === user.id) {
      throw new ForbiddenException('You cannot change your own role');
    }

    const role = await this.rolesRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });
    if (!role) throw new NotFoundException('Role not found');
    // A user may keep an inactive role they already hold, but an inactive
    // role cannot be newly assigned.
    if (role.isActive === false) {
      throw new BadRequestException(
        `Role "${role.name}" is inactive and cannot be assigned.`,
      );
    }

    const actorPermissions = new Set(actor.permissions || []);
    const grantsBeyondActor = (role.permissions || []).some(
      (p) => !actorPermissions.has(p.slug),
    );
    if (grantsBeyondActor) {
      throw new ForbiddenException(
        'You cannot assign a role with permissions you do not hold',
      );
    }

    user.role = role;
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.softDelete(id);
  }

  private static validateBulkIds(ids: unknown, actorId: number): number[] {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('ids must be a non-empty array');
    }
    const clean = ids.map(Number).filter(n => Number.isInteger(n) && n > 0);
    if (clean.length !== ids.length) {
      throw new BadRequestException('ids must be positive integers');
    }
    // Never let an admin bulk-affect their own account (lockout guard)
    return clean.filter(id => id !== actorId);
  }

  async bulkSetActive(ids: number[], isActive: boolean, actorId: number) {
    const targets = UsersService.validateBulkIds(ids, actorId);
    if (targets.length === 0) return { affected: 0, skippedSelf: ids.length > 0 };

    // Transaction: the last-admin guard's row locks and the status write
    // (plus its audit record) must commit or roll back together.
    return this.dataSource.transaction(async (manager) => {
      if (isActive === false) {
        await this.assertNotLastActiveSystemAdmins(manager, targets);
        // Deactivation also invalidates existing sessions immediately
        await manager
          .getRepository(User)
          .increment({ id: In(targets) }, 'tokenVersion', 1);
      }
      const result = await manager
        .getRepository(User)
        .update({ id: In(targets) }, { isActive: !!isActive });

      await this.auditEvents.logEvent(
        {
          action: AuditAction.UPDATE,
          entityType: 'User',
          actorId,
          metadata: {
            field: 'isActive',
            to: !!isActive,
            bulk: true,
            targetIds: targets,
            affected: result.affected ?? 0,
          },
        },
        manager,
      );

      return { affected: result.affected ?? 0, skippedSelf: targets.length !== ids.length };
    });
  }

  async bulkRemove(ids: number[], actorId: number) {
    const targets = UsersService.validateBulkIds(ids, actorId);
    if (targets.length === 0) return { affected: 0, skippedSelf: ids.length > 0 };
    const result = await this.usersRepository.softDelete({ id: In(targets) });
    return { affected: result.affected ?? 0, skippedSelf: targets.length !== ids.length };
  }

  async getUserInventory(id: number): Promise<Omit<User, 'passwordHash'> & {
    inventoryAssignments: InventoryAssignment[];
  }> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: [
        'assignedAssets',
        'licenseAssignments',
        'licenseAssignments.license',
      ],
    });
    if (!user) throw new NotFoundException('User not found');

    // Consumable inventory currently held by the user (not yet returned).
    const inventoryAssignments = await this.inventoryAssignmentRepository.find({
      where: { userId: id, status: InventoryAssignmentStatus.ASSIGNED },
      relations: ['item'],
      order: { assignmentDate: 'DESC' },
    });

    return { ...this.sanitize(user), inventoryAssignments };
  }
}
