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
import { AssetUnit } from '../../entities/asset-unit.entity';
import { StockByLocation } from '../../entities/stock-by-location.entity';
import { CatalogItem } from '../../entities/catalog-item.entity';
import { InventoryItem } from '../../entities/inventory-item.entity';
import { InventoryPurchase } from '../../entities/inventory-purchase.entity';
import { InventoryTransaction, InventoryTransactionType } from '../../entities/inventory-transaction.entity';
import { License } from '../../entities/license.entity';
import { User } from '../../entities/user.entity';
import { Assignment } from '../../entities/assignment.entity';
import { ReturnTransaction } from '../../entities/return-transaction.entity';
import { InventoryAssignment, InventoryAssignmentStatus } from '../../entities/inventory-assignment.entity';
import { InventoryReturn } from '../../entities/inventory-return.entity';
import { AssetHistory } from '../../entities/asset-history.entity';
import { StockLedger } from '../../entities/stock-ledger.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { AuditEvent, AuditAction } from '../../entities/audit-event.entity';
import { SettingsService } from '../settings/settings.service';
import { CurrenciesService } from '../currencies/currencies.service';

// ─────────────────────────────────────────────
//  Shared filter interface used across all KPI methods.
//  Extend this interface if you need new filter dimensions.
// ─────────────────────────────────────────────
export interface DashboardFilters {
  /** ISO code to express monetary aggregates in; defaults to the org DEFAULT_CURRENCY setting */
  displayCurrency?: string;
  startDate?: string;
  endDate?: string;
  departmentId?: number;
  locationId?: number;
  categoryId?: number;
  brandId?: number;
  vendorId?: number;
  status?: string;
}

// ─────────────────────────────────────────────
//  Dashboard data-scope tiers (see AnalyticsService.resolveScope).
// ─────────────────────────────────────────────
export type ScopeLevel = 'global' | 'department' | 'self';

export interface DashboardScope {
  level: ScopeLevel;
  userId: number;
  departmentId: number | null;
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

    @InjectRepository(InventoryAssignment)
    private inventoryAssignmentRepository: Repository<InventoryAssignment>,

    @InjectRepository(InventoryReturn)
    private inventoryReturnRepository: Repository<InventoryReturn>,

    @InjectRepository(AssetHistory)
    private assetHistoryRepository: Repository<AssetHistory>,

    @InjectRepository(StockLedger)
    private stockLedgerRepository: Repository<StockLedger>,

    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,

    @InjectRepository(AuditEvent)
    private auditEventRepository: Repository<AuditEvent>,

    private settingsService: SettingsService,

    private currenciesService: CurrenciesService,
  ) {}

  // ─────────────────────────────────────────────
  //  PRIVATE: Converts a list of { currency, total } subtotals
  //  (e.g. from a `GROUP BY currency` query) into a single number
  //  expressed in the requested display currency (falling back to the
  //  org's DEFAULT_CURRENCY setting), using the admin-maintained
  //  currency_rates table.
  //  Rate semantics: rateToBase = "1 [code] = X INR".
  // ─────────────────────────────────────────────
  private async sumInDisplayCurrency(
    subtotals: { currency: string; total: string | number }[],
    requestedCurrency?: string,
  ): Promise<number> {
    const [displayCurrencySetting, rates] = await Promise.all([
      requestedCurrency
        ? Promise.resolve(requestedCurrency)
        : this.settingsService.getSetting('DEFAULT_CURRENCY'),
      this.currenciesService.getRatesMap(),
    ]);
    const displayCurrency = displayCurrencySetting || 'INR';

    const rateFor = (code: string) => rates[code] ?? 1;

    return subtotals.reduce((sum, row) => {
      const amount = Number(row.total) || 0;
      const amountInInr = amount * rateFor(row.currency || 'INR');
      const converted = displayCurrency === 'INR' ? amountInInr : amountInInr / rateFor(displayCurrency);
      return sum + converted;
    }, 0);
  }

  // ─────────────────────────────────────────────
  //  PRIVATE: Resolves the dashboard data-scope tier from the
  //  authenticated user's permissions (never from role names):
  //   - 'global'     : holds 'dashboard.view.all' (Admin/IT/Helpdesk/Auditor)
  //   - 'department' : holds 'dashboard.view.department' (Manager) — sees only
  //                    records belonging to users in their own department.
  //   - 'self'       : neither (Standard User) — sees only their own records.
  //  A missing user (internal/report calls) is treated as global.
  // ─────────────────────────────────────────────
  private resolveScope(user?: any): DashboardScope {
    if (!user) return { level: 'global', userId: 0, departmentId: null };
    const perms: string[] = user.permissions || [];
    const level: ScopeLevel = perms.includes('dashboard.view.all')
      ? 'global'
      : perms.includes('dashboard.view.department')
        ? 'department'
        : 'self';
    return {
      level,
      userId: user.id,
      departmentId: user.departmentId ?? null,
    };
  }

  /** True when the scope restricts data to a subset (department or self). */
  private isScoped(scope: DashboardScope): boolean {
    return scope.level !== 'global';
  }

  // ─────────────────────────────────────────────
  //  PRIVATE: Applies the resolved data-scope to a QueryBuilder for a
  //  known entity alias. Global scope adds nothing. Department/self add
  //  the appropriate WHERE/JOIN so a user can never see other people's
  //  (or other departments') records.
  // ─────────────────────────────────────────────
  private applyScope(
    query: SelectQueryBuilder<any>,
    alias: string,
    scope: DashboardScope,
  ): SelectQueryBuilder<any> {
    if (scope.level === 'global') return query;

    const uid = scope.userId;
    const dept = scope.departmentId;

    switch (alias) {
      case 'asset':
        // Asset has no departmentId — a department is derived from the
        // assigned user. Both tiers therefore exclude the unassigned pool.
        if (scope.level === 'self') {
          query.andWhere('asset.assignedToId = :scopeUid', { scopeUid: uid });
        } else {
          query
            .innerJoin('asset.assignedTo', 'scopeUser')
            .andWhere('scopeUser.departmentId = :scopeDept', { scopeDept: dept });
        }
        break;

      case 'license':
        // Subquery (not a join) so aggregate queries like SUM(usedSeats) aren't
        // inflated by a license having multiple matching assignments.
        if (scope.level === 'self') {
          query.andWhere(
            'license.id IN (SELECT la.license_id FROM license_assignments la WHERE la.user_id = :scopeUid)',
            { scopeUid: uid },
          );
        } else {
          query.andWhere(
            'license.id IN (SELECT la.license_id FROM license_assignments la ' +
              'INNER JOIN users u ON u.id = la.user_id WHERE u.department_id = :scopeDept)',
            { scopeDept: dept },
          );
        }
        break;

      case 'assign':
      case 'a':
        // Assignment carries both assigneeId and a real departmentId FK.
        if (scope.level === 'self') {
          query.andWhere(`${alias}.assigneeId = :scopeUid`, { scopeUid: uid });
        } else {
          query.andWhere(`${alias}.departmentId = :scopeDept`, { scopeDept: dept });
        }
        break;

      case 'log':
        // Legacy audit_log — scope by the acting user for both tiers
        // (no department linkage on this table).
        query.andWhere('log.userId = :scopeUid', { scopeUid: uid });
        break;
    }

    return query;
  }

  // ─────────────────────────────────────────────
  //  PRIVATE: Applies the resolved data-scope to an audit_events query.
  //  self       → events the user performed (actorId)
  //  department → events performed by users in the same department
  // ─────────────────────────────────────────────
  private applyAuditScope(
    query: SelectQueryBuilder<any>,
    alias: string,
    scope: DashboardScope,
  ): SelectQueryBuilder<any> {
    if (scope.level === 'global') return query;
    if (scope.level === 'self') {
      query.andWhere(`${alias}.actorId = :scopeUid`, { scopeUid: scope.userId });
    } else {
      query
        .innerJoin(`${alias}.actor`, 'scopeActor')
        .andWhere('scopeActor.departmentId = :scopeDept', { scopeDept: scope.departmentId });
    }
    return query;
  }

  // ─────────────────────────────────────────────
  //  PRIVATE: Scopes an inventory_assignments query. The department FK lives
  //  on the assignee, so department scope joins through the user (the entity's
  //  own `department` column is free-text and unreliable).
  // ─────────────────────────────────────────────
  private scopeInventoryAssignment(
    query: SelectQueryBuilder<any>,
    scope: DashboardScope,
    alias = 'ia',
  ): SelectQueryBuilder<any> {
    if (scope.level === 'global') return query;
    if (scope.level === 'self') {
      query.andWhere(`${alias}.userId = :scopeUid`, { scopeUid: scope.userId });
    } else {
      query
        .innerJoin(User, 'scopeIaUser', `scopeIaUser.id = ${alias}.userId`)
        .andWhere('scopeIaUser.departmentId = :scopeDept', { scopeDept: scope.departmentId });
    }
    return query;
  }

  // ─────────────────────────────────────────────
  //  PRIVATE: User count consistent with the data scope.
  //   global → all active accounts; department → accounts in the department;
  //   self → just the one user.
  // ─────────────────────────────────────────────
  private async scopedUserCount(scope: DashboardScope): Promise<number> {
    if (scope.level === 'self') return 1;
    if (scope.level === 'department') {
      return this.userRepository.count({
        where: { departmentId: scope.departmentId, deletedAt: null },
      });
    }
    return this.userRepository.count({ where: { deletedAt: null } });
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
    // Permission-based data scoping — see resolveScope() for the tiers.
    this.applyScope(query, alias, this.resolveScope(user));

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
    const scope = this.resolveScope(user);

    const totalAssets = await this.applyFilters(
      this.assetRepository.createQueryBuilder('asset'),
      'asset', filters, user,
    ).getCount();

    const totalLicenses = await this.applyFilters(
      this.licenseRepository.createQueryBuilder('license'),
      'license', filters, user,
    ).getCount();

    // Consumable inventory has no per-user/department owner — hide from
    // non-global scopes rather than leak an org-wide count.
    const totalInventoryItems = this.isScoped(scope)
      ? 0
      : await this.inventoryItemRepository.createQueryBuilder('item').getCount();

    const totalUsers = await this.scopedUserCount(scope);

    // Active assignments = bulk consumable assignments out + serialized assets deployed
    const activeBulkQuery = this.inventoryAssignmentRepository
      .createQueryBuilder('ia')
      .where('ia.status = :s', { s: InventoryAssignmentStatus.ASSIGNED });
    this.scopeInventoryAssignment(activeBulkQuery, scope);

    const activeSerializedQuery = this.applyScope(
      this.assetRepository
        .createQueryBuilder('asset')
        .where('asset.status = :s', { s: AssetStatus.DEPLOYED })
        .andWhere('asset.deletedAt IS NULL'),
      'asset', scope,
    );
    const activeAssignments =
      (await activeBulkQuery.getCount()) + (await activeSerializedQuery.getCount());

    // Total asset value = sum of purchase costs, grouped by currency
    const assetValueByCurrency = await this.applyFilters(
      this.assetRepository.createQueryBuilder('asset'),
      'asset', filters, user,
    )
      .select('SUM(asset.purchaseCost)', 'total')
      .addSelect('asset.currency', 'currency')
      .groupBy('asset.currency')
      .getRawMany();

    // Total inventory value = stock quantity × unit cost, grouped by currency.
    // Org-wide stock — only meaningful (and only shown) at global scope.
    const inventoryValueByCurrency = this.isScoped(scope)
      ? []
      : await this.stockRepository.createQueryBuilder('s')
          .leftJoin('s.catalogItem', 'ci')
          .select('SUM(s.quantity * ci.unitCost)', 'total')
          .addSelect('ci.currency', 'currency')
          .groupBy('ci.currency')
          .getRawMany();

    const [assetValue, inventoryValue] = await Promise.all([
      this.sumInDisplayCurrency(assetValueByCurrency, filters?.displayCurrency),
      this.sumInDisplayCurrency(inventoryValueByCurrency, filters?.displayCurrency),
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
  //  Sourced from the legacy Asset entity's status field (the same table
  //  backing KPI 1-3) rather than the newer AssetUnit/CatalogItem table —
  //  the app's day-to-day usage goes entirely through Asset, so AssetUnit
  //  is normally empty and made this card show all zeros.
  // ─────────────────────────────────────────────
  async getSerializedUnitKpis(filters: DashboardFilters = {}, user?: any) {
    const statusBreakdown = await this.applyFilters(
      this.assetRepository.createQueryBuilder('asset'),
      'asset', filters, user,
    )
      .select('asset.status', 'status')
      .addSelect('COUNT(asset.id)', 'count')
      .groupBy('asset.status')
      .getRawMany();

    const find = (s: AssetStatus) =>
      parseInt(statusBreakdown.find(r => r.status === s)?.count || '0');

    return {
      statusBreakdown,
      inStock: find(AssetStatus.AVAILABLE),
      assigned: find(AssetStatus.DEPLOYED),
      inRepair: find(AssetStatus.MAINTENANCE) + find(AssetStatus.REPAIR) + find(AssetStatus.IN_REPAIR),
      writtenOff: find(AssetStatus.DISPOSED) + find(AssetStatus.RETIRED),
      disposed: find(AssetStatus.DISPOSED),
      lost: find(AssetStatus.LOST) + find(AssetStatus.STOLEN),
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
      spendByFrequency.push({ frequency, total: await this.sumInDisplayCurrency(rows, filters?.displayCurrency) });
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
  async getInventoryKpis(filters: DashboardFilters = {}, user?: any) {
    // Consumable inventory/procurement has no per-user or per-department owner,
    // so a scoped (department/self) user gets nothing org-wide here.
    if (this.isScoped(this.resolveScope(user))) {
      return {
        belowMinStock: 0,
        outOfStock: 0,
        allTimeSpend: 0,
        thisMonthSpend: 0,
        lastMonthSpend: 0,
        turnoverThisMonth: 0,
        turnoverLastMonth: 0,
        totalStockUnits: 0,
        availableUnits: 0,
        lowStockAlerts: 0,
        distribution: { refundable: 0, nonRefundable: 0 },
      };
    }

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
      this.sumInDisplayCurrency(allTimeSpendByCurrency, filters?.displayCurrency),
      this.sumInDisplayCurrency(thisMonthSpendByCurrency, filters?.displayCurrency),
      this.sumInDisplayCurrency(lastMonthSpendByCurrency, filters?.displayCurrency),
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
  //  Sources: inventory_assignments / inventory_returns (bulk consumables)
  //  and deployed assets (serialized hardware).
  //  Return rate = returns in 30d / assignments created in 30d.
  //  To change the time window, update the `thirtyDaysAgo` variable.
  // ─────────────────────────────────────────────
  async getAssignmentKpis(filters: DashboardFilters = {}, user?: any) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);
    const scope = this.resolveScope(user);

    // Scope helpers. Always applied AFTER the base .where() conditions so the
    // scope's andWhere/innerJoin is never clobbered by a subsequent .where().
    const scopeReturns = (qb: SelectQueryBuilder<InventoryReturn>) => {
      if (scope.level === 'global') return qb;
      qb.innerJoin('ir.assignment', 'ria');
      if (scope.level === 'self') {
        qb.andWhere('ria.userId = :scopeUid', { scopeUid: scope.userId });
      } else {
        qb.innerJoin(User, 'riaUser', 'riaUser.id = ria.userId')
          .andWhere('riaUser.departmentId = :scopeDept', { scopeDept: scope.departmentId });
      }
      return qb;
    };

    // Serialized issue/return activity comes from asset audit events; metadata
    // holds the (previous) assignee id. userMetaKey is an internal literal, not
    // user input — safe to interpolate.
    const scopeAssetEvents = (qb: SelectQueryBuilder<AuditEvent>, userMetaKey: string) => {
      if (scope.level === 'global') return qb;
      if (scope.level === 'self') {
        qb.andWhere(`(ev.metadata ->> '${userMetaKey}')::int = :scopeUid`, { scopeUid: scope.userId });
      } else {
        qb.andWhere(
          `(ev.metadata ->> '${userMetaKey}')::int IN (SELECT u.id FROM users u WHERE u.department_id = :scopeDept)`,
          { scopeDept: scope.departmentId },
        );
      }
      return qb;
    };

    // KPI 9: Bulk consumable assignments currently out
    const bulkActive = await this.scopeInventoryAssignment(
      this.inventoryAssignmentRepository.createQueryBuilder('ia')
        .where('ia.status = :s', { s: InventoryAssignmentStatus.ASSIGNED }),
      scope,
    ).getCount();

    // KPI 9: Serialized hardware currently deployed to a user
    const serializedActive = await this.applyScope(
      this.assetRepository.createQueryBuilder('asset')
        .where('asset.status = :s', { s: AssetStatus.DEPLOYED })
        .andWhere('asset.deletedAt IS NULL'),
      'asset', scope,
    ).getCount();

    const active = bulkActive + serializedActive;

    // KPI 10: Active bulk assignments past their expected return date
    const overdueImplicit = await this.scopeInventoryAssignment(
      this.inventoryAssignmentRepository.createQueryBuilder('ia')
        .where('ia.status = :s', { s: InventoryAssignmentStatus.ASSIGNED })
        .andWhere('ia.expectedReturnDate IS NOT NULL')
        .andWhere('ia.expectedReturnDate < :now', { now }),
      scope,
    ).getCount();

    const totalOverdue = overdueImplicit;

    // KPI 11: Assignments created in the last 30 days (denominator for return rate)
    const bulkAssignmentsIn30d = await this.scopeInventoryAssignment(
      this.inventoryAssignmentRepository.createQueryBuilder('ia')
        .where('ia.createdAt >= :start', { start: thirtyDaysAgo }),
      scope,
    ).getCount();

    const serializedIssuesIn30d = await scopeAssetEvents(
      this.auditEventRepository
        .createQueryBuilder('ev')
        .where('ev.action = :a', { a: AuditAction.ISSUE })
        .andWhere('ev.entityType = :et', { et: 'asset' })
        .andWhere('ev.createdAt >= :start', { start: thirtyDaysAgo }),
      'assignedToId',
    ).getCount();

    const assignmentsIn30d = bulkAssignmentsIn30d + serializedIssuesIn30d;

    // KPI 11: Returns processed in the last 30 days (numerator)
    const bulkReturnsIn30d = await scopeReturns(
      this.inventoryReturnRepository.createQueryBuilder('ir')
        .where('ir.createdAt >= :start', { start: thirtyDaysAgo }),
    ).getCount();

    const serializedReturnsIn30d = await scopeAssetEvents(
      this.auditEventRepository
        .createQueryBuilder('ev')
        .where('ev.action = :a', { a: AuditAction.RETURN })
        .andWhere('ev.entityType = :et', { et: 'asset' })
        .andWhere('ev.createdAt >= :start', { start: thirtyDaysAgo }),
      'previousAssignedToId',
    ).getCount();

    const returnsIn30d = bulkReturnsIn30d + serializedReturnsIn30d;

    // KPI 11: Return rate % — capped at 100
    const returnRate =
      assignmentsIn30d > 0
        ? Math.min(100, Math.round((returnsIn30d / assignmentsIn30d) * 100))
        : 0;

    // KPI 12: Returns in poor/damaged/lost condition (last 30 days)
    const damagedConditions = ['poor', 'damaged', 'lost'];

    const bulkDamagedReturns = await scopeReturns(
      this.inventoryReturnRepository.createQueryBuilder('ir')
        .where('LOWER(ir.condition) IN (:...conditions)', { conditions: damagedConditions })
        .andWhere('ir.createdAt >= :start', { start: thirtyDaysAgo }),
    ).getCount();

    const serializedDamagedReturns = await scopeAssetEvents(
      this.auditEventRepository
        .createQueryBuilder('ev')
        .where('ev.action = :a', { a: AuditAction.RETURN })
        .andWhere('ev.entityType = :et', { et: 'asset' })
        .andWhere("LOWER(ev.metadata ->> 'conditionOnReturn') IN (:...conditions)", { conditions: damagedConditions })
        .andWhere('ev.createdAt >= :start', { start: thirtyDaysAgo }),
      'previousAssignedToId',
    ).getCount();

    const damagedReturns = bulkDamagedReturns + serializedDamagedReturns;

    const damagedReturnRate =
      returnsIn30d > 0
        ? Math.round((damagedReturns / returnsIn30d) * 100)
        : 0;

    return {
      active,
      serializedActive,
      bulkActive,
      totalOverdue,
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
    const scope = this.resolveScope(user);

    const totalUsers = await this.scopedUserCount(scope);
    const activeUsers =
      scope.level === 'self'
        ? 1
        : scope.level === 'department'
          ? await this.userRepository.count({
              where: { isActive: true, departmentId: scope.departmentId, deletedAt: null },
            })
          : await this.userRepository.count({ where: { isActive: true, deletedAt: null } });

    // KPI 16: Unique users who have at least one deployed asset (scoped)
    const usersWithAssetsResult = await this.applyScope(
      this.assetRepository
        .createQueryBuilder('asset')
        .select('COUNT(DISTINCT asset.assignedToId)', 'count')
        .where('asset.status = :s', { s: AssetStatus.DEPLOYED })
        .andWhere('asset.assignedToId IS NOT NULL')
        .andWhere('asset.deletedAt IS NULL'),
      'asset', scope,
    ).getRawOne();

    const usersWithAssets = parseInt(usersWithAssetsResult?.count || '0');

    const deployedCount = await this.applyScope(
      this.assetRepository
        .createQueryBuilder('asset')
        .where('asset.status = :s', { s: AssetStatus.DEPLOYED })
        .andWhere('asset.deletedAt IS NULL'),
      'asset', scope,
    ).getCount();

    const assetsPerUser =
      usersWithAssets > 0 ? Math.round((deployedCount / usersWithAssets) * 10) / 10 : 0;

    // Most active department by assignment volume. Uses andWhere (not where) so
    // the scope conditions added by applyFilters are preserved.
    const deptStats = await this.applyFilters(
      this.assignmentRepository.createQueryBuilder('a'),
      'a', filters, user,
    )
      .leftJoin('a.department', 'd')
      .select('d.name', 'department')
      .addSelect('COUNT(a.id)', 'count')
      .andWhere('a.departmentId IS NOT NULL')
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
      this.sumInDisplayCurrency(bookValueByCurrency.map(r => ({ currency: r.currency, total: r.bookValue })), filters?.displayCurrency),
      this.sumInDisplayCurrency(bookValueByCurrency.map(r => ({ currency: r.currency, total: r.purchaseCost })), filters?.displayCurrency),
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

    const mrcTotal = await this.sumInDisplayCurrency(mrcByCurrency.map(r => ({ currency: r.currency, total: r.mrc })), filters?.displayCurrency);
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
  async getAuditActivityKpis(user?: any) {
    const now = new Date();
    const last24h = new Date(now); last24h.setHours(now.getHours() - 24);
    const scope = this.resolveScope(user);

    // Total events in the last 24 hours
    const total24h = await this.applyAuditScope(
      this.auditEventRepository
        .createQueryBuilder('ae')
        .where('ae.createdAt >= :start', { start: last24h }),
      'ae', scope,
    ).getCount();

    // Per-action breakdown for the last 24 hours
    const byAction = await this.applyAuditScope(
      this.auditEventRepository
        .createQueryBuilder('ae')
        .where('ae.createdAt >= :start', { start: last24h }),
      'ae', scope,
    )
      .select('ae.action', 'action')
      .addSelect('COUNT(ae.id)', 'count')
      .groupBy('ae.action')
      .getRawMany();

    // Per-hour activity count for the sparkline (last 12 hours)
    const hourlyBreakdown = await this.applyAuditScope(
      this.auditEventRepository
        .createQueryBuilder('ae')
        .where('ae.createdAt >= :start', { start: last24h }),
      'ae', scope,
    )
      .select("DATE_PART('hour', ae.createdAt)", 'hour')
      .addSelect('COUNT(ae.id)', 'count')
      .groupBy("DATE_PART('hour', ae.createdAt)")
      .orderBy('hour', 'ASC')
      .getRawMany();

    // Most recent 10 events (for the activity feed)
    const recentEvents = await this.applyAuditScope(
      this.auditEventRepository
        .createQueryBuilder('ae')
        .leftJoinAndSelect('ae.actor', 'actor'),
      'ae', scope,
    )
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
      this.getInventoryKpis(filters, user),
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
  // Sourced from the legacy InventoryTransaction entity (consumable-inventory
  // module) rather than the newer StockLedger table — the app's real
  // purchase/assignment/return activity is recorded there, while StockLedger
  // (catalog/AssetUnit subsystem) is normally empty, which made this chart
  // show all zeros.
  async getStockMovement(filters: DashboardFilters = {}, user?: any) {
    // Org-wide consumable stock movement has no per-user/department owner —
    // scoped users get an empty chart rather than org-wide data.
    if (this.isScoped(this.resolveScope(user))) {
      return { thisMonth: [], lastMonth: [] };
    }

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const reasonByType: Record<InventoryTransactionType, string> = {
      [InventoryTransactionType.IN]: 'procurement',
      [InventoryTransactionType.OUT]: 'issue',
      [InventoryTransactionType.RETURN]: 'return',
      [InventoryTransactionType.ADJUSTMENT]: 'adjustment',
    };

    const mapRows = (rows: { type: InventoryTransactionType; count: string }[]) =>
      rows.map((r) => ({ reason: reasonByType[r.type], count: r.count }));

    const thisMonthRaw = await this.inventoryTransactionRepository
      .createQueryBuilder('tx')
      .select('tx.type', 'type')
      .addSelect('SUM(tx.quantity)', 'count')
      .where('tx.transactionDate >= :start', { start: thisMonthStart })
      .groupBy('tx.type')
      .getRawMany();

    const lastMonthRaw = await this.inventoryTransactionRepository
      .createQueryBuilder('tx')
      .select('tx.type', 'type')
      .addSelect('SUM(tx.quantity)', 'count')
      .where('tx.transactionDate BETWEEN :start AND :end', { start: lastMonthStart, end: lastMonthEnd })
      .groupBy('tx.type')
      .getRawMany();

    return { thisMonth: mapRows(thisMonthRaw), lastMonth: mapRows(lastMonthRaw) };
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
      .select('COALESCE(license.planName, license.softwareName)', 'license_softwareName')
      .addSelect('license.totalSeats', 'license_totalSeats')
      .addSelect('license.usedSeats', 'license_usedSeats')
      .addSelect('license.expiryDate', 'license_expiryDate')
      .addSelect('license.billingFrequency', 'license_billingFrequency')
      .addSelect('license.totalCost', 'license_totalCost')
      .getRawMany();
  }

  // ─────────────────────────────────────────────
  //  Recent Activity feed — sourced from the audit_events table
  //  (the append-only event log every mutation writes to; the
  //  legacy audit_log table is no longer written to).
  // ─────────────────────────────────────────────
  async getRecentActivity(filters: any = {}, user?: any) {
    const query = this.auditEventRepository
      .createQueryBuilder('ae')
      .leftJoinAndSelect('ae.actor', 'actor');

    // Permission-based scoping — self sees own actions, department sees the
    // department's actions, global sees everything.
    this.applyAuditScope(query, 'ae', this.resolveScope(user));
    if (filters.userId) {
      query.andWhere('ae.actorId = :filterUserId', { filterUserId: filters.userId });
    }

    const events = await query.orderBy('ae.createdAt', 'DESC').take(10).getMany();

    return events.map((e) => ({
      id: e.id,
      action: e.action,
      entityType: e.entityType,
      entityId: e.entityId,
      actorName: e.actor
        ? `${e.actor.firstName || ''} ${e.actor.lastName || ''}`.trim() || e.actor.email
        : 'System',
      createdAt: e.createdAt,
    }));
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
    return this.getInventoryKpis(filters, user);
  }
}
