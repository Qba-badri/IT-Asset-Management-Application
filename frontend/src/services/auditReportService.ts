import apiClient from './apiClient';

// ─── Types ────────────────────────────────────────────────────────

export type AuditReportModule = 'Asset' | 'License' | 'Inventory';

export interface AuditReportEntry {
  id: string;
  module: AuditReportModule;
  timestamp: string;
  action: string;
  entityType: string;
  entityId: number | null;
  entityLabel: string;
  actorName: string;
  details: string;
}

export interface AuditReportQuery {
  module?: AuditReportModule;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditReportResponse {
  data: AuditReportEntry[];
  total: number;
}

// ─── Service ──────────────────────────────────────────────────────

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const auditReportService = {
  async getAll(query?: AuditReportQuery): Promise<AuditReportResponse> {
    const response = await apiClient.get<AuditReportResponse>('/api/audit-report', {
      params: query,
    });
    return response.data;
  },

  async exportFile(query: AuditReportQuery | undefined, format: 'pdf' | 'excel'): Promise<void> {
    const response = await apiClient.get('/api/audit-report/export', {
      params: { ...query, format },
      responseType: 'blob',
    });
    const date = new Date().toISOString().split('T')[0];
    const filename = `audit-report-${date}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    downloadBlob(response.data, filename);
  },
};
