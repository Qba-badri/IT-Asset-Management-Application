import apiClient from './apiClient';

export interface AssetPhoto {
    id: number;
    assetId: number;
    url: string;
    filename: string;
    uploadedAt: string;
    condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
    notes?: string;
    size: number;
    mimeType: string;
}

export interface Asset {
    id: number;
    assetTag: string;
    name: string;
    category: string;
    brand?: string;
    brandId?: number;
    model?: string;
    serialNumber?: string;
    status: string;
    condition: string;
    acquisitionType?: string;
    purchaseDate?: string;
    purchaseCost?: number;
    currency?: string;
    vendor?: string;
    vendorId?: number;
    receivedFromVendorDate?: string;
    vendorMonthlyRent?: number;
    warrantyExpiry?: string;
    assignedTo?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
    businessOwner?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
    hostname?: string;
    deploymentDate?: string;
    location?: string;
    site?: string;
    building?: string;
    floor?: string;
    roomDesk?: string;
    poNumber?: string;
    invoiceNumber?: string;
    costCenter?: string;
    businessOwnerId?: number;
    warrantyType?: string;
    warrantyStart?: string;
    maintenanceCycleDays?: number;
    lastMaintenanceDate?: string;
    nextMaintenanceDate?: string;
    maintenanceNotes?: string;
    usefulLifeYears: number;
    salvageValue?: number;
    currentValue?: number;
    disposalDate?: string;
    disposalMethod?: string;
    disposalNotes?: string;
    notes?: string;
    photos?: AssetPhoto[];
    createdAt: string;
    updatedAt: string;
}

export interface AssetStatistics {
    total: number;
    deployed: number;
    available: number;
    maintenance: number;
    disposed: number;
}

const sanitizePayload = (data: any) => {
    const cleaned: any = {};
    Object.entries(data || {}).forEach(([key, value]) => {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed === '') return;
            cleaned[key] = trimmed;
            return;
        }

        if (value !== undefined) {
            cleaned[key] = value;
        }
    });
    return cleaned;
};

export const assetService = {
    async getAssets(): Promise<Asset[]> {
        const response = await apiClient.get<Asset[]>('/assets');
        return response.data;
    },

    async getAsset(id: number): Promise<Asset> {
        const response = await apiClient.get<Asset>(`/assets/${id}`);
        return response.data;
    },

    async getStatistics(): Promise<AssetStatistics> {
        const response = await apiClient.get<AssetStatistics>('/assets/statistics');
        return response.data;
    },

    async createAsset(data: any): Promise<Asset> {
        // userId should already be in data if provided by the component
        const response = await apiClient.post<Asset>('/assets', data);
        return response.data;
    },

    async updateAsset(id: number, data: any): Promise<Asset> {
        const response = await apiClient.put<Asset>(`/assets/${id}`, data);
        return response.data;
    },

    async deployAsset(id: number, data: any): Promise<Asset> {
        const response = await apiClient.post<Asset>(`/assets/${id}/deploy`, data);
        return response.data;
    },

    async undeployAsset(id: number, performedBy?: number): Promise<Asset> {
        const response = await apiClient.post<Asset>(`/assets/${id}/undeploy`, { performedBy });
        return response.data;
    },

    async scheduleMaintenance(id: number, data: any, performedBy?: number): Promise<Asset> {
        const response = await apiClient.post<Asset>(`/assets/${id}/maintenance`, sanitizePayload({ ...data, performedBy }));
        return response.data;
    },

    async completeMaintenance(id: number, data?: any, performedBy?: number): Promise<Asset> {
        const response = await apiClient.post<Asset>(`/assets/${id}/maintenance/complete`, sanitizePayload({ ...data, performedBy }));
        return response.data;
    },

    async calculateDepreciation(id: number, performedBy?: number): Promise<Asset> {
        const response = await apiClient.post<Asset>(`/assets/${id}/depreciation`, { performedBy });
        return response.data;
    },

    async disposeAsset(id: number, data: any, performedBy?: number): Promise<Asset> {
        const response = await apiClient.post<Asset>(`/assets/${id}/dispose`, { ...data, performedBy });
        return response.data;
    },

    async deleteAsset(id: number): Promise<void> {
        await apiClient.delete(`/assets/${id}`);
    },

    async getAssetHistory(id: number): Promise<any[]> {
        const response = await apiClient.get<any[]>(`/assets/${id}/history`);
        return response.data;
    },

    async getAssetPhotos(id: number): Promise<AssetPhoto[]> {
        const response = await apiClient.get<AssetPhoto[]>(`/assets/${id}/photos`);
        return response.data;
    },

    async uploadAssetPhotos(id: number, formData: FormData): Promise<AssetPhoto[]> {
        const response = await apiClient.post<AssetPhoto[]>(`/assets/${id}/photos`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async deleteAssetPhoto(assetId: number, photoId: number): Promise<void> {
        await apiClient.delete(`/assets/${assetId}/photos/${photoId}`);
    },

    async updateAssetPhoto(assetId: number, photoId: number, data: Partial<AssetPhoto>): Promise<AssetPhoto> {
        const response = await apiClient.put<AssetPhoto>(`/assets/${assetId}/photos/${photoId}`, data);
        return response.data;
    },

    async validateImport(file: File): Promise<{ data: any[] }> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post<{ data: any[] }>('/assets/import/validate', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    async confirmImport(assets: any[], performedBy?: number): Promise<{ success: number; failed: number; errors: any[] }> {
        const response = await apiClient.post<{ success: number; failed: number; errors: any[] }>('/assets/import/confirm', {
            assets,
            performedBy
        });
        return response.data;
    },

    async generateNextTag(category: string): Promise<{ assetTag: string }> {
        const response = await apiClient.get<{ assetTag: string }>(`/assets/generate-tag/${category}`);
        return response.data;
    },
};
