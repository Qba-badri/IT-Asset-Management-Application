import apiClient from './apiClient';

// ─── Types ────────────────────────────────────────────────────────

export type ReturnPolicy = 'returnable' | 'consumable' | 'assign_once';
export type TrackMode = 'serialized' | 'bulk_qty';

export interface CatalogItem {
  id: number;
  sku: string;
  name: string;
  description?: string;
  categoryId?: number;
  category?: { id: number; name: string };
  returnPolicy: ReturnPolicy;
  trackMode: TrackMode;
  unitOfMeasure: string;
  reorderPoint: number;
  brand?: string;
  model?: string;
  imageUrl?: string;
  unitCost?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCatalogItemInput {
  sku: string;
  name: string;
  description?: string;
  categoryId?: number;
  returnPolicy: ReturnPolicy;
  trackMode: TrackMode;
  unitOfMeasure?: string;
  reorderPoint?: number;
  brand?: string;
  model?: string;
  imageUrl?: string;
  unitCost?: number;
}

export interface CatalogQuery {
  search?: string;
  returnPolicy?: ReturnPolicy;
  trackMode?: TrackMode;
  categoryId?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

// ─── Service ──────────────────────────────────────────────────────

export const catalogService = {
  async getAll(query?: CatalogQuery): Promise<PaginatedResponse<CatalogItem>> {
    const response = await apiClient.get<PaginatedResponse<CatalogItem>>('/api/catalog', { params: query });
    return response.data;
  },

  async getById(id: number): Promise<CatalogItem> {
    const response = await apiClient.get<CatalogItem>(`/api/catalog/${id}`);
    return response.data;
  },

  async create(data: CreateCatalogItemInput): Promise<CatalogItem> {
    const response = await apiClient.post<CatalogItem>('/api/catalog', data);
    return response.data;
  },

  async update(id: number, data: Partial<CreateCatalogItemInput>): Promise<CatalogItem> {
    const response = await apiClient.put<CatalogItem>(`/api/catalog/${id}`, data);
    return response.data;
  },

  async deactivate(id: number): Promise<void> {
    await apiClient.delete(`/api/catalog/${id}`);
  },
};
