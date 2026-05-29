import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboardStats(): Promise<{
        overview: {
            totalAssets: number;
            utilizationRate: number;
            available: number;
            maintenance: number;
        };
        distribution: {
            byCategory: any[];
            byLocation: any[];
        };
        inventory: {
            totalValue: number;
            lowStockItems: number;
        };
        alerts: {
            expiringWarranties: number;
        };
    }>;
    getRefreshReport(): Promise<import("../entities/asset.entity").Asset[]>;
    getDepreciationReport(): Promise<{
        id: number;
        name: string;
        assetTag: string;
        purchaseCost: number;
        purchaseDate: Date;
        currentValue: string;
        accumulatedDepreciation: string;
    }[]>;
}
