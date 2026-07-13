import apiClient from './apiClient';
import { PaginatedResponse } from './catalogService';

// ─── Types ────────────────────────────────────────────────────────

export type AuditAction =
  | 'issue' | 'return' | 'partial_return' | 'transfer'
  | 'repair_start' | 'repair_end' | 'lost' | 'write_off'
  | 'adjust' | 'dispose' | 'create' | 'update' | 'delete'
  | 'login' | 'approval' | 'rejection';

export interface AuditActor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AuditEvent {
  id: number;
  action: AuditAction;
  entityType: string;
  entityId?: number;
  actorId?: number;
  actor?: AuditActor;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditEventQuery {
  action?: AuditAction;
  entityType?: string;
  entityId?: number;
  actorId?: number;
  /** Free-text search by actor name / email */
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ─── Service ──────────────────────────────────────────────────────

export const auditEventsService = {
  async getAll(query?: AuditEventQuery): Promise<PaginatedResponse<AuditEvent>> {
    const response = await apiClient.get<PaginatedResponse<AuditEvent>>(
      '/api/audit-events',
      { params: query },
    );
    return response.data;
  },

  async getUserActivity(
    userId: number,
    query?: AuditEventQuery,
  ): Promise<PaginatedResponse<AuditEvent>> {
    const response = await apiClient.get<PaginatedResponse<AuditEvent>>(
      `/api/audit-events/user/${userId}`,
      { params: query },
    );
    return response.data;
  },

  async getEntityTimeline(
    entityType: string,
    entityId: number,
  ): Promise<AuditEvent[]> {
    const response = await apiClient.get<AuditEvent[]>(
      `/api/audit-events/entity/${entityType}/${entityId}`,
    );
    return response.data;
  },

  /**
   * Fetches all matching audit events and triggers a CSV download in the browser.
   */
  async exportCsv(query?: AuditEventQuery, filename = 'activity-logs.csv'): Promise<void> {
    const response = await apiClient.get<AuditEvent[]>('/api/audit-events/export', {
      params: query,
    });
    const events = response.data;

    const headers = ['ID', 'Timestamp', 'Action', 'Entity Type', 'Entity ID', 'Actor', 'Email', 'IP Address', 'Metadata'];
    const rows = events.map((e) => [
      e.id,
      new Date(e.createdAt).toISOString(),
      e.action,
      e.entityType,
      e.entityId ?? '',
      e.actor ? `${e.actor.firstName} ${e.actor.lastName}` : 'System',
      e.actor?.email ?? '',
      e.ipAddress ?? '',
      JSON.stringify(e.metadata),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
