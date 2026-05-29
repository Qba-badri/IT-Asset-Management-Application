import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from '../../entities/role.entity';
import { Permission } from '../../entities/permission.entity';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
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

  async createRole(
    name: string,
    description: string,
    permissionIds: number[],
  ): Promise<Role> {
    const permissions =
      permissionIds.length > 0
        ? await this.permissionRepository.find({
            where: { id: In(permissionIds) },
          })
        : [];
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

    role.name = name;
    role.description = description;

    if (permissionIds && permissionIds.length > 0) {
      role.permissions = await this.permissionRepository.find({
        where: { id: In(permissionIds) },
      });
    } else {
      role.permissions = [];
    }

    return this.roleRepository.save(role);
  }

  async deleteRole(id: number): Promise<void> {
    const role = await this.findOneRole(id);
    await this.roleRepository.remove(role);
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

  async createPermission(
    slug: string,
    module: string,
    description: string,
  ): Promise<Permission> {
    const permission = this.permissionRepository.create({
      slug,
      module,
      description,
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

    permission.slug = slug;
    permission.module = module;
    permission.description = description;

    return this.permissionRepository.save(permission);
  }

  async deletePermission(id: number): Promise<void> {
    const permission = await this.findOnePermission(id);
    await this.permissionRepository.remove(permission);
  }
}
