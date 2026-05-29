import apiClient from './apiClient';

export interface Category {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
    allowedTargetTypes: string[];
    createdAt: string;
    updatedAt: string;
}

export const categoryService = {
    async getCategories(): Promise<Category[]> {
        const response = await apiClient.get<Category[]>('/categories');
        return response.data;
    },

    async getCategory(id: number): Promise<Category> {
        const response = await apiClient.get<Category>(`/categories/${id}`);
        return response.data;
    },

    async createCategory(data: { name: string; description: string; isActive?: boolean; allowedTargetTypes?: string[] }): Promise<Category> {
        const response = await apiClient.post<Category>('/categories', data);
        return response.data;
    },

    async updateCategory(id: number, data: { name: string; description: string; isActive: boolean; allowedTargetTypes?: string[] }): Promise<Category> {
        const response = await apiClient.put<Category>(`/categories/${id}`, data);
        return response.data;
    },

    async deleteCategory(id: number): Promise<void> {
        await apiClient.delete(`/categories/${id}`);
    },
};
