import apiClient from './apiClient';
import { PaginatedResponse, CatalogItem } from './catalogService';
import { AssetUnit, AssetCondition } from './assetUnitsService';

// ─── Types ────────────────────────────────────────────────────────

export type AssignmentStatus = 'active' | 'returned' | 'partially_returned' | 'overdue' | 'written_off';

export interface Assignment {
  id: number;
  catalogItemId: number;
  catalogItem?: CatalogItem;
  assetUnitId?: number;
  assetUnit?: AssetUnit;
  assigneeId: number;
  assignee?: { id: number; firstName: string; lastName: string; email: string };
  assignedById: number;
  locationId?: number;
  departmentId?: number;
  department?: { id: number; name: string };
  quantity: number;
  returnedQuantity: number;
  dueDate?: string;
  status: AssignmentStatus;
  notes?: string;
  returnTransactions?: ReturnTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface ReturnTransaction {
  id: number;
  assignmentId: number;
  quantity: number;
  conditionOnReturn: AssetCondition;
  returnedById: number;
  processedById: number;
  notes?: string;
  createdAt: string;
}

export interface IssueInput {
  catalogItemId: number;
  assetUnitId?: number;
  assigneeId: number;
  quantity?: number;
  locationId?: number;
  departmentId?: number;
  dueDate?: string;
  notes?: string;
}

export interface ReturnInput {
  assignmentId: number;
  quantity?: number;
  condition?: AssetCondition;
  returnToLocationId?: number;
  notes?: string;
}

export interface TransferInput {
  assignmentId: number;
  toAssigneeId?: number;
  toLocationId?: number;
  notes?: string;
}

export interface WriteOffInput {
  assignmentId: number;
  reason: string;
  approvedById?: number;
  notes?: string;
}

export interface HoldingsQuery {
  assigneeId?: number;
  departmentId?: number;
  status?: AssignmentStatus;
  page?: number;
  limit?: number;
}

export interface OverdueQuery {
  assigneeId?: number;
  departmentId?: number;
  page?: number;
  limit?: number;
}

// ─── Service ──────────────────────────────────────────────────────

export const assignmentsService = {
  async issue(data: IssueInput): Promise<Assignment> {
    const response = await apiClient.post<Assignment>('/api/issue', data);
    return response.data;
  },

  async processReturn(data: ReturnInput): Promise<ReturnTransaction> {
    const response = await apiClient.post<ReturnTransaction>('/api/return', data);
    return response.data;
  },

  async transfer(data: TransferInput): Promise<Assignment> {
    const response = await apiClient.post<Assignment>('/api/transfer', data);
    return response.data;
  },

  async writeOff(data: WriteOffInput): Promise<Assignment> {
    const response = await apiClient.post<Assignment>('/api/write-off', data);
    return response.data;
  },

  async getHoldings(query?: HoldingsQuery): Promise<PaginatedResponse<Assignment>> {
    const response = await apiClient.get<PaginatedResponse<Assignment>>('/api/holdings', { params: query });
    return response.data;
  },

  async getOverdue(query?: OverdueQuery): Promise<PaginatedResponse<Assignment>> {
    const response = await apiClient.get<PaginatedResponse<Assignment>>('/api/overdue', { params: query });
    return response.data;
  },

  async getById(id: number): Promise<Assignment> {
    const response = await apiClient.get<Assignment>(`/api/assignments/${id}`);
    return response.data;
  },
};
