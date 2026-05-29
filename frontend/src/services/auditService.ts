import apiClient from './apiClient';

export interface AuditEvent {
    id: number;
    action: string;
    entityType: string;
    entityId?: number;
    actorId?: number;
    metadata: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
}

const auditService = {
    getMyActivity: async (): Promise<AuditEvent[]> => {
        const response = await apiClient.get('/audit-events/my-activity');
        return response.data.data;
    },
    async getRecentActivity(limit: number = 10): Promise<any[]> {
        const response = await apiClient.get(`/audit-logs/recent?limit=${limit}`);
        return response.data;
    },
    async getEntityHistory(type: string, id: number): Promise<any[]> {
        const response = await apiClient.get(`/audit-logs/entity?type=${type}&id=${id}`);
        return response.data;
    }
};

export default auditService;
