import apiClient from './apiClient';
import { PaginatedResponse, CatalogItem } from './catalogService';

// ─── Types ────────────────────────────────────────────────────────

export interface StockByLocation {
  id: number;
  catalogItemId: number;
  catalogItem?: CatalogItem;
  locationId: number;
  location?: { id: number; name: string };
  quantity: number;
  updatedAt: string;
}

export type LedgerReason =
  | 'initial_stock' | 'procurement' | 'issue' | 'return'
  | 'transfer_in' | 'transfer_out' | 'adjustment' | 'write_off'
  | 'lost' | 'disposed';

export interface StockLedgerEntry {
  id: number;
  catalogItemId: number;
  catalogItem?: CatalogItem;
  locationId: number;
  location?: { id: number; name: string };
  quantityChange: number;
  runningBalance: number;
  reason: LedgerReason;
  referenceType?: string;
  referenceId?: number;
  notes?: string;
  createdById: number;
  createdBy?: { id: number; firstName: string; lastName: string };
  createdAt: string;
}

export interface StockQuery {
  catalogItemId?: number;
  locationId?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface LedgerQuery {
  catalogItemId?: number;
  locationId?: number;
  reason?: LedgerReason;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AdjustStockInput {
  catalogItemId: number;
  locationId: number;
  newQuantity: number;
  reason?: string;
  notes?: string;
}

export interface InitialStockInput {
  catalogItemId: number;
  locationId: number;
  quantity: number;
  notes?: string;
}

// ─── Service ──────────────────────────────────────────────────────

export const stockService = {
  async getAll(query?: StockQuery): Promise<PaginatedResponse<StockByLocation>> {
    const response = await apiClient.get<PaginatedResponse<StockByLocation>>('/api/stock', { params: query });
    return response.data;
  },

  async initialize(data: InitialStockInput): Promise<StockByLocation> {
    const response = await apiClient.post<StockByLocation>('/api/stock/initialize', data);
    return response.data;
  },

  async adjust(data: AdjustStockInput): Promise<StockByLocation> {
    const response = await apiClient.post<StockByLocation>('/api/stock/adjust', data);
    return response.data;
  },

  async getLedger(query?: LedgerQuery): Promise<PaginatedResponse<StockLedgerEntry>> {
    const response = await apiClient.get<PaginatedResponse<StockLedgerEntry>>('/api/stock/ledger', { params: query });
    return response.data;
  },
};
