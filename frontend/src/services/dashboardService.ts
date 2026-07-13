/**
 * @file dashboardService.ts
 * @description Typed API client for all 20 dashboard KPI endpoints.
 *
 * ## Interface → KPI Mapping
 * | Interface               | KPIs                              |
 * |-------------------------|-----------------------------------|
 * | GlobalSummary           | KPI 1                             |
 * | AssetStats              | KPI 2, 3, 5                       |
 * | SerializedUnitKpis      | KPI 4                             |
 * | InventoryKpis           | KPI 6, 7, 8                       |
 * | AssignmentKpis          | KPI 9, 10, 11, 12                 |
 * | LicenseStats            | KPI 13, 14, 15                    |
 * | UserStats               | KPI 16                            |
 * | AssetFinancialKpis      | KPI 17, 18, 19                    |
 * | AuditActivityKpis       | KPI 20                            |
 * | DashboardAlerts         | All critical alert counts          |
 *
 * ## Adding a New KPI
 * 1. Add its field(s) to the relevant interface below.
 * 2. If it's from a new endpoint, add a new service method at the bottom.
 * 3. Consume it in DashboardHome.tsx.
 */

import apiClient from './apiClient';

// ─────────────────────────────────────────────
// Shared filter shape — mirrors backend DashboardFilters
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

// ─────────────────────────────────────────────
// KPI 1 — Global Summary
// ─────────────────────────────────────────────
export interface GlobalSummary {
  totalAssets: number;
  totalLicenses: number;
  totalInventoryItems: number;
  totalUsers: number;
  totalAssetValue: number;
  activeAssignments: number;
}

// ─────────────────────────────────────────────
// KPI 2, 3, 5 — Asset Stats
// ─────────────────────────────────────────────
export interface AssetStats {
  byStatus: { status: string; count: string }[];
  byCategory: { category: string; count: string }[];
  // KPI 5 — Warranty tiers
  warrantyExpired: number;
  warrantyExpiring30: number;
  warrantyExpiring60: number;
  warrantyExpiring90: number;
  // KPI 2
  utilizationPercentage: number;
  recentlyAdded: number;
}

// ─────────────────────────────────────────────
// KPI 4 — Serialized Asset Unit Breakdown
// ─────────────────────────────────────────────
export interface SerializedUnitKpis {
  statusBreakdown: { status: string; count: string }[];
  inStock: number;
  assigned: number;
  inRepair: number;
  writtenOff: number;
  disposed: number;
  lost: number;
  total: number;
}

// ─────────────────────────────────────────────
// KPI 6, 7, 8 — Inventory KPIs
// ─────────────────────────────────────────────
export interface InventoryKpis {
  // KPI 6
  belowMinStock: number;
  outOfStock: number;
  // KPI 7
  allTimeSpend: number;
  thisMonthSpend: number;
  lastMonthSpend: number;
  // KPI 8
  turnoverThisMonth: number;
  turnoverLastMonth: number;
  // Legacy (backward compat)
  totalStockUnits: number;
  availableUnits: number;
  lowStockAlerts: number;
  distribution: { refundable: number; nonRefundable: number };
}

// ─────────────────────────────────────────────
// KPI 9, 10, 11, 12 — Assignment KPIs
// ─────────────────────────────────────────────
export interface AssignmentKpis {
  // KPI 9
  active: number;
  serializedActive: number;
  bulkActive: number;
  // KPI 10
  totalOverdue: number;
  overdueImplicit: number;
  // KPI 11
  returnRate: number;
  returnsIn30d: number;
  assignmentsIn30d: number;
  // KPI 12
  damagedReturns: number;
  damagedReturnRate: number;
}

// ─────────────────────────────────────────────
// KPI 13, 14, 15 — License Stats
// ─────────────────────────────────────────────
export interface LicenseStats {
  total: number;
  // KPI 13
  usedSeats: number;
  totalSeats: number;
  availableSeats: number;
  overAllocated: number;
  utilizationPct: number;
  // KPI 14
  expired: number;
  expiring30: number;
  expiring60: number;
  expiring90: number;
  // KPI 15
  annualizedSpend: number;
  spendByFrequency: { frequency: string; total: string }[];
  // Legacy aliases
  assigned: number;
  available: number;
  expiringSoon: number;
  compliancePercentage: number;
}

// ─────────────────────────────────────────────
// KPI 16 — User Stats
// ─────────────────────────────────────────────
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  usersWithAssets: number;
  assetsPerUser: number;
  mostAssignedDepartment: string;
}

// ─────────────────────────────────────────────
// KPI 17, 18, 19 — Asset Financial KPIs
// ─────────────────────────────────────────────
export interface AssetFinancialKpis {
  // KPI 17
  newThisMonth: number;
  newLastMonth: number;
  newByType: { type: string; count: string }[];
  // KPI 18
  totalBookValue: number;
  totalPurchaseCost: number;
  totalDepreciation: number;
  depreciationPct: number;
  // KPI 19
  monthlyRecurringCost: number;
  rentedAssetCount: number;
}

// ─────────────────────────────────────────────
// KPI 20 — Audit Activity KPIs
// ─────────────────────────────────────────────
export interface AuditActivityKpis {
  total24h: number;
  byAction: { action: string; count: string }[];
  hourlyBreakdown: { hour: string; count: string }[];
  recentEvents: {
    id: number;
    action: string;
    entityType: string;
    entityId: number;
    actorName: string;
    createdAt: string;
    metadata: Record<string, unknown>;
  }[];
  issueCount: number;
  returnCount: number;
  loginCount: number;
  createCount: number;
}

// ─────────────────────────────────────────────
// Aggregated Alerts
// ─────────────────────────────────────────────
export interface DashboardAlerts {
  warrantyExpired: number;
  warrantyExpiring30: number;
  warrantyExpiring60: number;
  lowStockItems: number;
  outOfStock: number;
  expiredLicenses: number;
  licensesExpiring30: number;
  overAllocatedLicenses: number;
  overdueReturns: number;
  damagedReturns: number;
  assetsUnassigned: number;
  totalCritical: number;
}

// ─────────────────────────────────────────────
// Recent Assignment Widgets
// ─────────────────────────────────────────────
export interface RecentAssetAssignment {
  id: number;
  assetName: string;
  assetTag: string;
  assignedTo: string;
  assignedDate: string;
  status: string;
}

export interface RecentLicenseAssignment {
  id: number;
  licenseName: string;
  assignedTo: string;
  expiryDate: string | null;
  status: 'active' | 'expiring_soon' | 'expired';
}

export interface RecentInventoryAssignment {
  id: number;
  itemName: string;
  assignedTo: string;
  quantity: number;
  assignedDate: string;
  status: string;
}

// ─────────────────────────────────────────────
// Dashboard Service — all API calls
// ─────────────────────────────────────────────
export const dashboardService = {

  /** KPI 1 — Total counts across all domains */
  async getGlobalSummary(filters?: DashboardFilters): Promise<GlobalSummary> {
    const r = await apiClient.get<GlobalSummary>('/api/dashboard/global-summary', { params: filters });
    return r.data;
  },

  /** KPI 2, 3, 5 — Asset utilization, status breakdown, warranty alerts */
  async getAssetStats(filters?: DashboardFilters): Promise<AssetStats> {
    const r = await apiClient.get<AssetStats>('/api/dashboard/assets', { params: filters });
    return r.data;
  },

  /** KPI 4 — Serialized asset unit lifecycle breakdown */
  async getSerializedUnitKpis(filters?: DashboardFilters): Promise<SerializedUnitKpis> {
    const r = await apiClient.get<SerializedUnitKpis>('/api/dashboard/serialized-units-kpi', { params: filters });
    return r.data;
  },

  /** KPI 6, 7, 8 — Inventory below-min, purchase spend, turnover */
  async getInventoryKpis(filters?: DashboardFilters): Promise<InventoryKpis> {
    const r = await apiClient.get<InventoryKpis>('/api/dashboard/inventory-kpi', { params: filters });
    return r.data;
  },

  /** KPI 9, 10, 11, 12 — Assignments active, overdue, return rate, damage */
  async getAssignmentKpis(filters?: DashboardFilters): Promise<AssignmentKpis> {
    const r = await apiClient.get<AssignmentKpis>('/api/dashboard/assignments-kpi', { params: filters });
    return r.data;
  },

  /** KPI 13, 14, 15 — License seat utilization, expiry tiers, annual spend */
  async getLicenseStats(filters?: DashboardFilters): Promise<LicenseStats> {
    const r = await apiClient.get<LicenseStats>('/api/dashboard/licenses', { params: filters });
    return r.data;
  },

  /** KPI 16 — Active users vs. assets ratio */
  async getUserStats(filters?: DashboardFilters): Promise<UserStats> {
    const r = await apiClient.get<UserStats>('/api/dashboard/users', { params: filters });
    return r.data;
  },

  /** KPI 17, 18, 19 — New registrations, book value, rented MRC */
  async getAssetFinancialKpis(filters?: DashboardFilters): Promise<AssetFinancialKpis> {
    const r = await apiClient.get<AssetFinancialKpis>('/api/dashboard/asset-financial-kpi', { params: filters });
    return r.data;
  },

  /** KPI 20 — System activity last 24 hours */
  async getAuditActivityKpis(): Promise<AuditActivityKpis> {
    const r = await apiClient.get<AuditActivityKpis>('/api/dashboard/audit-activity-kpi');
    return r.data;
  },

  /** Aggregated critical alert counts for header badge */
  async getAlerts(filters?: DashboardFilters): Promise<DashboardAlerts> {
    const r = await apiClient.get<DashboardAlerts>('/api/dashboard/alerts', { params: filters });
    return r.data;
  },

  /** Stock movement bar chart data */
  async getStockMovement(filters?: DashboardFilters): Promise<{ thisMonth: { reason: string; count: string }[]; lastMonth: { reason: string; count: string }[] }> {
    const r = await apiClient.get('/api/dashboard/stock-movement', { params: filters });
    return r.data;
  },

  /** Per-software license utilization table */
  async getLicenseUtilization(filters?: DashboardFilters): Promise<{
    license_softwareName: string;
    license_totalSeats: number;
    license_usedSeats: number;
    license_expiryDate: string;
    license_totalCost: string;
  }[]> {
    const r = await apiClient.get('/api/dashboard/license-utilization', { params: filters });
    return r.data;
  },

  /** Recent activity feed */
  async getRecentActivity(filters?: DashboardFilters): Promise<unknown[]> {
    const r = await apiClient.get('/api/dashboard/recent-activity', { params: filters });
    return r.data;
  },

  /** KPI card — last 10 asset assignments */
  async getRecentAssetAssignments(limit = 10): Promise<RecentAssetAssignment[]> {
    const r = await apiClient.get<RecentAssetAssignment[]>('/api/dashboard-widgets/recent-assets', { params: { limit } });
    return r.data;
  },

  /** KPI card — last 10 license assignments */
  async getRecentLicenseAssignments(limit = 10): Promise<RecentLicenseAssignment[]> {
    const r = await apiClient.get<RecentLicenseAssignment[]>('/api/dashboard-widgets/recent-licenses', { params: { limit } });
    return r.data;
  },

  /** KPI card — last 10 inventory assignments */
  async getRecentInventoryAssignments(limit = 10): Promise<RecentInventoryAssignment[]> {
    const r = await apiClient.get<RecentInventoryAssignment[]>('/api/dashboard-widgets/recent-inventory', { params: { limit } });
    return r.data;
  },
};
