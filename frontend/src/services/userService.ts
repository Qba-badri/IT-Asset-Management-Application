import apiClient from './apiClient';
import { Role } from './rbacService';

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
    createdAt?: string;
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

    async getUserInventory(id: number): Promise<User> {
        const response = await apiClient.get<User>(`/users/${id}/inventory`);
        return response.data;
    },

    async getUser(id: number): Promise<User> {
        const response = await apiClient.get<User>(`/users/${id}`);
        return response.data;
    },

    async syncAzureUsers(): Promise<any> {
        const response = await apiClient.post('/users/sync/azure');
        return response.data;
    }
};
