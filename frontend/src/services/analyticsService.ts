import apiClient from './apiClient';

export interface DashboardFilters {
    /** ISO code to express monetary aggregates in; defaults to the org DEFAULT_CURRENCY */
    displayCurrency?: string;
    startDate?: string;
    endDate?: string;
    departmentId?: number | string;
    locationId?: number | string;
    categoryId?: number | string;
    brandId?: number | string;
    status?: string;
}

export interface GlobalSummary {
    totalAssets: number;
    totalLicenses: number;
    totalInventoryItems: number;
    totalUsers: number;
    totalAssetValue: number;
    activeAssignments: number;
}

export interface AssetStats {
    byStatus: { status: string; count: string }[];
    byCategory: { category: string; count: string }[];
    warrantyExpiring60: number;
    warrantyExpiring30: number;
    utilizationPercentage: number;
    recentlyAdded: number;
}

export interface LicenseStats {
    total: number;
    assigned: number;
    available: number;
    expired: number;
    expiringSoon: number;
    compliancePercentage: number;
}

export interface InventoryStats {
    totalStockUnits: number;
    availableUnits: number;
    lowStockAlerts: number;
    outOfStock: number;
    distribution: { refundable: number; nonRefundable: number };
}

export interface UserStats {
    totalUsers: number;
    activeUsers: number;
    mostAssignedDepartment: string;
}

export interface AlertsData {
    warrantyExpiring: number;
    warrantyExpiring30: number;
    lowStockItems: number;
    expiredLicenses: number;
    overdueReturns: number;
    assetsUnassigned: number;
}

export interface StockMovement {
    thisMonth: { reason: string; count: string }[];
    lastMonth: { reason: string; count: string }[];
}

export interface LicenseUtilization {
    license_softwareName: string;
    license_totalSeats: number;
    license_usedSeats: number;
}

// ─── Legacy types kept for backward compatibility ───
export interface DashboardStats {
    overview: {
        totalAssets: number;
        utilizationRate: number;
        available: number;
        maintenance: number;
    };
    distribution: {
        byCategory: { category: string; count: string }[];
        byLocation: { location: string; count: string }[];
    };
    inventory: { totalValue: number; lowStockItems: number };
    alerts: { expiringWarranties: number };
}

export interface DepreciationRecord {
    id: number;
    name: string;
    assetTag: string;
    purchaseCost: number;
    purchaseDate: string;
    currentValue: string;
    accumulatedDepreciation: string;
}

export const analyticsService = {
    // ── New comprehensive endpoints (dashboard controller) ──

    async getGlobalSummary(filters?: DashboardFilters): Promise<GlobalSummary> {
        const response = await apiClient.get<GlobalSummary>('/api/dashboard/global-summary', { params: filters });
        return response.data;
    },

    async getAssetStats(filters?: DashboardFilters): Promise<AssetStats> {
        const response = await apiClient.get<AssetStats>('/api/dashboard/assets', { params: filters });
        return response.data;
    },

    async getLicenseStats(filters?: DashboardFilters): Promise<LicenseStats> {
        const response = await apiClient.get<LicenseStats>('/api/dashboard/licenses', { params: filters });
        return response.data;
    },

    async getInventoryStats(filters?: DashboardFilters): Promise<InventoryStats> {
        const response = await apiClient.get<InventoryStats>('/api/dashboard/inventory', { params: filters });
        return response.data;
    },

    async getUserStats(filters?: DashboardFilters): Promise<UserStats> {
        const response = await apiClient.get<UserStats>('/api/dashboard/users', { params: filters });
        return response.data;
    },

    async getAlerts(filters?: DashboardFilters): Promise<AlertsData> {
        const response = await apiClient.get<AlertsData>('/api/dashboard/alerts', { params: filters });
        return response.data;
    },

    async getRecentActivity(filters?: DashboardFilters): Promise<any[]> {
        const response = await apiClient.get<any[]>('/api/dashboard/recent-activity', { params: filters });
        return response.data;
    },

    async getStockMovement(filters?: DashboardFilters): Promise<StockMovement> {
        const response = await apiClient.get<StockMovement>('/api/dashboard/stock-movement', { params: filters });
        return response.data;
    },

    async getLicenseUtilization(filters?: DashboardFilters): Promise<LicenseUtilization[]> {
        const response = await apiClient.get<LicenseUtilization[]>('/api/dashboard/license-utilization', { params: filters });
        return response.data;
    },

    // ── Legacy endpoints (kept for compat) ──
    async getDashboardStats(): Promise<DashboardStats> {
        const response = await apiClient.get<DashboardStats>('/analytics/dashboard');
        return response.data;
    },

    async getRefreshReport(): Promise<any[]> {
        const response = await apiClient.get<any[]>('/analytics/reports/refresh');
        return response.data;
    },

    async getDepreciationReport(): Promise<DepreciationRecord[]> {
        const response = await apiClient.get<DepreciationRecord[]>('/analytics/reports/depreciation');
        return response.data;
    },
};
