import apiClient from './apiClient';
import { Role } from './rbacService';

export type UserSource = 'MANUAL' | 'AZURE_AD' | 'QPEOPLE';

export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    isActive: boolean;
    lastLogin?: string;
    settings?: any;
    location?: string;
    phoneNumber?: string;
    tokenVersion?: number;
    assignedAssets?: any[];
    licenseAssignments?: any[];
    inventoryAssignments?: any[];
    createdAt?: string;
    departmentId?: number | null;
    department?: { id: number; name: string } | null;
    designation?: string | null;
    reportingManagerName?: string | null;
    source?: UserSource;
    qpeopleId?: string | null;
}

export const userService = {
    async getUsers(): Promise<User[]> {
        const response = await apiClient.get<User[]>('/users');
        return response.data;
    },

    async createUser(data: any): Promise<User> {
        const response = await apiClient.post<User>('/users', data);
        return response.data;
    },

    async updateUser(id: number, data: any): Promise<User> {
        const response = await apiClient.put<User>(`/users/${id}`, data);
        return response.data;
    },

    async deleteUser(id: number): Promise<void> {
        await apiClient.delete(`/users/${id}`);
    },

    async bulkSetActive(ids: number[], isActive: boolean): Promise<{ affected: number; skippedSelf: boolean }> {
        const response = await apiClient.post('/users/bulk-status', { ids, isActive });
        return response.data;
    },

    async bulkDelete(ids: number[]): Promise<{ affected: number; skippedSelf: boolean }> {
        const response = await apiClient.post('/users/bulk-delete', { ids });
        return response.data;
    },

    async getUserInventory(id: number): Promise<User> {
        const response = await apiClient.get<User>(`/users/${id}/inventory`);
        return response.data;
    },

    // Self-service portfolio for the logged-in user (no users.view needed).
    async getMyInventory(): Promise<User> {
        const response = await apiClient.get<User>('/users/me/inventory');
        return response.data;
    },

    async getUser(id: number): Promise<User> {
        const response = await apiClient.get<User>(`/users/${id}`);
        return response.data;
    },

    async syncAzureUsers(): Promise<any> {
        const response = await apiClient.post('/users/sync/azure');
        return response.data;
    },

    async testAzureConnection(): Promise<any> {
        const response = await apiClient.post('/users/sync/azure/test');
        return response.data;
    },

    async syncQPeopleUsers(): Promise<any> {
        const response = await apiClient.post('/users/sync/qpeople');
        return response.data;
    },

    async testQPeopleConnection(): Promise<any> {
        const response = await apiClient.post('/users/sync/qpeople/test');
        return response.data;
    }
};
