"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const asset_entity_1 = require("../entities/asset.entity");
const asset_unit_entity_1 = require("../entities/asset-unit.entity");
const stock_by_location_entity_1 = require("../entities/stock-by-location.entity");
const catalog_item_entity_1 = require("../entities/catalog-item.entity");
const inventory_item_entity_1 = require("../entities/inventory-item.entity");
const license_entity_1 = require("../entities/license.entity");
const user_entity_1 = require("../entities/user.entity");
const purchase_order_entity_1 = require("../entities/purchase-order.entity");
const assignment_entity_1 = require("../entities/assignment.entity");
const vendor_entity_1 = require("../entities/vendor.entity");
let AnalyticsService = class AnalyticsService {
    constructor(assetRepository, assetUnitRepository, stockRepository, catalogRepository, inventoryItemRepository, licenseRepository, userRepository, poRepository, assignmentRepository, vendorRepository) {
        this.assetRepository = assetRepository;
        this.assetUnitRepository = assetUnitRepository;
        this.stockRepository = stockRepository;
        this.catalogRepository = catalogRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.licenseRepository = licenseRepository;
        this.userRepository = userRepository;
        this.poRepository = poRepository;
        this.assignmentRepository = assignmentRepository;
        this.vendorRepository = vendorRepository;
    }
    async getGlobalSummary() {
        const totalAssets = await this.assetRepository.count();
        const totalLicenses = await this.licenseRepository.count();
        const totalInventoryItems = await this.inventoryItemRepository.count();
        const totalUsers = await this.userRepository.count();
        const totalVendors = await this.vendorRepository.count();
        const activeAssignments = await this.assignmentRepository.count({
            where: { status: assignment_entity_1.AssignmentStatus.ACTIVE }
        });
        const poSum = await this.poRepository
            .createQueryBuilder('po')
            .select('SUM(po.totalAmount)', 'total')
            .where('po.status = :status', { status: purchase_order_entity_1.POStatus.COMPLETED })
            .getRawOne();
        const assetValue = await this.assetRepository
            .createQueryBuilder('asset')
            .select('SUM(asset.purchaseCost)', 'total')
            .getRawOne();
        const inventoryValue = await this.stockRepository
            .createQueryBuilder('s')
            .leftJoin('s.catalogItem', 'ci')
            .select('SUM(s.quantity * ci.unitCost)', 'totalValue')
            .getRawOne();
        return {
            totalAssets,
            totalLicenses,
            totalInventoryItems,
            totalUsers,
            totalVendors,
            totalProcurementSpend: parseFloat(poSum?.total || 0),
            totalAssetValue: parseFloat(assetValue?.total || 0) + parseFloat(inventoryValue?.totalValue || 0),
            activeAssignments
        };
    }
    async getAssetStats() {
        const byStatus = await this.assetRepository
            .createQueryBuilder('asset')
            .select('asset.status', 'status')
            .addSelect('COUNT(asset.id)', 'count')
            .groupBy('asset.status')
            .getRawMany();
        const byCategory = await this.assetRepository
            .createQueryBuilder('asset')
            .select('asset.category', 'category')
            .addSelect('COUNT(asset.id)', 'count')
            .groupBy('asset.category')
            .getRawMany();
        const sixtyDays = new Date();
        sixtyDays.setDate(sixtyDays.getDate() + 60);
        const warrantyExpiring = await this.assetRepository.count({
            where: {
                warrantyExpiry: (0, typeorm_2.LessThan)(sixtyDays),
                status: asset_entity_1.AssetStatus.DEPLOYED
            }
        });
        const total = await this.assetRepository.count();
        const deployed = await this.assetRepository.count({ where: { status: asset_entity_1.AssetStatus.DEPLOYED } });
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentlyAdded = await this.assetRepository.count({
            where: { purchaseDate: (0, typeorm_2.MoreThan)(thirtyDaysAgo) }
        });
        return {
            byStatus,
            byCategory,
            warrantyExpiring,
            utilizationPercentage: total > 0 ? (deployed / total) * 100 : 0,
            recentlyAdded
        };
    }
    async getLicenseStats() {
        const total = await this.licenseRepository.count();
        const seatsStats = await this.licenseRepository
            .createQueryBuilder('license')
            .select('SUM(license.usedSeats)', 'assigned')
            .addSelect('SUM(license.totalSeats)', 'total')
            .getRawOne();
        const assigned = parseInt(seatsStats?.assigned || 0);
        const totalSeats = parseInt(seatsStats?.total || 0);
        const expired = await this.licenseRepository.count({
            where: { expiryDate: (0, typeorm_2.LessThan)(new Date()) }
        });
        const thirtyDays = new Date();
        thirtyDays.setDate(thirtyDays.getDate() + 30);
        const expiringSoon = await this.licenseRepository.count({
            where: {
                expiryDate: (0, typeorm_2.Between)(new Date(), thirtyDays)
            }
        });
        const compliancePercentage = totalSeats > 0
            ? Math.min(100, (assigned / totalSeats) * 100)
            : 100;
        return {
            total,
            assigned,
            available: totalSeats - assigned,
            expired,
            expiringSoon,
            compliancePercentage: Math.round(compliancePercentage)
        };
    }
    async getInventoryStats() {
        const itemStockSum = await this.inventoryItemRepository
            .createQueryBuilder('item')
            .select('SUM(item.totalStock)', 'total')
            .getRawOne();
        const itemAvailableSum = await this.inventoryItemRepository
            .createQueryBuilder('item')
            .select('SUM(item.availableStock)', 'total')
            .getRawOne();
        const itemLowStock = await this.inventoryItemRepository
            .createQueryBuilder('item')
            .where('item.availableStock <= item.minStockLevel')
            .getCount();
        const stockLocSum = await this.stockRepository
            .createQueryBuilder('s')
            .select('SUM(s.quantity)', 'total')
            .getRawOne();
        const totalStock = parseInt(itemStockSum?.total || 0) + parseInt(stockLocSum?.total || 0);
        const availableStock = parseInt(itemAvailableSum?.total || 0) + parseInt(stockLocSum?.total || 0);
        const outOfStockCount = await this.inventoryItemRepository.count({ where: { availableStock: 0 } });
        const refundable = await this.inventoryItemRepository.count({ where: { isRefundable: true } });
        const nonRefundable = await this.inventoryItemRepository.count({ where: { isRefundable: false } });
        return {
            totalStockUnits: totalStock,
            availableUnits: availableStock,
            lowStockAlerts: itemLowStock,
            outOfStock: outOfStockCount,
            distribution: { refundable, nonRefundable }
        };
    }
    async getProcurementStats() {
        const totalPOs = await this.poRepository.count();
        const totalSpend = await this.poRepository
            .createQueryBuilder('po')
            .select('SUM(po.totalAmount)', 'total')
            .where('po.status IN (:...statuses)', { statuses: [purchase_order_entity_1.POStatus.COMPLETED, purchase_order_entity_1.POStatus.ISSUED] })
            .getRawOne();
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        const thisMonthSpend = await this.poRepository
            .createQueryBuilder('po')
            .select('SUM(po.totalAmount)', 'total')
            .where('po.createdAt >= :date', { date: startOfMonth })
            .andWhere('po.status != :status', { status: purchase_order_entity_1.POStatus.CANCELLED })
            .getRawOne();
        const topVendors = await this.poRepository
            .createQueryBuilder('po')
            .select('po.vendorName', 'vendor')
            .addSelect('SUM(po.totalAmount)', 'total')
            .where('po.status != :status', { status: purchase_order_entity_1.POStatus.CANCELLED })
            .groupBy('po.vendorName')
            .orderBy('total', 'DESC')
            .limit(5)
            .getRawMany();
        return {
            totalPOs,
            totalSpend: parseFloat(totalSpend?.total || 0),
            thisMonthSpend: parseFloat(thisMonthSpend?.total || 0),
            topVendors
        };
    }
    async getUserStats() {
        const totalUsers = await this.userRepository.count();
        const activeUsers = await this.userRepository.count({ where: { isActive: true } });
        const deptStats = await this.assignmentRepository
            .createQueryBuilder('a')
            .leftJoin('a.department', 'd')
            .select('d.name', 'department')
            .addSelect('COUNT(a.id)', 'count')
            .where('a.departmentId IS NOT NULL')
            .groupBy('d.name')
            .orderBy('count', 'DESC')
            .limit(1)
            .getRawOne();
        return {
            totalUsers,
            activeUsers,
            mostAssignedDepartment: deptStats?.department || 'N/A'
        };
    }
    async getAlerts() {
        const warranty = await this.getAssetStats().then(s => s.warrantyExpiring);
        const lowStock = await this.getInventoryStats().then(s => s.lowStockAlerts);
        const expiredLicenses = await this.getLicenseStats().then(s => s.expired);
        const overdueReturns = await this.assignmentRepository.count({
            where: { status: assignment_entity_1.AssignmentStatus.OVERDUE }
        });
        const unassignedAssets = await this.assetRepository.count({
            where: { status: asset_entity_1.AssetStatus.AVAILABLE }
        });
        return {
            warrantyExpiring: warranty,
            lowStockItems: lowStock,
            expiredLicenses,
            overdueReturns,
            assetsUnassigned: unassignedAssets
        };
    }
    async getDashboardStats() {
        const totalAssets = await this.assetRepository.count();
        const deployedAssets = await this.assetRepository.count({
            where: { status: asset_entity_1.AssetStatus.DEPLOYED },
        });
        const availableAssets = await this.assetRepository.count({
            where: { status: asset_entity_1.AssetStatus.AVAILABLE },
        });
        const maintenanceAssets = await this.assetRepository.count({
            where: { status: asset_entity_1.AssetStatus.MAINTENANCE },
        });
        const categoryStats = await this.assetRepository
            .createQueryBuilder('asset')
            .select('asset.category', 'category')
            .addSelect('COUNT(asset.id)', 'count')
            .groupBy('asset.category')
            .getRawMany();
        const locationStats = await this.assetRepository
            .createQueryBuilder('asset')
            .select('asset.location', 'location')
            .addSelect('COUNT(asset.id)', 'count')
            .where('asset.location IS NOT NULL')
            .groupBy('asset.location')
            .getRawMany();
        const result = await this.stockRepository
            .createQueryBuilder('s')
            .leftJoin('s.catalogItem', 'ci')
            .select('SUM(s.quantity * ci.unitCost)', 'totalValue')
            .getRawOne();
        const totalInventoryValue = result ? parseFloat(result.totalValue) : 0;
        const lowStockItems = await this.stockRepository
            .createQueryBuilder('s')
            .leftJoin('s.catalogItem', 'ci')
            .where('s.quantity <= ci.reorderPoint')
            .getCount();
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
        const expiringWarranties = await this.assetRepository.count({
            where: {
                warrantyExpiry: (0, typeorm_2.LessThan)(sixtyDaysFromNow),
                status: asset_entity_1.AssetStatus.DEPLOYED,
            },
        });
        return {
            overview: {
                totalAssets,
                utilizationRate: totalAssets > 0 ? (deployedAssets / totalAssets) * 100 : 0,
                available: availableAssets,
                maintenance: maintenanceAssets,
            },
            distribution: {
                byCategory: categoryStats,
                byLocation: locationStats,
            },
            inventory: {
                totalValue: totalInventoryValue,
                lowStockItems,
            },
            alerts: {
                expiringWarranties,
            },
        };
    }
    async getAssetRefreshReport() {
        const threeYearsAgo = new Date();
        threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
        return this.assetRepository.find({
            where: {
                purchaseDate: (0, typeorm_2.LessThan)(threeYearsAgo),
                status: asset_entity_1.AssetStatus.DEPLOYED,
            },
            order: { purchaseDate: 'ASC' },
        });
    }
    async getDepreciationReport() {
        const assets = await this.assetRepository.find({
            where: { purchaseCost: (0, typeorm_2.MoreThan)(0) },
        });
        return assets.map((asset) => {
            const purchaseDate = asset.purchaseDate ? new Date(asset.purchaseDate) : new Date();
            const yearsOwned = (new Date().getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
            const cost = Number(asset.purchaseCost);
            const salvage = Number(asset.salvageValue) || 0;
            const life = Number(asset.usefulLifeYears) || 3;
            const annualDepreciation = (cost - salvage) / life;
            const accumulatedDepreciation = Math.min(cost, yearsOwned * annualDepreciation);
            const currentValue = Math.max(salvage, cost - accumulatedDepreciation);
            return {
                id: asset.id,
                name: asset.name,
                assetTag: asset.assetTag,
                purchaseCost: cost,
                purchaseDate,
                currentValue: currentValue.toFixed(2),
                accumulatedDepreciation: accumulatedDepreciation.toFixed(2),
            };
        });
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(asset_entity_1.Asset)),
    __param(1, (0, typeorm_1.InjectRepository)(asset_unit_entity_1.AssetUnit)),
    __param(2, (0, typeorm_1.InjectRepository)(stock_by_location_entity_1.StockByLocation)),
    __param(3, (0, typeorm_1.InjectRepository)(catalog_item_entity_1.CatalogItem)),
    __param(4, (0, typeorm_1.InjectRepository)(inventory_item_entity_1.InventoryItem)),
    __param(5, (0, typeorm_1.InjectRepository)(license_entity_1.License)),
    __param(6, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(7, (0, typeorm_1.InjectRepository)(purchase_order_entity_1.PurchaseOrder)),
    __param(8, (0, typeorm_1.InjectRepository)(assignment_entity_1.Assignment)),
    __param(9, (0, typeorm_1.InjectRepository)(vendor_entity_1.Vendor)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map