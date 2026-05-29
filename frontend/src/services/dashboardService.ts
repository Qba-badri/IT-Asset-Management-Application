import apiClient from './apiClient';

export interface DashboardFilters {
    startDate?: string;
    endDate?: string;
    departmentId?: number;
    locationId?: number;
    categoryId?: number;
    brandId?: number;
    vendorId?: number;
    status?: string;
}

export interface GlobalSummary {
    totalAssets: number;
    totalLicenses: number;
    totalInventoryItems: number;
    totalUsers: number;
    totalVendors: number;
    totalAssetValue: number;
    activeAssignments: number;
}

export interface AssetStats {
    byStatus: { status: string; count: string }[];
    byCategory: { category: string; count: string }[];
    warrantyExpiring: number;
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

export interface DashboardAlerts {
    warrantyExpiring: number;
    lowStockItems: number;
    expiredLicenses: number;
    overdueReturns: number;
    assetsUnassigned: number;
}

export const dashboardService = {
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

    async getAlerts(filters?: DashboardFilters): Promise<DashboardAlerts> {
        const response = await apiClient.get<DashboardAlerts>('/api/dashboard/alerts', { params: filters });
        return response.data;
    },

    async getRecentActivity(filters?: DashboardFilters): Promise<any[]> {
        const response = await apiClient.get<any[]>('/api/dashboard/recent-activity', { params: filters });
        return response.data;
    },

    async getStockMovement(filters?: DashboardFilters): Promise<{ thisMonth: any[], lastMonth: any[] }> {
        const response = await apiClient.get<{ thisMonth: any[], lastMonth: any[] }>('/api/dashboard/stock-movement', { params: filters });
        return response.data;
    },

    async getLicenseUtilization(filters?: DashboardFilters): Promise<any[]> {
        const response = await apiClient.get<any[]>('/api/dashboard/license-utilization', { params: filters });
        return response.data;
    }
};
