import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
export declare class RbacService {
    private roleRepository;
    private permissionRepository;
    constructor(roleRepository: Repository<Role>, permissionRepository: Repository<Permission>);
    findAllRoles(): Promise<Role[]>;
    findOneRole(id: number): Promise<Role>;
    createRole(name: string, description: string, permissionIds: number[]): Promise<Role>;
    updateRole(id: number, name: string, description: string, permissionIds: number[]): Promise<Role>;
    deleteRole(id: number): Promise<void>;
    findAllPermissions(): Promise<Permission[]>;
    findOnePermission(id: number): Promise<Permission>;
    createPermission(slug: string, module: string, description: string): Promise<Permission>;
    updatePermission(id: number, slug: string, module: string, description: string): Promise<Permission>;
    deletePermission(id: number): Promise<void>;
}
