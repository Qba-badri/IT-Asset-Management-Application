import apiClient from './apiClient';

export const retirementService = {
    getRequests: async () => {
        const response = await apiClient.get('/api/retirement/requests');
        return response.data;
    },

    getRequest: async (id: number) => {
        const response = await apiClient.get(`/api/retirement/requests/${id}`);
        return response.data;
    },

    createRequest: async (data: any) => {
        const response = await apiClient.post('/api/retirement/requests', data);
        return response.data;
    },

    submitRequest: async (id: number) => {
        const response = await apiClient.post(`/api/retirement/requests/${id}/submit`);
        return response.data;
    },

    approveTask: async (taskId: number, comments?: string) => {
        const response = await apiClient.post(`/api/retirement/tasks/${taskId}/approve`, { comments });
        return response.data;
    },
};
