/**
 * @file analytics.service.ts
 * @description Central analytics service that powers all 20 dashboard KPIs.
 *
 * ## KPI → Method Mapping
 * | KPI | Description                          | Method                     |
 * |-----|--------------------------------------|----------------------------|
 * | 1   | Total Hardware Assets                | getGlobalSummary           |
 * | 2   | Asset Utilization Rate               | getAssetStats              |
 * | 3   | Assets by Status Breakdown           | getAssetStats              |
 * | 4   | Serialized Units In-Stock vs Assigned| getSerializedUnitKpis      |
 * | 5   | Warranty Expiry Alerts (30/60/90d)   | getAssetStats              |
 * | 6   | Consumable Items Below Min Stock     | getInventoryKpis           |
 * | 7   | Total Inventory Spend (Purchases)    | getInventoryKpis           |
 * | 8   | Inventory Turnover This Month        | getInventoryKpis           |
 * | 9   | Active Assignments Count             | getAssignmentKpis          |
 * | 10  | Overdue Assignments                  | getAssignmentKpis          |
 * | 11  | Return Rate (Last 30 Days)           | getAssignmentKpis          |
 * | 12  | Items Returned in Poor/Damaged Cond. | getAssignmentKpis          |
 * | 13  | License Seat Utilization             | getLicenseStats            |
 * | 14  | Licenses Expiring 30/60/90 Days      | getLicenseStats            |
 * | 15  | Total Annual License Spend           | getLicenseStats            |
 * | 16  | Active Users vs. Assets Ratio        | getUserStats               |
 * | 17  | New Asset Registrations This Month   | getAssetFinancialKpis      |
 * | 18  | Total Asset Book Value               | getAssetFinancialKpis      |
 * | 19  | Rented Assets Monthly Cost (MRC)     | getAssetFinancialKpis      |
 * | 20  | System Activity Last 24 Hours        | getAuditActivityKpis       |
 *
 * ## Adding a New KPI
 * 1. Identify the source entity.
 * 2. Add the query logic in the appropriate method (or a new method).
 * 3. Add the return field to the method's return type interface (in dashboardService.ts).
 * 4. Expose it via a new or existing endpoint in dashboard.controller.ts.
 * 5. Consume it in DashboardHome.tsx.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Asset, AssetStatus, AcquisitionType } from '../../entities/asset.entity';
import { AssetUnit, AssetUnitStatus } from '../../entities/asset-unit.entity';
import { StockByLocation } from '../../entities/stock-by-location.entity';
import { CatalogItem } from '../../entities/catalog-item.entity';
import { InventoryItem } from '../../entities/inventory-item.entity';
import { InventoryPurchase } from '../../entities/inventory-purchase.entity';
import { InventoryTransaction, InventoryTransactionType } from '../../entities/inventory-transaction.entity';
import { License } from '../../entities/license.entity';
import { User } from '../../entities/user.entity';
import { Assignment, AssignmentStatus } from '../../entities/assignment.entity';
import { ReturnTransaction } from '../../entities/return-transaction.entity';
import { AssetCondition } from '../../entities/asset-unit.entity';
import { AssetHistory } from '../../entities/asset-history.entity';
import { StockLedger, LedgerReason } from '../../entities/stock-ledger.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { AuditEvent, AuditAction } from '../../entities/audit-event.entity';
import { SettingsService } from '../settings/settings.service';

// ─────────────────────────────────────────────
//  Shared filter interface used across all KPI methods.
//  Extend this interface if you need new filter dimensions.
// ─────────────────────────────────────────────
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

    @InjectRepository(InventoryPurchase)
    private inventoryPurchaseRepository: Repository<InventoryPurchase>,

    @InjectRepository(InventoryTransaction)
    private inventoryTransactionRepository: Repository<InventoryTransaction>,

    @InjectRepository(License)
    private licenseRepository: Repository<License>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Assignment)
    private assignmentRepository: Repository<Assignment>,

    @InjectRepository(ReturnTransaction)
    private returnTransactionRepository: Repository<ReturnTransaction>,

    @InjectRepository(AssetHistory)
    private assetHistoryRepository: Repository<AssetHistory>,

    @InjectRepository(StockLedger)
    private stockLedgerRepository: Repository<StockLedger>,

    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,

    @InjectRepository(AuditEvent)
    private auditEventRepository: Repository<AuditEvent>,

    private settingsService: SettingsService,
  ) {}

  // ─────────────────────────────────────────────
  //  PRIVATE: Converts a list of { currency, total } subtotals
  //  (e.g. from a `GROUP BY currency` query) into a single number
  //  expressed in the org's configured display currency, using the
  //  manually-maintained rate table in system_settings.
  //  Rate semantics: EXCHANGE_RATES[code] = "1 [code] = X INR".
  // ─────────────────────────────────────────────
  private async sumInDisplayCurrency(
    subtotals: { currency: string; total: string | number }[],
  ): Promise<number> {
    const [displayCurrencySetting, ratesSetting] = await Promise.all([
      this.settingsService.getSetting('DEFAULT_CURRENCY'),
      this.settingsService.getSetting('EXCHANGE_RATES'),
    ]);
    const displayCurrency = displayCurrencySetting || 'INR';
    let rates: Record<string, number> = {};
    try {
      rates = ratesSetting ? JSON.parse(ratesSetting) : {};
    } catch {
      rates = {};
    }
    rates.INR = 1;

    const rateFor = (code: string) => rates[code] ?? 1;

    return subtotals.reduce((sum, row) => {
      const amount = Number(row.total) || 0;
      const amountInInr = amount * rateFor(row.currency || 'INR');
      const converted = displayCurrency === 'INR' ? amountInInr : amountInInr / rateFor(displayCurrency);
      return sum + converted;
    }, 0);
  }

  // ─────────────────────────────────────────────
  //  PRIVATE: Applies role-based and dimensional
  //  filters to a QueryBuilder.
  //  To add a new filter dimension: add a new `if`
  //  block here and a corresponding field in DashboardFilters.
  // ─────────────────────────────────────────────
  private applyFilters(
    query: SelectQueryBuilder<any>,
    alias: string,
    filters?: DashboardFilters,
    user?: any,
  ): SelectQueryBuilder<any> {
    // Role-based data scoping — non-Admin users see only their own data
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

    // Date range filter — applies to createdAt by default
    if (filters.startDate && filters.endDate) {
      query.andWhere(`${alias}.createdAt BETWEEN :start AND :end`, {
        start: filters.startDate,
        end: filters.endDate,
      });
    }

    // Department filter (only for entities with departmentId)
    if (filters.departmentId && alias !== 'asset') {
      query.andWhere(`${alias}.departmentId = :deptId`, { deptId: filters.departmentId });
    }

    // Location filter
    if (filters.locationId) {
      query.andWhere(`${alias}.locationId = :locId`, { locId: filters.locationId });
    }

    // Category filter (only for entities with categoryId)
    if (filters.categoryId && alias !== 'asset') {
      query.andWhere(`${alias}.categoryId = :catId`, { catId: filters.categoryId });
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      query.andWhere(`${alias}.status = :status`, { status: filters.status });
    }

    // Brand / Vendor filters for asset or inventory-item queries
    if (filters.brandId && (alias === 'asset' || alias === 'item')) {
      query.andWhere(`${alias}.brandId = :brandId`, { brandId: filters.brandId });
    }
    if (filters.vendorId && (alias === 'asset' || alias === 'item')) {
      query.andWhere(`${alias}.vendorId = :vendorId`, { vendorId: filters.vendorId });
    }

    return query;
  }

  // ─────────────────────────────────────────────
  //  KPI 1 — Total Hardware Assets
  //  KPI 2 — Asset Utilization (from byStatus)
  //  Partial KPI 13 — License seat totals
  //  Also: totalUsers, totalInventoryItems, totalAssetValue
  // ─────────────────────────────────────────────
  async getGlobalSummary(filters: DashboardFilters = {}, user?: any) {
    const totalAssets = await this.applyFilters(
      this.assetRepository.createQueryBuilder('asset'),
      'asset', filters, user,
    ).getCount();

    const totalLicenses = await this.applyFilters(
      this.licenseRepository.createQueryBuilder('license'),
      'license', filters, user,
    ).getCount();

    const totalInventoryItems = await this.applyFilters(
      this.inventoryItemRepository.createQueryBuilder('item'),
      'item', filters, user,
    ).getCount();

    const totalUsers = user?.role?.name === 'Admin'
      ? await this.userRepository.count()
      : 1;

    const activeAssignments = await this.applyFilters(
      this.assignmentRepository.createQueryBuilder('assign'),
      'assign', filters, user,
    )
      .andWhere('assign.status = :status', { status: AssignmentStatus.ACTIVE })
      .getCount();

    // Total asset value = sum of purchase costs, grouped by currency
    const assetValueByCurrency = await this.applyFilters(
      this.assetRepository.createQueryBuilder('asset'),
      'asset', filters, user,
    )
      .select('SUM(asset.purchaseCost)', 'total')
      .addSelect('asset.currency', 'currency')
      .groupBy('asset.currency')
      .getRawMany();

    // Total inventory value = stock quantity × unit cost, grouped by currency
    const inventoryValueByCurrency = await this.applyFilters(
      this.stockRepository.createQueryBuilder('s'),
      's', filters,
    )
      .leftJoin('s.catalogItem', 'ci')
      .select('SUM(s.quantity * ci.unitCost)', 'total')
      .addSelect('ci.currency', 'currency')
      .groupBy('ci.currency')
      .getRawMany();

    const [assetValue, inventoryValue] = await Promise.all([
      this.sumInDisplayCurrency(assetValueByCurrency),
      this.sumInDisplayCurrency(inventoryValueByCurrency),
    ]);

    return {
      totalAssets,
      totalLicenses,
      totalInventoryItems,
      totalUsers,
      totalAssetValue: assetValue + inventoryValue,
      activeAssignments,
    };
  }

  // ─────────────────────────────────────────────
  //  KPI 2  — Asset Utilization Rate
  //  KPI 3  — Assets by Status Breakdown
  //  KPI 5  — Warranty Expiry Alerts (30/60/90 days + expired)
  //  Also: byCategory, recentlyAdded
  //
  //  To add a new status tier to KPI 5, add another
  //  warrantyExpiring* query with a different horizon date.
  // ─────────────────────────────────────────────
  async getAssetStats(filters: DashboardFilters = {}, user?: any) {
    // KPI 3: Asset count grouped by status
    const byStatus = await this.applyFilters(
      this.assetRepository.createQueryBuilder('asset'),
      'asset', filters, user,
    )
      .select('asset.status', 'status')
      .addSelect('COUNT(asset.id)', 'count')
      .groupBy('asset.status')
      .getRawMany();

    // KPI 3: Asset count grouped by category (used for sub-breakdown)
    const byCategory = await this.applyFilters(
      this.assetRepository.createQueryBuilder('asset'),
      'asset', filters, user,
    )
      .select('asset.category', 'category')
      .addSelect('COUNT(asset.id)', 'count')
      .groupBy('asset.category')
      .getRawMany();

    // KPI 5: Warranty horizon dates
    const now = new Date();
    const in30Days = new Date(now); in30Days.setDate(now.getDate() + 30);
    const in60Days = new Date(now); in60Days.setDate(now.getDate() + 60);
    const in90Days = new Date(now); in90Days.setDate(now.getDate() + 90);

    // KPI 5 — Assets with warranty already expired
    const warrantyExpired = await this.applyFilters(
      this.assetRepository.createQueryBuilder('asset'),
      'asset', filters, user,
    )
      .andWhere('asset.warrantyExpiry < :now', { now })
      .andWhere('asset.warrantyExpiry IS NOT NULL')
      .andWhere('asset.deletedAt IS NULL')
      .getCount();

    // KPI 5 — Expiring within 30 days
    const warrantyExpiring30 = await this.applyFilters(
      this.assetRepository.createQueryBuilder('asset'),
      'asset', filters, user,
    )
      .andWhere('asset.warrantyExpiry BETWEEN :now AND :in30', { now, in30: in30Days })
      .andWhere('asset.deletedAt IS NULL')
      .getCount();

    // KPI 5 — Expiring within 60 days
    const warrantyExpiring60 = await this.applyFilters(
      this.assetRepository.createQueryBuilder('asset'),
      'asset', filters, user,
    )
      .andWhere('asset.warrantyExpiry BETWEEN :now AND :in60', { now, in60: in60Days })
      .andWhere('asset.deletedAt IS NULL')
      .getCount();

    // KPI 5 — Expiring within 90 days
    const warrantyExpiring90 = await this.applyFilters(
      this.assetRepository.createQueryBuilder('asset'),
      'asset', filters, user,
    )
      .andWhere('asset.warrantyExpiry BETWEEN :now AND :in90', { now, in90: in90Days })
      .andWhere('asset.deletedAt IS NULL')
      .getCount();

    // KPI 2: Utilization = deployed / usable-inventory * 100
    // "Usable inventory" excludes assets that have left active circulation
    // (disposed/retired/lost/stolen) — including them would understate
    // utilization once any assets are written off.
    const writtenOffStatuses = new Set([
      AssetStatus.DISPOSED, AssetStatus.RETIRED, AssetStatus.LOST, AssetStatus.STOLEN,
    ]);
    const totalCount = byStatus.reduce(
      (acc, curr) => writtenOffStatuses.has(curr.status) ? acc : acc + parseInt(curr.count), 0,
    );
    const deployedResult = byStatus.find(s => s.status.toLowerCase() === 'deployed');
    const deployedCount = deployedResult ? parseInt(deployedResult.count) : 0;

    // Assets added in last 30 days (used in KPI 17 on the asset-financial endpoint)
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(now.getDate() - 30);
    const recentlyAdded = await this.applyFilters(
      this.assetRepository.createQueryBuilder('asset'),
      'asset', filters, user,
    )
      .andWhere('asset.createdAt > :recent', { recent: thirtyDaysAgo })
      .getCount();

    return {
      byStatus,
      byCategory,
      warrantyExpired,
      warrantyExpiring30,
      warrantyExpiring60,
      warrantyExpiring90,
      utilizationPercentage:
        totalCount > 0 ? Math.round((deployedCount / totalCount) * 100) : 0,
      recentlyAdded,
    };
  }

  // ─────────────────────────────────────────────
  //  KPI 4 — Serialized Asset Units: In-Stock, Assigned, In-Repair, Written-Off
  //
  //  To track a new AssetUnitStatus, add a new count query
  //  mirroring the pattern below and expose the field.
  // ─────────────────────────────────────────────
  async getSerializedUnitKpis(filters: DashboardFilters = {}) {
    // Counts for all relevant lifecycle statuses in asset_units
    const query = this.assetUnitRepository
      .createQueryBuilder('u')
      .select('u.status', 'status')
      .addSelect('COUNT(u.id)', 'count')
      .groupBy('u.status');
    // asset_units only has a locationId column of the dashboard's filter
    // dimensions — apply that one directly rather than via the generic
    // applyFilters() helper, which assumes columns (departmentId,
    // categoryId, ...) that don't exist on this table.
    if (filters.locationId) {
      query.andWhere('u.locationId = :locId', { locId: filters.locationId });
    }
    const statusBreakdown = await query.getRawMany();

    const find = (s: AssetUnitStatus) =>
      parseInt(statusBreakdown.find(r => r.status === s)?.count || '0');

    return {
      statusBreakdown,
      inStock: find(AssetUnitStatus.IN_STOCK),
      assigned: find(AssetUnitStatus.ASSIGNED),
      inRepair: find(AssetUnitStatus.IN_REPAIR) + find(AssetUnitStatus.IN_MAINTENANCE),
      writtenOff: find(AssetUnitStatus.WRITTEN_OFF),
      disposed: find(AssetUnitStatus.DISPOSED),
      lost: find(AssetUnitStatus.LOST),
      total: statusBreakdown.reduce((acc, r) => acc + parseInt(r.count), 0),
    };
  }

  // ─────────────────────────────────────────────
  //  KPI 13 — License Seat Utilization
  //  KPI 14 — Licenses Expiring 30/60/90 Days
  //  KPI 15 — Total Annual License Spend
  //
  //  To add new billing frequency support for KPI 15,
  //  add another branch in the annualized spend calc.
  // ─────────────────────────────────────────────
  async getLicenseStats(filters: DashboardFilters = {}, user?: any) {
    const total = await this.applyFilters(
      this.licenseRepository.createQueryBuilder('license'),
      'license', filters, user,
    ).getCount();

    // KPI 13: Aggregate seat usage across all licenses
    const seatsStats = await this.applyFilters(
      this.licenseRepository.createQueryBuilder('license'),
      'license', filters, user,
    )
      .select('SUM(license.usedSeats)', 'assigned')
      .addSelect('SUM(license.totalSeats)', 'total')
      .getRawOne();

    const usedSeats = parseInt(seatsStats?.assigned || '0');
    const totalSeats = parseInt(seatsStats?.total || '0');

    // Over-allocated licenses (used > total seats)
    const overAllocated = await this.applyFilters(
      this.licenseRepository.createQueryBuilder('license'),
      'license', filters, user,
    )
      .andWhere('license.usedSeats > license.totalSeats')
      .getCount();

    const now = new Date();
    const in30 = new Date(now); in30.setDate(now.getDate() + 30);
    const in60 = new Date(now); in60.setDate(now.getDate() + 60);
    const in90 = new Date(now); in90.setDate(now.getDate() + 90);

    // KPI 14: Already expired
    const expired = await this.applyFilters(
      this.licenseRepository.createQueryBuilder('license'),
      'license', filters, user,
    )
      .andWhere('license.expiryDate < :now', { now })
      .getCount();

    // KPI 14: Expiring within 30 days
    const expiring30 = await this.applyFilters(
      this.licenseRepository.createQueryBuilder('license'),
      'license', filters, user,
    )
      .andWhere('license.expiryDate BETWEEN :now AND :in30', { now, in30 })
      .getCount();

    // KPI 14: Expiring within 60 days
    const expiring60 = await this.applyFilters(
      this.licenseRepository.createQueryBuilder('license'),
      'license', filters, user,
    )
      .andWhere('license.expiryDate BETWEEN :now AND :in60', { now, in60 })
      .getCount();

    // KPI 14: Expiring within 90 days
    const expiring90 = await this.applyFilters(
      this.licenseRepository.createQueryBuilder('license'),
      'license', filters, user,
    )
      .andWhere('license.expiryDate BETWEEN :now AND :in90', { now, in90 })
      .getCount();

    // KPI 15: Annual license spend calculation
    // Monthly licenses are annualized by × 12; annual/one-time are used as-is
    const spendByFrequencyAndCurrency = await this.applyFilters(
      this.licenseRepository.createQueryBuilder('license'),
      'license', filters, user,
    )
      .select('license.billingFrequency', 'frequency')
      .addSelect('SUM(license.totalCost)', 'total')
      .addSelect('license.currency', 'currency')
      .groupBy('license.billingFrequency')
      .addGroupBy('license.currency')
      .getRawMany();

    const frequencies = Array.from(new Set(spendByFrequencyAndCurrency.map(r => r.frequency)));
    const spendByFrequency: { frequency: string; total: number }[] = [];
    for (const frequency of frequencies) {
      const rows = spendByFrequencyAndCurrency.filter(r => r.frequency === frequency);
      spendByFrequency.push({ frequency, total: await this.sumInDisplayCurrency(rows) });
    }

    const getSpend = (freq: string) =>
      spendByFrequency.find(r => r.frequency === freq)?.total || 0;

    const annualizedSpend =
      getSpend('monthly') * 12 +
      getSpend('yearly') +
      getSpend('quarterly') * 4 +
      getSpend('one_time');

    // Utilization % for KPI 13 gauge
    const utilizationPct =
      totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0;

    return {
      total,
      usedSeats,
      totalSeats,
      availableSeats: totalSeats - usedSeats,
      overAllocated,
      expired,
      expiring30,
      expiring60,
      expiring90,
      utilizationPct,
      annualizedSpend,
      spendByFrequency,
      // Legacy alias — kept for backward compatibility with existing dashboard code
      assigned: usedSeats,
      available: totalSeats - usedSeats,
      expiringSoon: expiring30,
      compliancePercentage: utilizationPct,
    };
  }

  // ─────────────────────────────────────────────
  //  KPI 6 — Consumable Items Below Min Stock Level
  //  KPI 7 — Total Inventory Purchase Spend (last 30 days + all-time)
  //  KPI 8 — Inventory Turnover (OUT transactions this month)
  //
  //  To track a new transaction type for KPI 8, add another
  //  count query using the appropriate InventoryTransactionType.
  // ─────────────────────────────────────────────
  async getInventoryKpis(filters: DashboardFilters = {}) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);

    // KPI 6: Items where available stock is below the configured minimum threshold
    // inventory_items only has a categoryId column of the dashboard's filter
    // dimensions — applied directly since applyFilters() assumes columns
    // (departmentId, locationId, ...) that don't exist on this table.
    const belowMinStockQuery = this.inventoryItemRepository
      .createQueryBuilder('item')
      .where('item.availableStock < item.minStockLevel')
      .andWhere('item.status = :s', { s: 'active' })
      .andWhere('item.deletedAt IS NULL');
    if (filters.categoryId) {
      belowMinStockQuery.andWhere('item.categoryId = :catId', { catId: filters.categoryId });
    }
    const belowMinStock = await belowMinStockQuery.getCount();

    // Items completely out of stock
    const outOfStockQuery = this.inventoryItemRepository
      .createQueryBuilder('item')
      .where('item.availableStock = 0')
      .andWhere('item.deletedAt IS NULL');
    if (filters.categoryId) {
      outOfStockQuery.andWhere('item.categoryId = :catId', { catId: filters.categoryId });
    }
    const outOfStock = await outOfStockQuery.getCount();

    // KPI 7: Total spend — all-time
    const allTimeSpendByCurrency = await this.inventoryPurchaseRepository
      .createQueryBuilder('p')
      .where('p.deletedAt IS NULL')
      .select('SUM(p.totalCost)', 'total')
      .addSelect('p.currency', 'currency')
      .groupBy('p.currency')
      .getRawMany();

    // KPI 7: Spend — this month
    const thisMonthSpendByCurrency = await this.inventoryPurchaseRepository
      .createQueryBuilder('p')
      .where('p.purchaseDate >= :start', { start: monthStart })
      .andWhere('p.deletedAt IS NULL')
      .select('SUM(p.totalCost)', 'total')
      .addSelect('p.currency', 'currency')
      .groupBy('p.currency')
      .getRawMany();

    // KPI 7: Spend — last month (for trend delta)
    const lastMonthSpendByCurrency = await this.inventoryPurchaseRepository
      .createQueryBuilder('p')
      .where('p.purchaseDate BETWEEN :start AND :end', {
        start: lastMonthStart, end: lastMonthEnd,
      })
      .andWhere('p.deletedAt IS NULL')
      .select('SUM(p.totalCost)', 'total')
      .addSelect('p.currency', 'currency')
      .groupBy('p.currency')
      .getRawMany();

    const [allTimeSpendTotal, thisMonthSpendTotal, lastMonthSpendTotal] = await Promise.all([
      this.sumInDisplayCurrency(allTimeSpendByCurrency),
      this.sumInDisplayCurrency(thisMonthSpendByCurrency),
      this.sumInDisplayCurrency(lastMonthSpendByCurrency),
    ]);

    // KPI 8: OUT transaction quantity this month (units issued)
    const turnoverThisMonth = await this.inventoryTransactionRepository
      .createQueryBuilder('tx')
      .where('tx.type = :type', { type: InventoryTransactionType.OUT })
      .andWhere('tx.transactionDate >= :start', { start: monthStart })
      .select('SUM(tx.quantity)', 'total')
      .getRawOne();

    // KPI 8: OUT transaction quantity last month (for comparison)
    const turnoverLastMonth = await this.inventoryTransactionRepository
      .createQueryBuilder('tx')
      .where('tx.type = :type', { type: InventoryTransactionType.OUT })
      .andWhere('tx.transactionDate BETWEEN :start AND :end', {
        start: lastMonthStart, end: lastMonthEnd,
      })
      .select('SUM(tx.quantity)', 'total')
      .getRawOne();

    // Legacy inventory stats (for backward compatibility)
    const itemStockSum = await this.inventoryItemRepository
      .createQueryBuilder('item')
      .select('SUM(item.totalStock)', 'total')
      .getRawOne();

    const itemAvailableSum = await this.inventoryItemRepository
      .createQueryBuilder('item')
      .select('SUM(item.availableStock)', 'total')
      .getRawOne();

    const stockLocSum = await this.stockRepository
      .createQueryBuilder('s')
      .select('SUM(s.quantity)', 'total')
      .getRawOne();

    const refundable = await this.inventoryItemRepository.count({ where: { isRefundable: true } });
    const nonRefundable = await this.inventoryItemRepository.count({ where: { isRefundable: false } });

    return {
      // KPI 6
      belowMinStock,
      outOfStock,

      // KPI 7
      allTimeSpend: allTimeSpendTotal,
      thisMonthSpend: thisMonthSpendTotal,
      lastMonthSpend: lastMonthSpendTotal,

      // KPI 8
      turnoverThisMonth: parseInt(turnoverThisMonth?.total || '0'),
      turnoverLastMonth: parseInt(turnoverLastMonth?.total || '0'),

      // Legacy fields (backward-compatible with existing dashboard)
      totalStockUnits:
        parseInt(itemStockSum?.total || '0') + parseInt(stockLocSum?.total || '0'),
      availableUnits:
        parseInt(itemAvailableSum?.total || '0') + parseInt(stockLocSum?.total || '0'),
      lowStockAlerts: belowMinStock,
      distribution: { refundable, nonRefundable },
    };
  }

  // ─────────────────────────────────────────────
  //  KPI 9  — Active Assignments Count
  //  KPI 10 — Overdue Assignments
  //  KPI 11 — Return Rate (last 30 days)
  //  KPI 12 — Items Returned in Poor/Damaged Condition
  //
  //  Return rate = returns in 30d / assignments created in 30d.
  //  To change the time window, update the `thirtyDaysAgo` variable.
  // ─────────────────────────────────────────────
  async getAssignmentKpis(filters: DashboardFilters = {}, user?: any) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);

    // KPI 9: All currently active assignments
    const active = await this.applyFilters(
      this.assignmentRepository.createQueryBuilder('assign'),
      'assign', filters, user,
    )
      .andWhere('assign.status = :s', { s: AssignmentStatus.ACTIVE })
      .getCount();

    // KPI 9: Breakdown — serialized vs. bulk-qty
    const serializedActive = await this.applyFilters(
      this.assignmentRepository.createQueryBuilder('assign'),
      'assign', filters, user,
    )
      .andWhere('assign.status = :s', { s: AssignmentStatus.ACTIVE })
      .andWhere('assign.assetUnitId IS NOT NULL')
      .getCount();

    // KPI 10: Assignments that are explicitly marked OVERDUE
    const overdueExplicit = await this.applyFilters(
      this.assignmentRepository.createQueryBuilder('assign'),
      'assign', filters, user,
    )
      .andWhere('assign.status = :s', { s: AssignmentStatus.OVERDUE })
      .getCount();

    // KPI 10: Also count ACTIVE ones past their due date (not yet status-updated)
    const overdueImplicit = await this.applyFilters(
      this.assignmentRepository.createQueryBuilder('assign'),
      'assign', filters, user,
    )
      .andWhere('assign.status = :s', { s: AssignmentStatus.ACTIVE })
      .andWhere('assign.dueDate < :now', { now })
      .andWhere('assign.dueDate IS NOT NULL')
      .getCount();

    const totalOverdue = overdueExplicit + overdueImplicit;

    // KPI 11: Assignments created in the last 30 days (denominator for return rate)
    const assignmentsIn30d = await this.applyFilters(
      this.assignmentRepository.createQueryBuilder('assign'),
      'assign', filters, user,
    )
      .andWhere('assign.createdAt >= :start', { start: thirtyDaysAgo })
      .getCount();

    // KPI 11: Return transactions in the last 30 days (numerator)
    // Scoped to the same user as the assignments denominator above, so
    // non-Admin users get a rate over their own data, not the whole org.
    const returnsQuery = this.returnTransactionRepository
      .createQueryBuilder('rt')
      .where('rt.createdAt >= :start', { start: thirtyDaysAgo });
    if (user && user.role?.name !== 'Admin') {
      returnsQuery.andWhere('rt.returnedById = :userId', { userId: user.id });
    }
    const returnsIn30d = await returnsQuery.getCount();

    // KPI 11: Return rate % — capped at 100
    const returnRate =
      assignmentsIn30d > 0
        ? Math.min(100, Math.round((returnsIn30d / assignmentsIn30d) * 100))
        : 0;

    // KPI 12: Returns with POOR or DAMAGED condition (last 30 days)
    const damagedReturnsQuery = this.returnTransactionRepository
      .createQueryBuilder('rt')
      .where('rt.conditionOnReturn IN (:...conditions)', {
        conditions: [AssetCondition.POOR, AssetCondition.DAMAGED],
      })
      .andWhere('rt.createdAt >= :start', { start: thirtyDaysAgo });
    if (user && user.role?.name !== 'Admin') {
      damagedReturnsQuery.andWhere('rt.returnedById = :userId', { userId: user.id });
    }
    const damagedReturns = await damagedReturnsQuery.getCount();

    const damagedReturnRate =
      returnsIn30d > 0
        ? Math.round((damagedReturns / returnsIn30d) * 100)
        : 0;

    return {
      active,
      serializedActive,
      bulkActive: active - serializedActive,
      totalOverdue,
      overdueExplicit,
      overdueImplicit,
      returnRate,
      returnsIn30d,
      assignmentsIn30d,
      damagedReturns,
      damagedReturnRate,
    };
  }

  // ─────────────────────────────────────────────
  //  KPI 16 — Active Users vs. Assets Assigned Ratio
  //
  //  mostAssignedDepartment is derived from the assignment table.
  //  To add new user metrics, add a count query here.
  // ─────────────────────────────────────────────
  async getUserStats(filters: DashboardFilters = {}, user?: any) {
    const totalUsers = await this.userRepository.count({ where: { deletedAt: null } });
    const activeUsers = await this.userRepository.count({ where: { isActive: true, deletedAt: null } });

    // KPI 16: Unique users who have at least one deployed asset
    const usersWithAssetsResult = await this.assetRepository
      .createQueryBuilder('asset')
      .select('COUNT(DISTINCT asset.assignedToId)', 'count')
      .where('asset.status = :s', { s: AssetStatus.DEPLOYED })
      .andWhere('asset.assignedToId IS NOT NULL')
      .andWhere('asset.deletedAt IS NULL')
      .getRawOne();

    const usersWithAssets = parseInt(usersWithAssetsResult?.count || '0');
    const assetsPerUser =
      usersWithAssets > 0
        ? Math.round((await this.assetRepository.count({
            where: { status: AssetStatus.DEPLOYED },
          })) / usersWithAssets * 10) / 10
        : 0;

    // Most active department by assignment volume
    const deptStats = await this.applyFilters(
      this.assignmentRepository.createQueryBuilder('a'),
      'a', filters, user,
    )
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
      usersWithAssets,
      assetsPerUser,
      mostAssignedDepartment: deptStats?.department || 'N/A',
    };
  }

  // ─────────────────────────────────────────────
  //  KPI 17 — New Asset Registrations This Month
  //  KPI 18 — Total Asset Book Value vs. Purchase Cost
  //  KPI 19 — Rented Assets Monthly Recurring Cost (MRC)
  //
  //  To track a new acquisition type for KPI 19,
  //  add it to the `acquisitionType` filter below.
  // ─────────────────────────────────────────────
  async getAssetFinancialKpis(filters: DashboardFilters = {}, user?: any) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // KPI 17: New assets registered this calendar month
    const newThisMonth = await this.applyFilters(
      this.assetRepository.createQueryBuilder('asset'),
      'asset', filters, user,
    )
      .andWhere('asset.createdAt >= :start', { start: monthStart })
      .andWhere('asset.deletedAt IS NULL')
      .getCount();

    // KPI 17: New assets last month (for trend comparison)
    const newLastMonth = await this.applyFilters(
      this.assetRepository.createQueryBuilder('asset'),
      'asset', filters, user,
    )
      .andWhere('asset.createdAt BETWEEN :start AND :end', {
        start: lastMonthStart, end: lastMonthEnd,
      })
      .andWhere('asset.deletedAt IS NULL')
      .getCount();

    // KPI 17: Split by acquisition type
    const newByType = await this.applyFilters(
      this.assetRepository.createQueryBuilder('asset'),
      'asset', filters, user,
    )
      .andWhere('asset.createdAt >= :start', { start: monthStart })
      .andWhere('asset.deletedAt IS NULL')
      .select('asset.acquisitionType', 'type')
      .addSelect('COUNT(asset.id)', 'count')
      .groupBy('asset.acquisitionType')
      .getRawMany();

    // KPI 18: Sum of current_value (book value after depreciation), grouped by currency
    const bookValueByCurrency = await this.applyFilters(
      this.assetRepository.createQueryBuilder('asset'),
      'asset', filters, user,
    )
      .andWhere('asset.deletedAt IS NULL')
      .select('SUM(asset.currentValue)', 'bookValue')
      .addSelect('SUM(asset.purchaseCost)', 'purchaseCost')
      .addSelect('asset.currency', 'currency')
      .groupBy('asset.currency')
      .getRawMany();

    const [totalBookValue, totalPurchaseCost] = await Promise.all([
      this.sumInDisplayCurrency(bookValueByCurrency.map(r => ({ currency: r.currency, total: r.bookValue }))),
      this.sumInDisplayCurrency(bookValueByCurrency.map(r => ({ currency: r.currency, total: r.purchaseCost }))),
    ]);
    const totalDepreciation = totalPurchaseCost - totalBookValue;

    // KPI 19: Sum of vendor_monthly_rent for rented assets only, grouped by currency
    const mrcByCurrency = await this.applyFilters(
      this.assetRepository.createQueryBuilder('asset'),
      'asset', filters, user,
    )
      .andWhere('asset.acquisitionType = :type', { type: AcquisitionType.RENTED })
      .andWhere('asset.deletedAt IS NULL')
      .select('SUM(asset.vendorMonthlyRent)', 'mrc')
      .addSelect('COUNT(asset.id)', 'rentedCount')
      .addSelect('asset.currency', 'currency')
      .groupBy('asset.currency')
      .getRawMany();

    const mrcTotal = await this.sumInDisplayCurrency(mrcByCurrency.map(r => ({ currency: r.currency, total: r.mrc })));
    const rentedCountTotal = mrcByCurrency.reduce((sum, r) => sum + (parseInt(r.rentedCount) || 0), 0);

    return {
      // KPI 17
      newThisMonth,
      newLastMonth,
      newByType,

      // KPI 18
      totalBookValue,
      totalPurchaseCost,
      totalDepreciation,
      depreciationPct:
        totalPurchaseCost > 0
          ? Math.round((totalDepreciation / totalPurchaseCost) * 100)
          : 0,

      // KPI 19
      monthlyRecurringCost: mrcTotal,
      rentedAssetCount: rentedCountTotal,
    };
  }

  // ─────────────────────────────────────────────
  //  KPI 20 — System Activity Last 24 Hours
  //
  //  Reads from `audit_events` (immutable append-only log).
  //  Returns per-action counts and an hourly breakdown
  //  for the sparkline chart in the dashboard.
  //
  //  To track activity for a new AuditAction, it will
  //  automatically appear in the `byAction` breakdown —
  //  no code change needed here.
  // ─────────────────────────────────────────────
  async getAuditActivityKpis() {
    const now = new Date();
    const last24h = new Date(now); last24h.setHours(now.getHours() - 24);

    // Total events in the last 24 hours
    const total24h = await this.auditEventRepository
      .createQueryBuilder('ae')
      .where('ae.createdAt >= :start', { start: last24h })
      .getCount();

    // Per-action breakdown for the last 24 hours
    const byAction = await this.auditEventRepository
      .createQueryBuilder('ae')
      .where('ae.createdAt >= :start', { start: last24h })
      .select('ae.action', 'action')
      .addSelect('COUNT(ae.id)', 'count')
      .groupBy('ae.action')
      .getRawMany();

    // Per-hour activity count for the sparkline (last 12 hours)
    const hourlyBreakdown = await this.auditEventRepository
      .createQueryBuilder('ae')
      .where('ae.createdAt >= :start', { start: last24h })
      .select("DATE_PART('hour', ae.createdAt)", 'hour')
      .addSelect('COUNT(ae.id)', 'count')
      .groupBy("DATE_PART('hour', ae.createdAt)")
      .orderBy('hour', 'ASC')
      .getRawMany();

    // Most recent 10 events (for the activity feed)
    const recentEvents = await this.auditEventRepository
      .createQueryBuilder('ae')
      .leftJoinAndSelect('ae.actor', 'actor')
      .orderBy('ae.createdAt', 'DESC')
      .take(10)
      .getMany();

    const findAction = (action: string) =>
      parseInt(byAction.find(r => r.action === action)?.count || '0');

    return {
      total24h,
      byAction,
      hourlyBreakdown,
      recentEvents: recentEvents.map(e => ({
        id: e.id,
        action: e.action,
        entityType: e.entityType,
        entityId: e.entityId,
        actorName: e.actor
          ? `${e.actor.firstName || ''} ${e.actor.lastName || ''}`.trim() || e.actor.email
          : 'System',
        createdAt: e.createdAt,
        metadata: e.metadata,
      })),
      issueCount: findAction(AuditAction.ISSUE),
      returnCount: findAction(AuditAction.RETURN),
      loginCount: findAction(AuditAction.LOGIN),
      createCount: findAction(AuditAction.CREATE),
    };
  }

  // ─────────────────────────────────────────────
  //  Dashboard Alerts (used in header alert strip)
  //  Aggregates critical counts across all KPI domains.
  // ─────────────────────────────────────────────
  async getAlerts(filters: DashboardFilters = {}, user?: any) {
    const [assetStats, invKpis, licenseStats, assignKpis] = await Promise.all([
      this.getAssetStats(filters, user),
      this.getInventoryKpis(filters),
      this.getLicenseStats(filters, user),
      this.getAssignmentKpis(filters, user),
    ]);

    const unassignedAssets = await this.applyFilters(
      this.assetRepository.createQueryBuilder('asset'),
      'asset', filters, user,
    )
      .andWhere('asset.status = :s', { s: AssetStatus.AVAILABLE })
      .getCount();

    return {
      warrantyExpired: assetStats.warrantyExpired,
      warrantyExpiring30: assetStats.warrantyExpiring30,
      warrantyExpiring60: assetStats.warrantyExpiring60,
      lowStockItems: invKpis.belowMinStock,
      outOfStock: invKpis.outOfStock,
      expiredLicenses: licenseStats.expired,
      licensesExpiring30: licenseStats.expiring30,
      overAllocatedLicenses: licenseStats.overAllocated,
      overdueReturns: assignKpis.totalOverdue,
      damagedReturns: assignKpis.damagedReturns,
      assetsUnassigned: unassignedAssets,
      // Total critical alert count for the header badge
      totalCritical:
        assetStats.warrantyExpired +
        invKpis.outOfStock +
        licenseStats.expired +
        assignKpis.totalOverdue,
    };
  }

  // ─────────────────────────────────────────────
  //  Stock Movement (used in the stock movement bar chart)
  // ─────────────────────────────────────────────
  async getStockMovement(filters: DashboardFilters = {}, user?: any) {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const reasons = [LedgerReason.PROCUREMENT, LedgerReason.ISSUE, LedgerReason.RETURN, LedgerReason.ADJUSTMENT];

    const thisMonth = await this.applyFilters(
      this.stockLedgerRepository.createQueryBuilder('sl'),
      'sl', filters, user,
    )
      .select('sl.reason', 'reason')
      .addSelect('SUM(ABS(sl.quantityChange))', 'count')
      .andWhere('sl.createdAt >= :start', { start: thisMonthStart })
      .andWhere('sl.reason IN (:...reasons)', { reasons })
      .groupBy('sl.reason')
      .getRawMany();

    const lastMonth = await this.applyFilters(
      this.stockLedgerRepository.createQueryBuilder('sl'),
      'sl', filters, user,
    )
      .select('sl.reason', 'reason')
      .addSelect('SUM(ABS(sl.quantityChange))', 'count')
      .andWhere('sl.createdAt BETWEEN :start AND :end', { start: lastMonthStart, end: lastMonthEnd })
      .andWhere('sl.reason IN (:...reasons)', { reasons })
      .groupBy('sl.reason')
      .getRawMany();

    return { thisMonth, lastMonth };
  }

  // ─────────────────────────────────────────────
  //  License Utilization per software (top N)
  //  Used in KPI 13 per-software breakdown table.
  // ─────────────────────────────────────────────
  async getLicenseUtilization(filters: DashboardFilters = {}, user?: any) {
    // Explicit aliases so getRawMany() returns the camelCase keys the
    // frontend expects (license_softwareName, license_totalSeats, ...)
    // instead of TypeORM's default snake_case DB-column-derived aliases.
    return this.applyFilters(
      this.licenseRepository.createQueryBuilder('license'),
      'license', filters, user,
    )
      .orderBy('license.usedSeats', 'DESC')
      .take(8)
      .select('license.softwareName', 'license_softwareName')
      .addSelect('license.totalSeats', 'license_totalSeats')
      .addSelect('license.usedSeats', 'license_usedSeats')
      .addSelect('license.expiryDate', 'license_expiryDate')
      .addSelect('license.billingFrequency', 'license_billingFrequency')
      .addSelect('license.totalCost', 'license_totalCost')
      .getRawMany();
  }

  // ─────────────────────────────────────────────
  //  Recent Activity feed (fallback to audit_log)
  // ─────────────────────────────────────────────
  async getRecentActivity(filters: any = {}, user?: any) {
    const query = this.auditLogRepository.createQueryBuilder('log');
    this.applyFilters(query, 'log', null, user);
    if (filters.userId) {
      query.andWhere('log.userId = :userId', { userId: filters.userId });
    }
    return query.orderBy('log.createdAt', 'DESC').take(10).getMany();
  }

  /* ─── Legacy stubs — kept for API backward compatibility ─── */

  async getDashboardStats() {
    return {};
  }

  async getAssetRefreshReport() {
    return [];
  }

  async getDepreciationReport() {
    return [];
  }

  async getInventoryStats(filters: DashboardFilters = {}, user?: any) {
    // Delegates to getInventoryKpis for backward compatibility
    return this.getInventoryKpis(filters);
  }
}
