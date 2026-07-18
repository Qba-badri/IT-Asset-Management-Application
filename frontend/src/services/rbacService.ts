import apiClient from './apiClient';

export interface Permission {
    id: number;
    slug: string;
    module: string;
    description: string;
    name?: string; // Optional because backend returns slug
    /** Soft-deactivation: mappings preserved, grants no access, not newly assignable. */
    isActive: boolean;
}

/**
 * Assignment counts shown before a deactivation. `totalAssignedCount` covers
 * every preserved assignment; `activeAssignedCount` is how many currently
 * active holders lose effective access immediately.
 */
export interface StatusImpact {
    totalAssignedCount: number;
    activeAssignedCount: number;
    affectedNames?: string[];
}

/**
 * A permission this build of the backend actually enforces. `exists` is true
 * once it has been created, so the admin picker can show it as already taken
 * rather than offering a duplicate.
 */
export interface CatalogPermission {
    slug: string;
    module: string;
    description: string;
    exists: boolean;
}

export interface Role {
    id: number;
    name: string;
    description: string;
    permissions: Permission[];
    usersCount?: number; // Backend might not return this yet
    status?: 'active' | 'inactive';
    /** Soft-deactivation: user assignments preserved, grants no effective permissions. */
    isActive: boolean;
    /** Built-in role (seeded Admin): cannot be renamed, deactivated, or deleted. */
    isSystem: boolean;
}

export const rbacService = {
    async getRoles(): Promise<Role[]> {
        const response = await apiClient.get<Role[]>('/rbac/roles');
        return response.data;
    },

    async getPermissions(): Promise<Permission[]> {
        const response = await apiClient.get<Permission[]>('/rbac/permissions');
        return response.data;
    },

    async getPermissionCatalog(): Promise<CatalogPermission[]> {
        const response = await apiClient.get<CatalogPermission[]>('/rbac/permissions/catalog');
        return response.data;
    },

    async createRole(data: { name: string; description: string; permissionIds: number[] }): Promise<Role> {
        const response = await apiClient.post<Role>('/rbac/roles', data);
        return response.data;
    },

    async updateRole(id: number, data: { name: string; description: string; permissionIds: number[] }): Promise<Role> {
        const response = await apiClient.put<Role>(`/rbac/roles/${id}`, data);
        return response.data;
    },

    async deleteRole(id: number): Promise<void> {
        await apiClient.delete(`/rbac/roles/${id}`);
    },

    async createPermission(data: { slug: string; module: string; description: string }): Promise<Permission> {
        const response = await apiClient.post<Permission>('/rbac/permissions', data);
        return response.data;
    },

    async updatePermission(id: number, data: { slug: string; module: string; description: string }): Promise<Permission> {
        const response = await apiClient.put<Permission>(`/rbac/permissions/${id}`, data);
        return response.data;
    },

    async deletePermission(id: number): Promise<void> {
        await apiClient.delete(`/rbac/permissions/${id}`);
    },

    async setRoleStatus(id: number, isActive: boolean): Promise<Role> {
        const response = await apiClient.patch<Role>(`/rbac/roles/${id}/status`, { isActive });
        return response.data;
    },

    async setPermissionStatus(id: number, isActive: boolean): Promise<Permission> {
        const response = await apiClient.patch<Permission>(`/rbac/permissions/${id}/status`, { isActive });
        return response.data;
    },

    async getRoleImpact(id: number): Promise<StatusImpact> {
        const response = await apiClient.get<StatusImpact>(`/rbac/roles/${id}/impact`);
        return response.data;
    },

    async getPermissionImpact(id: number): Promise<StatusImpact> {
        const response = await apiClient.get<StatusImpact>(`/rbac/permissions/${id}/impact`);
        return response.data;
    }
};
