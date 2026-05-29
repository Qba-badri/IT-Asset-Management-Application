import { AnalyticsService } from './analytics.service';
export declare class DashboardController {
    private readonly analyticsService;
    private readonly logger;
    constructor(analyticsService: AnalyticsService);
    getGlobalSummary(): Promise<{
        totalAssets: number;
        totalLicenses: number;
        totalInventoryItems: number;
        totalUsers: number;
        totalVendors: number;
        totalProcurementSpend: number;
        totalAssetValue: number;
        activeAssignments: number;
    }>;
    getAssetStats(): Promise<{
        byStatus: any[];
        byCategory: any[];
        warrantyExpiring: number;
        utilizationPercentage: number;
        recentlyAdded: number;
    }>;
    getLicenseStats(): Promise<{
        total: number;
        assigned: number;
        available: number;
        expired: number;
        expiringSoon: number;
        compliancePercentage: number;
    }>;
    getInventoryStats(): Promise<{
        totalStockUnits: number;
        availableUnits: number;
        lowStockAlerts: number;
        outOfStock: number;
        distribution: {
            refundable: number;
            nonRefundable: number;
        };
    }>;
    getProcurementStats(): Promise<{
        totalPOs: number;
        totalSpend: number;
        thisMonthSpend: number;
        topVendors: any[];
    }>;
    getUserStats(): Promise<{
        totalUsers: number;
        activeUsers: number;
        mostAssignedDepartment: any;
    }>;
    getAlerts(): Promise<{
        warrantyExpiring: number;
        lowStockItems: number;
        expiredLicenses: number;
        overdueReturns: number;
        assetsUnassigned: number;
    }>;
}
