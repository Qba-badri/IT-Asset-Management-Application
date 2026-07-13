import apiClient from './apiClient';
import { CatalogItem, PaginatedResponse } from './catalogService';

// ─── Types ────────────────────────────────────────────────────────

export type AssetUnitStatus = 'in_stock' | 'assigned' | 'in_maintenance' | 'in_repair' | 'lost' | 'written_off' | 'disposed';
export type AssetCondition = 'new' | 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';

export interface AssetUnit {
  id: number;
  assetTag: string;
  catalogItemId: number;
  catalogItem?: CatalogItem;
  serialNumber?: string;
  status: AssetUnitStatus;
  condition: AssetCondition;
  locationId?: number;
  location?: { id: number; name: string };
  purchaseDate?: string;
  purchaseCost?: number;
  currency?: string;
  vendor?: string;
  warrantyExpiry?: string;
  usefulLifeYears?: number;
  salvageValue?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetUnitInput {
  assetTag: string;
  catalogItemId: number;
  serialNumber?: string;
  condition?: AssetCondition;
  locationId?: number;
  purchaseDate?: string;
  purchaseCost?: number;
  currency?: string;
  vendor?: string;
  warrantyExpiry?: string;
  usefulLifeYears?: number;
  salvageValue?: number;
  notes?: string;
}

export interface AssetUnitQuery {
  search?: string;
  catalogItemId?: number;
  status?: AssetUnitStatus;
  locationId?: number;
  page?: number;
  limit?: number;
}

// ─── Service ──────────────────────────────────────────────────────

export const assetUnitsService = {
  async getAll(query?: AssetUnitQuery): Promise<PaginatedResponse<AssetUnit>> {
    const response = await apiClient.get<PaginatedResponse<AssetUnit>>('/api/asset-units', { params: query });
    return response.data;
  },

  async getById(id: number): Promise<AssetUnit> {
    const response = await apiClient.get<AssetUnit>(`/api/asset-units/${id}`);
    return response.data;
  },

  async getByTag(assetTag: string): Promise<AssetUnit> {
    const response = await apiClient.get<AssetUnit>(`/api/asset-units/tag/${assetTag}`);
    return response.data;
  },

  async create(data: CreateAssetUnitInput): Promise<AssetUnit> {
    const response = await apiClient.post<AssetUnit>('/api/asset-units', data);
    return response.data;
  },

  async update(id: number, data: Partial<CreateAssetUnitInput>): Promise<AssetUnit> {
    const response = await apiClient.put<AssetUnit>(`/api/asset-units/${id}`, data);
    return response.data;
  },
};
