import apiClient from './apiClient';

export interface Permission {
    id: number;
    slug: string;
    module: string;
    description: string;
    name?: string; // Optional because backend returns slug
}

export interface Role {
    id: number;
    name: string;
    description: string;
    permissions: Permission[];
    usersCount?: number; // Backend might not return this yet
    status?: 'active' | 'inactive';
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
    }
};
