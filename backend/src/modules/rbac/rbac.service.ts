import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Role } from '../../entities/role.entity';
import { Permission } from '../../entities/permission.entity';
import { User } from '../../entities/user.entity';
import {
  PERMISSION_CATALOG,
  CatalogPermission,
} from '../../common/permission-catalog';
import { AuditEventsService } from '../audit-events/audit-events.service';
import { AuditAction } from '../../entities/audit-event.entity';

/**
 * Impact of deactivating a record: how many assignments exist in total
 * (preserved either way) and how many of them are currently active — i.e.
 * would lose effective access immediately.
 */
export interface StatusImpact {
  totalAssignedCount: number;
  activeAssignedCount: number;
  affectedNames?: string[];
}

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private auditEvents: AuditEventsService,
  ) {}

  async findAllRoles(): Promise<Role[]> {
    return this.roleRepository.find({ relations: ['permissions'] });
  }

  async findOneRole(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  /**
   * Inactive permissions cannot be *newly* assigned. Already-assigned ones
   * (when editing an existing role) are preserved — deactivation must not
   * strip mappings, and an edit that touches other fields must not be forced
   * to drop them either.
   */
  private async loadPermissionsForAssignment(
    permissionIds: number[],
    existing: Permission[] = [],
  ): Promise<Permission[]> {
    if (!permissionIds || permissionIds.length === 0) return [];
    const permissions = await this.permissionRepository.find({
      where: { id: In(permissionIds) },
    });
    const existingIds = new Set(existing.map((p) => p.id));
    const newlyAddedInactive = permissions.filter(
      (p) => p.isActive === false && !existingIds.has(p.id),
    );
    if (newlyAddedInactive.length > 0) {
      throw new BadRequestException(
        `Inactive permissions cannot be assigned: ${newlyAddedInactive
          .map((p) => p.slug)
          .join(', ')}. Reactivate them first.`,
      );
    }
    return permissions;
  }

  async createRole(
    name: string,
    description: string,
    permissionIds: number[],
  ): Promise<Role> {
    const permissions = await this.loadPermissionsForAssignment(permissionIds);
    // isSystem is deliberately not accepted from any request.
    const role = this.roleRepository.create({
      name,
      description,
      permissions,
    });
    return this.roleRepository.save(role);
  }

  async updateRole(
    id: number,
    name: string,
    description: string,
    permissionIds: number[],
  ): Promise<Role> {
    const role = await this.findOneRole(id);

    if (role.isSystem && name && name !== role.name) {
      throw new ForbiddenException(
        `"${role.name}" is a protected system role and cannot be renamed.`,
      );
    }

    role.name = name;
    role.description = description;
    role.permissions = await this.loadPermissionsForAssignment(
      permissionIds,
      role.permissions,
    );

    return this.roleRepository.save(role);
  }

  async deleteRole(id: number): Promise<void> {
    const role = await this.findOneRole(id);
    if (role.isSystem) {
      throw new ForbiddenException(
        `"${role.name}" is a protected system role and cannot be deleted.`,
      );
    }
    // Users referencing the role — active or not — are historical data that a
    // hard delete would orphan. Deactivation is the supported path.
    const assignedUsers = await this.userRepository.count({
      where: { roleId: id },
    });
    if (assignedUsers > 0) {
      throw new ConflictException(
        `Role "${role.name}" is assigned to ${assignedUsers} user(s) and cannot be deleted. Deactivate it instead.`,
      );
    }
    await this.roleRepository.remove(role);
  }

  /** Users holding the role: everyone (preserved) vs currently active (lose access now). */
  async getRoleImpact(id: number): Promise<StatusImpact> {
    await this.findOneRole(id);
    const [totalAssignedCount, activeAssignedCount] = await Promise.all([
      this.userRepository.count({ where: { roleId: id } }),
      this.userRepository.count({ where: { roleId: id, isActive: true } }),
    ]);
    return { totalAssignedCount, activeAssignedCount };
  }

  /** Roles holding the permission: all (mappings preserved) vs currently active. */
  async getPermissionImpact(id: number): Promise<StatusImpact> {
    await this.findOnePermission(id);
    const roles = await this.roleRepository
      .createQueryBuilder('role')
      .innerJoin('role.permissions', 'permission', 'permission.id = :id', { id })
      .getMany();
    const activeRoles = roles.filter((r) => r.isActive !== false);
    return {
      totalAssignedCount: roles.length,
      activeAssignedCount: activeRoles.length,
      affectedNames: activeRoles.map((r) => r.name),
    };
  }

  /**
   * Soft (de)activation of a role. User-role assignments are untouched, so
   * reactivation restores everything; while inactive the role grants no
   * effective permissions (enforced per request in JwtStrategy).
   * The status write and its audit record commit in one transaction.
   */
  async setRoleStatus(
    id: number,
    isActive: boolean,
    actorId: number,
  ): Promise<Role> {
    const impact = await this.getRoleImpact(id);
    return this.dataSource.transaction(async (manager) => {
      const role = await manager.findOne(Role, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!role) throw new NotFoundException('Role not found');
      if (role.isSystem && !isActive) {
        throw new ForbiddenException(
          `"${role.name}" is a protected system role and cannot be deactivated.`,
        );
      }
      if (role.isActive === isActive) return role;

      const from = role.isActive;
      role.isActive = isActive;
      const saved = await manager.save(role);

      await this.auditEvents.logEvent(
        {
          action: AuditAction.UPDATE,
          entityType: 'Role',
          entityId: role.id,
          actorId,
          metadata: {
            field: 'isActive',
            from,
            to: isActive,
            name: role.name,
            totalAssignedCount: impact.totalAssignedCount,
            activeAssignedCount: impact.activeAssignedCount,
          },
        },
        manager,
      );
      return saved;
    });
  }

  /**
   * Soft (de)activation of a permission. Role-permission mappings are
   * preserved; while inactive the permission grants no access anywhere
   * (including to system roles) and cannot be newly assigned.
   */
  async setPermissionStatus(
    id: number,
    isActive: boolean,
    actorId: number,
  ): Promise<Permission> {
    const impact = await this.getPermissionImpact(id);
    return this.dataSource.transaction(async (manager) => {
      const permission = await manager.findOne(Permission, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!permission) throw new NotFoundException('Permission not found');
      if (permission.isActive === isActive) return permission;

      const from = permission.isActive;
      permission.isActive = isActive;
      const saved = await manager.save(permission);

      await this.auditEvents.logEvent(
        {
          action: AuditAction.UPDATE,
          entityType: 'Permission',
          entityId: permission.id,
          actorId,
          metadata: {
            field: 'isActive',
            from,
            to: isActive,
            slug: permission.slug,
            totalAssignedCount: impact.totalAssignedCount,
            activeAssignedCount: impact.activeAssignedCount,
            affectedNames: impact.affectedNames,
          },
        },
        manager,
      );
      return saved;
    });
  }

  async findAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find();
  }

  async findOnePermission(id: number): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });
    if (!permission) throw new NotFoundException('Permission not found');
    return permission;
  }

  /**
   * The known permissions, each flagged with whether it already exists in the
   * database. Drives the admin picker's suggestions.
   */
  async getPermissionCatalog(): Promise<
    Array<CatalogPermission & { exists: boolean }>
  > {
    const existing = new Set(
      (await this.permissionRepository.find()).map((p) => p.slug),
    );
    return PERMISSION_CATALOG.map((p) => ({ ...p, exists: existing.has(p.slug) }));
  }

  /**
   * Custom slugs are permitted: a permission may be created ahead of the code
   * that will check it. What is *not* permitted is a malformed slug, because
   * `Users.Delete` or `users delete` can never match a `@Permissions(...)` check
   * and would fail silently forever. Format and uniqueness are enforced; whether
   * any code actually checks the slug is reported, not blocked.
   */
  private assertValidSlug(slug: string): void {
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(slug ?? '')) {
      throw new BadRequestException(
        `Invalid permission slug "${slug}". Use lowercase words separated by dots, e.g. "assets.create".`,
      );
    }
  }

  async createPermission(
    slug: string,
    module: string,
    description: string,
  ): Promise<Permission> {
    this.assertValidSlug(slug);
    if (await this.permissionRepository.findOneBy({ slug })) {
      throw new ConflictException(`Permission "${slug}" already exists.`);
    }

    // A catalogued slug carries its own module/description; trust those over the
    // client's, so a picked permission is always registered consistently.
    const known = PERMISSION_CATALOG.find((p) => p.slug === slug);
    const permission = this.permissionRepository.create({
      slug,
      module: known?.module || module,
      description: description || known?.description || '',
    });
    return this.permissionRepository.save(permission);
  }

  async updatePermission(
    id: number,
    slug: string,
    module: string,
    description: string,
  ): Promise<Permission> {
    const permission = await this.findOnePermission(id);

    // A changed slug still has to be well-formed and unique. An unchanged slug is
    // left alone, so a legacy row can have its description corrected.
    if (slug && slug !== permission.slug) {
      this.assertValidSlug(slug);
      if (await this.permissionRepository.findOneBy({ slug })) {
        throw new ConflictException(`Permission "${slug}" already exists.`);
      }
      permission.slug = slug;
    }
    if (module) permission.module = module;
    if (description) permission.description = description;

    return this.permissionRepository.save(permission);
  }

  async deletePermission(id: number): Promise<void> {
    const permission = await this.findOnePermission(id);
    // A permission still attached to roles is a live mapping a hard delete
    // would destroy. Deactivation preserves it while revoking access.
    const impact = await this.getPermissionImpact(id);
    if (impact.totalAssignedCount > 0) {
      throw new ConflictException(
        `Permission "${permission.slug}" is assigned to ${impact.totalAssignedCount} role(s) and cannot be deleted. Deactivate it instead.`,
      );
    }
    await this.permissionRepository.remove(permission);
  }
}
