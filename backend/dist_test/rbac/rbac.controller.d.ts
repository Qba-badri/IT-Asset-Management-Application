import { RbacService } from './rbac.service';
export declare class RbacController {
    private readonly rbacService;
    constructor(rbacService: RbacService);
    getRoles(): Promise<import("../entities/role.entity").Role[]>;
    createRole(body: {
        name: string;
        description: string;
        permissionIds: number[];
    }): Promise<import("../entities/role.entity").Role>;
    updateRole(id: number, body: {
        name: string;
        description: string;
        permissionIds: number[];
    }): Promise<import("../entities/role.entity").Role>;
    deleteRole(id: number): Promise<{
        message: string;
    }>;
    getPermissions(): Promise<import("../entities/permission.entity").Permission[]>;
    createPermission(body: {
        slug: string;
        module: string;
        description: string;
    }): Promise<import("../entities/permission.entity").Permission>;
    updatePermission(id: number, body: {
        slug: string;
        module: string;
        description: string;
    }): Promise<import("../entities/permission.entity").Permission>;
    deletePermission(id: number): Promise<{
        message: string;
    }>;
}
