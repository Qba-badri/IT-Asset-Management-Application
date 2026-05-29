import apiClient from './apiClient';
import { PaginatedResponse } from './catalogService';

// ─── Types ────────────────────────────────────────────────────────

export type AuditAction =
  | 'issue' | 'return' | 'partial_return' | 'transfer'
  | 'repair_start' | 'repair_end' | 'lost' | 'write_off'
  | 'adjust' | 'dispose' | 'create' | 'update' | 'delete'
  | 'login' | 'approval' | 'rejection';

export interface AuditEvent {
  id: number;
  action: AuditAction;
  entityType: string;
  entityId?: number;
  actorId?: number;
  actor?: { id: number; firstName: string; lastName: string; email: string };
  metadata: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface AuditEventQuery {
  action?: AuditAction;
  entityType?: string;
  entityId?: number;
  actorId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ─── Service ──────────────────────────────────────────────────────

export const auditEventsService = {
  async getAll(query?: AuditEventQuery): Promise<PaginatedResponse<AuditEvent>> {
    const response = await apiClient.get<PaginatedResponse<AuditEvent>>('/api/audit-events', { params: query });
    return response.data;
  },

  async getEntityTimeline(entityType: string, entityId: number): Promise<AuditEvent[]> {
    const response = await apiClient.get<AuditEvent[]>(`/api/audit-events/entity/${entityType}/${entityId}`);
    return response.data;
  },
};
