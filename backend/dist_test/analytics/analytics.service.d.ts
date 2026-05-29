import { Repository } from 'typeorm';
import { Asset } from '../entities/asset.entity';
import { AssetUnit } from '../entities/asset-unit.entity';
import { StockByLocation } from '../entities/stock-by-location.entity';
import { CatalogItem } from '../entities/catalog-item.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { License } from '../entities/license.entity';
import { User } from '../entities/user.entity';
import { PurchaseOrder } from '../entities/purchase-order.entity';
import { Assignment } from '../entities/assignment.entity';
import { Vendor } from '../entities/vendor.entity';
export declare class AnalyticsService {
    private assetRepository;
    private assetUnitRepository;
    private stockRepository;
    private catalogRepository;
    private inventoryItemRepository;
    private licenseRepository;
    private userRepository;
    private poRepository;
    private assignmentRepository;
    private vendorRepository;
    constructor(assetRepository: Repository<Asset>, assetUnitRepository: Repository<AssetUnit>, stockRepository: Repository<StockByLocation>, catalogRepository: Repository<CatalogItem>, inventoryItemRepository: Repository<InventoryItem>, licenseRepository: Repository<License>, userRepository: Repository<User>, poRepository: Repository<PurchaseOrder>, assignmentRepository: Repository<Assignment>, vendorRepository: Repository<Vendor>);
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
    getAssetRefreshReport(): Promise<Asset[]>;
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
