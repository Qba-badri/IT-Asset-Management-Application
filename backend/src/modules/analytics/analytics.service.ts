import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, In, Between, SelectQueryBuilder } from 'typeorm';
import { Asset, AssetStatus } from '../../entities/asset.entity';
import { AssetUnit } from '../../entities/asset-unit.entity';
import { StockByLocation } from '../../entities/stock-by-location.entity';
import { CatalogItem } from '../../entities/catalog-item.entity';
import { InventoryItem } from '../../entities/inventory-item.entity';
import { License } from '../../entities/license.entity';
import { User } from '../../entities/user.entity';
import { Assignment, AssignmentStatus } from '../../entities/assignment.entity';
import { AssetHistory } from '../../entities/asset-history.entity';
import { StockLedger, LedgerReason } from '../../entities/stock-ledger.entity';
import { AuditLog } from '../../entities/audit-log.entity';

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

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(AssetUnit)
    private assetUnitRepository: Repository<AssetUnit>,
    @InjectRepository(StockByLocation)
    private stockRepository: Repository<StockByLocation>,
    @InjectRepository(CatalogItem)
    private catalogRepository: Repository<CatalogItem>,
    @InjectRepository(InventoryItem)
    private inventoryItemRepository: Repository<InventoryItem>,
    @InjectRepository(License)
    private licenseRepository: Repository<License>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Assignment)
    private assignmentRepository: Repository<Assignment>,
    @InjectRepository(AssetHistory)
    private assetHistoryRepository: Repository<AssetHistory>,
    @InjectRepository(StockLedger)
    private stockLedgerRepository: Repository<StockLedger>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) { }

  private applyFilters(query: SelectQueryBuilder<any>, alias: string, filters?: DashboardFilters, user?: any): SelectQueryBuilder<any> {
    if (user && user.role?.name !== 'Admin') {
      if (alias === 'asset') {
        query.andWhere(`${alias}.assignedToId = :userId`, { userId: user.id });
      } else if (alias === 'license') {
        query.innerJoin(`${alias}.assignments`, 'userAssign', 'userAssign.userId = :userId', { userId: user.id });
      } else if (alias === 'assign') {
        query.andWhere(`${alias}.assigneeId = :userId`, { userId: user.id });
      } else if (alias === 'log') {
        query.andWhere(`${alias}.userId = :userId`, { userId: user.id });
      }
    }

    if (!filters) return query;

    if (filters.startDate && filters.endDate) {
      query.andWhere(`${alias}.createdAt BETWEEN :start AND :end`, {
        start: filters.startDate,
        end: filters.endDate,
      });
    }

    if (filters.departmentId) {
      if (alias === 'asset') {
        // Skip or join if needed. Asset doesn't have departmentId directly.
      } else {
        query.andWhere(`${alias}.departmentId = :deptId`, { deptId: filters.departmentId });
      }
    }

    if (filters.locationId) {
      query.andWhere(`${alias}.locationId = :locId`, { locId: filters.locationId });
    }

    if (filters.categoryId) {
      if (alias === 'asset') {
        // Asset uses 'category' string enum
      } else {
        query.andWhere(`${alias}.categoryId = :catId`, { catId: filters.categoryId });
      }
    }

    if (filters.status && filters.status !== 'all') {
      query.andWhere(`${alias}.status = :status`, { status: filters.status });
    }

    if (filters.brandId) {
      if (alias === 'asset' || alias === 'item') {
        query.andWhere(`${alias}.brandId = :brandId`, { brandId: filters.brandId });
      }
    }

    if (filters.vendorId) {
      if (alias === 'asset' || alias === 'item') {
        query.andWhere(`${alias}.vendorId = :vendorId`, { vendorId: filters.vendorId });
      }
    }

    return query;
  }

  async getGlobalSummary(filters: DashboardFilters = {}, user?: any) {
    const totalAssets = await this.applyFilters(this.assetRepository.createQueryBuilder('asset'), 'asset', filters, user).getCount();
    const totalLicenses = await this.applyFilters(this.licenseRepository.createQueryBuilder('license'), 'license', filters, user).getCount();
    const totalInventoryItems = await this.applyFilters(this.inventoryItemRepository.createQueryBuilder('item'), 'item', filters, user).getCount();
    const totalUsers = user?.role?.name === 'Admin' ? await this.userRepository.count() : 1;

    const activeAssignments = await this.applyFilters(this.assignmentRepository.createQueryBuilder('assign'), 'assign', filters, user)
      .andWhere('assign.status = :status', { status: AssignmentStatus.ACTIVE })
      .getCount();

    const assetValue = await this.applyFilters(this.assetRepository.createQueryBuilder('asset'), 'asset', filters, user)
      .select('SUM(asset.purchaseCost)', 'total')
      .getRawOne();

    const inventoryValue = await this.applyFilters(this.stockRepository.createQueryBuilder('s'), 's', filters)
      .leftJoin('s.catalogItem', 'ci')
      .select('SUM(s.quantity * ci.unitCost)', 'totalValue')
      .getRawOne();

    return {
      totalAssets,
      totalLicenses,
      totalInventoryItems,
      totalUsers,
      totalAssetValue: parseFloat(assetValue?.total || 0) + parseFloat(inventoryValue?.totalValue || 0),
      activeAssignments
    };
  }

  async getAssetStats(filters: DashboardFilters = {}, user?: any) {
    const byStatus = await this.applyFilters(this.assetRepository.createQueryBuilder('asset'), 'asset', filters, user)
      .select('asset.status', 'status')
      .addSelect('COUNT(asset.id)', 'count')
      .groupBy('asset.status')
      .getRawMany();

    const byCategory = await this.applyFilters(this.assetRepository.createQueryBuilder('asset'), 'asset', filters, user)
      .select('asset.category', 'category')
      .addSelect('COUNT(asset.id)', 'count')
      .groupBy('asset.category')
      .getRawMany();

    const sixtyDays = new Date();
    sixtyDays.setDate(sixtyDays.getDate() + 60);

    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    const warrantyExpiring60 = await this.applyFilters(this.assetRepository.createQueryBuilder('asset'), 'asset', filters, user)
      .andWhere('asset.warrantyExpiry < :sixty', { sixty: sixtyDays })
      .andWhere('asset.status = :deployed', { deployed: AssetStatus.DEPLOYED })
      .getCount();

    const warrantyExpiring30 = await this.applyFilters(this.assetRepository.createQueryBuilder('asset'), 'asset', filters, user)
      .andWhere('asset.warrantyExpiry < :thirty', { thirty: thirtyDays })
      .andWhere('asset.status = :deployed', { deployed: AssetStatus.DEPLOYED })
      .getCount();

    // Calculate total and deployed from byStatus to ensure consistency
    const totalCount = byStatus.reduce((acc, curr) => acc + parseInt(curr.count), 0);
    const deployedResult = byStatus.find(s => s.status.toLowerCase() === 'deployed');
    const deployedCount = deployedResult ? parseInt(deployedResult.count) : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentlyAdded = await this.applyFilters(this.assetRepository.createQueryBuilder('asset'), 'asset', filters, user)
      .andWhere('asset.purchaseDate > :recent', { recent: thirtyDaysAgo })
      .getCount();

    return {
      byStatus,
      byCategory,
      warrantyExpiring60,
      warrantyExpiring30,
      utilizationPercentage: totalCount > 0 ? (deployedCount / totalCount) * 100 : 0,
      recentlyAdded
    };
  }

  async getLicenseStats(filters: DashboardFilters = {}, user?: any) {
    const total = await this.applyFilters(this.licenseRepository.createQueryBuilder('license'), 'license', filters, user).getCount();

    const seatsStats = await this.applyFilters(this.licenseRepository.createQueryBuilder('license'), 'license', filters, user)
      .select('SUM(license.usedSeats)', 'assigned')
      .addSelect('SUM(license.totalSeats)', 'total')
      .getRawOne();

    const assigned = parseInt(seatsStats?.assigned || 0);
    const totalSeats = parseInt(seatsStats?.total || 0);

    const expired = await this.applyFilters(this.licenseRepository.createQueryBuilder('license'), 'license', filters, user)
      .andWhere('license.expiryDate < :now', { now: new Date() })
      .getCount();

    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    const expiringSoon = await this.applyFilters(this.licenseRepository.createQueryBuilder('license'), 'license', filters, user)
      .andWhere('license.expiryDate BETWEEN :now AND :thirty', { now: new Date(), thirty: thirtyDays })
      .getCount();

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

  async getInventoryStats(filters: DashboardFilters = {}, user?: any) {
    const itemStockSum = await this.applyFilters(this.inventoryItemRepository.createQueryBuilder('item'), 'item', filters, user)
      .select('SUM(item.totalStock)', 'total')
      .getRawOne();

    const itemAvailableSum = await this.applyFilters(this.inventoryItemRepository.createQueryBuilder('item'), 'item', filters, user)
      .select('SUM(item.availableStock)', 'total')
      .getRawOne();

    const itemLowStock = await this.applyFilters(this.inventoryItemRepository.createQueryBuilder('item'), 'item', filters, user)
      .andWhere('item.availableStock <= item.minStockLevel')
      .getCount();

    const stockLocSum = await this.applyFilters(this.stockRepository.createQueryBuilder('s'), 's', filters, user)
      .select('SUM(s.quantity)', 'total')
      .getRawOne();

    const totalStock = parseInt(itemStockSum?.total || 0) + parseInt(stockLocSum?.total || 0);
    const availableStock = parseInt(itemAvailableSum?.total || 0) + parseInt(stockLocSum?.total || 0);

    const outOfStockCount = await this.applyFilters(this.inventoryItemRepository.createQueryBuilder('item'), 'item', filters, user)
      .andWhere('item.availableStock = 0')
      .getCount();

    const refundable = await this.applyFilters(this.inventoryItemRepository.createQueryBuilder('item'), 'item', filters, user)
      .andWhere('item.isRefundable = true')
      .getCount();
    const nonRefundable = await this.applyFilters(this.inventoryItemRepository.createQueryBuilder('item'), 'item', filters, user)
      .andWhere('item.isRefundable = false')
      .getCount();

    return {
      totalStockUnits: totalStock,
      availableUnits: availableStock,
      lowStockAlerts: itemLowStock,
      outOfStock: outOfStockCount,
      distribution: { refundable, nonRefundable }
    };
  }

  async getUserStats(filters: DashboardFilters = {}, user?: any) {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({ where: { isActive: true } });

    const deptStats = await this.applyFilters(this.assignmentRepository.createQueryBuilder('a'), 'a', filters, user)
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

  async getAlerts(filters: DashboardFilters = {}, user?: any) {
    const stats = await this.getAssetStats(filters, user);
    const lowStock = (await this.getInventoryStats(filters, user)).lowStockAlerts;
    const expiredLicenses = (await this.getLicenseStats(filters, user)).expired;

    const overdueReturns = await this.applyFilters(this.assignmentRepository.createQueryBuilder('assign'), 'assign', filters, user)
      .andWhere('assign.status = :status', { status: AssignmentStatus.OVERDUE })
      .getCount();

    const unassignedAssets = await this.applyFilters(this.assetRepository.createQueryBuilder('asset'), 'asset', filters, user)
      .andWhere('asset.status = :status', { status: AssetStatus.AVAILABLE })
      .getCount();

    return {
      warrantyExpiring: stats.warrantyExpiring60,
      warrantyExpiring30: stats.warrantyExpiring30,
      lowStockItems: lowStock,
      expiredLicenses,
      overdueReturns,
      assetsUnassigned: unassignedAssets
    };
  }

  async getRecentActivity(filters: any = {}, user?: any) {
    const query = this.auditLogRepository.createQueryBuilder('log');
    this.applyFilters(query, 'log', null, user);
    if (filters.userId) {
      query.andWhere('log.userId = :userId', { userId: filters.userId });
    }
    return query
      .orderBy('log.createdAt', 'DESC')
      .take(10)
      .getMany();
  }

  async getStockMovement(filters: DashboardFilters = {}, user?: any) {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const reasons = [LedgerReason.PROCUREMENT, LedgerReason.ISSUE, LedgerReason.RETURN, LedgerReason.ADJUSTMENT];

    const thisMonth = await this.applyFilters(this.stockLedgerRepository.createQueryBuilder('sl'), 'sl', filters, user)
      .select('sl.reason', 'reason')
      .addSelect('SUM(ABS(sl.quantityChange))', 'count')
      .andWhere('sl.createdAt >= :start', { start: thisMonthStart })
      .andWhere('sl.reason IN (:...reasons)', { reasons })
      .groupBy('sl.reason')
      .getRawMany();

    const lastMonth = await this.applyFilters(this.stockLedgerRepository.createQueryBuilder('sl'), 'sl', filters, user)
      .select('sl.reason', 'reason')
      .addSelect('SUM(ABS(sl.quantityChange))', 'count')
      .andWhere('sl.createdAt >= :start AND sl.createdAt <= :end', { start: lastMonthStart, end: lastMonthEnd })
      .andWhere('sl.reason IN (:...reasons)', { reasons })
      .groupBy('sl.reason')
      .getRawMany();

    return {
      thisMonth,
      lastMonth
    };
  }

  async getLicenseUtilization(filters: DashboardFilters = {}, user?: any) {
    return this.applyFilters(this.licenseRepository.createQueryBuilder('license'), 'license', filters, user)
      .orderBy('license.usedSeats', 'DESC')
      .take(4)
      .select(['license.softwareName', 'license.totalSeats', 'license.usedSeats'])
      .getRawMany();
  }

  /* --- Legacy Methods --- */

  async getDashboardStats() {
    // Implement or leave as skeleton for compatibility
    return {};
  }

  async getAssetRefreshReport() {
    return [];
  }

  async getDepreciationReport() {
    return [];
  }
}
