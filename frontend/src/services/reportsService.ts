import apiClient from './apiClient';
import { StockLedgerEntry } from './stockService';
import { AuditEvent } from './auditEventsService';
import { Assignment } from './assignmentsService';
import { AssetUnit } from './assetUnitsService';
import { PaginatedResponse } from './catalogService';

// ─── Types ────────────────────────────────────────────────────────

export interface DashboardSummary {
  totalAssetUnits: number;
  activeAssignments: number;
  overdueAssignments: number;
  recentEvents: AuditEvent[];
}

export interface AssetHistory {
  unit: AssetUnit;
  assignments: Assignment[];
  events: AuditEvent[];
}

export interface ReportQuery {
  startDate?: string;
  endDate?: string;
  catalogItemId?: number;
  locationId?: number;
  page?: number;
  limit?: number;
}

// ─── Service ──────────────────────────────────────────────────────

export const reportsService = {
  async getLedgerReport(query?: ReportQuery): Promise<PaginatedResponse<StockLedgerEntry>> {
    const response = await apiClient.get('/api/reports/ledger', { params: query });
    return response.data;
  },

  async getWriteOffsReport(query?: ReportQuery): Promise<PaginatedResponse<Assignment>> {
    const response = await apiClient.get('/api/reports/writeoffs', { params: query });
    return response.data;
  },

  async getAssetHistory(assetUnitId: number): Promise<AssetHistory> {
    const response = await apiClient.get<AssetHistory>(`/api/reports/asset-history/${assetUnitId}`);
    return response.data;
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await apiClient.get<DashboardSummary>('/api/reports/dashboard-summary');
    return response.data;
  },
};
