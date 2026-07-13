/**
 * @file DashboardHome.tsx
 * @description Main dashboard page — displays all 20 KPIs.
 *
 * ## Layout Structure
 * ┌──────────────────────────────────────────────────┐
 * │  HEADER — Title + Last Updated + Refresh button  │
 * ├──────────────────────────────────────────────────┤
 * │  ALERT STRIP — Critical counts (warranty, stock, │
 * │  licenses expired, overdue assignments)          │
 * ├──────────────────────────────────────────────────┤
 * │  SECTION 1: Headline KPIs (P0 — 6 cards)        │
 * │  KPI 1 · KPI 2 · KPI 9 · KPI 10 · KPI 13 · 6   │
 * ├────────────────────┬─────────────────────────────┤
 * │  SECTION 2: Asset  │  SECTION 2: Warranty Alerts │
 * │  Status Donut      │  + Serialized Unit Bar      │
 * │  (KPI 3)           │  (KPI 4, 5)                 │
 * ├────────────────────┴─────────────────────────────┤
 * │  SECTION 3: Financial Snapshot (3 cards)         │
 * │  KPI 18 · KPI 15 · KPI 19                       │
 * ├────────────────────┬─────────────────────────────┤
 * │  SECTION 4:        │  SECTION 4:                 │
 * │  License Util Table│  License Expiry Badges      │
 * │  (KPI 13 detail)   │  (KPI 14) + User Stats      │
 * │                    │  (KPI 16) + New Assets (17) │
 * ├────────────────────┴─────────────────────────────┤
 * │  SECTION 5: Inventory Row                        │
 * │  KPI 6 · KPI 7 · KPI 8 (turnover bar)           │
 * ├────────────────────┬─────────────────────────────┤
 * │  SECTION 6:        │  SECTION 6:                 │
 * │  Stock Movement    │  System Activity Feed       │
 * │  Bar Chart         │  KPI 20 (24h)               │
 * └────────────────────┴─────────────────────────────┘
 *
 * ## Adding a New KPI to the UI
 * 1. Ensure the API call is in dashboardService.ts.
 * 2. Add it to the loadDashboard() Promise.all block.
 * 3. Destructure the new data into the `data` state.
 * 4. Render the metric in the appropriate section below.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Chart from 'react-apexcharts';
import {
  RefreshCw, Server, Key, Layers, AlertTriangle,
  TrendingUp, TrendingDown, Clock, Shield, DollarSign,
  RotateCcw, CheckCircle2, XCircle, Boxes,
  BarChart2, Tag, Info, Package, ArrowRight,
} from 'lucide-react';
import {
  dashboardService,
  GlobalSummary, AssetStats, LicenseStats, UserStats,
  DashboardAlerts, SerializedUnitKpis, InventoryKpis,
  AssignmentKpis, AssetFinancialKpis, AuditActivityKpis,
  RecentAssetAssignment, RecentLicenseAssignment, RecentInventoryAssignment,
} from '../../services/dashboardService';
import { useToast } from '../../context/ToastContext';
import { CHART_COLORS } from '../../lib/chartColors';
import { useCurrency } from '../../context/CurrencyContext';
import { PageHeader } from '../../components/shared/PageHeader';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../../components/ui/tooltip';

// ─────────────────────────────────────────────
// KPI DESCRIPTIONS
// One sentence per KPI explaining exactly what it measures / how it's
// calculated. Keep these in sync with the formulas in
// backend/src/modules/analytics/analytics.service.ts.
// ─────────────────────────────────────────────
const KPI_DESCRIPTIONS = {
  totalAssets: 'Total number of hardware assets currently tracked in the system.',
  utilization: 'Deployed assets ÷ usable inventory (excludes disposed, retired, lost and stolen assets) × 100.',
  activeAssignments: 'Assets and inventory currently checked out to users (status = active).',
  overdue: 'Active assignments that are explicitly marked overdue, or past their due date but not yet flagged.',
  licenseSeats: 'Seats currently in use ÷ total purchased seats × 100, across all software licenses.',
  lowStock: 'Consumable items whose available stock has fallen below their configured minimum stock level.',
  assetDistribution: 'Breakdown of every tracked asset by its current lifecycle status.',
  serializedUnits: 'Individually-tracked (serialized) inventory units grouped by lifecycle status: in stock, assigned, in repair/maintenance, written-off, lost.',
  warrantyStatus: 'Assets grouped by how soon their hardware warranty expires: already expired, or expiring within 30 / 60 / 90 days.',
  bookValue: 'Current depreciated value of all assets vs. their original total purchase cost.',
  annualLicenseSpend: 'Total yearly license cost — monthly billing ×12, quarterly ×4, and yearly/one-time billing counted as-is, then summed.',
  mrc: 'Total monthly rent for assets acquired under a rental/lease agreement (acquisition type = rented).',
  licenseUtilTable: 'Top licenses by seats used, showing seats used vs. total seats purchased for each.',
  licenseExpiry: 'Licenses grouped by how soon they expire: already expired, or expiring within 30 / 60 / 90 days.',
  workforce: 'Active user count, how many have at least one asset assigned, and the average assets per user.',
  newAssets: 'Number of new asset records created since the start of the current calendar month.',
  returnRate: 'Return transactions in the last 30 days ÷ assignments created in the last 30 days × 100 (capped at 100%).',
  damagedReturns: 'Percentage of returns in the last 30 days recorded with Poor or Damaged condition.',
  stockHealth: 'Consumable stock levels across all locations: total, available, below minimum, and fully out of stock.',
  inventorySpend: 'Total amount spent on consumable inventory purchases — this calendar month, last month, and all-time.',
  inventoryTurnover: 'Consumable stock units issued (OUT transactions) this calendar month vs. last month.',
  stockMovement: 'Stock ledger movements (procurement, issue, return, adjustment) this period vs. last period.',
  systemActivity: 'Count of system events (issues, returns, logins, creates, updates, etc.) in the last 24 hours.',
};

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help shrink-0" />
    </TooltipTrigger>
    <TooltipContent className="max-w-[240px] text-xs leading-relaxed">{text}</TooltipContent>
  </Tooltip>
);

// ─────────────────────────────────────────────
// UTILITY HELPERS
// ─────────────────────────────────────────────

const num = (v: number | string | null | undefined): number => Number(v ?? 0);
const pct = (a: number, b: number): number => (b > 0 ? Math.round((a / b) * 100) : 0);

const timeAgo = (dateStr: string): string => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const actionColor: Record<string, string> = {
  issue: 'text-blue-600 bg-blue-50',
  return: 'text-green-600 bg-green-50',
  login: 'text-muted-foreground bg-muted',
  create: 'text-purple-600 bg-purple-50',
  update: 'text-amber-600 bg-amber-50',
  delete: 'text-red-600 bg-red-50',
  lost: 'text-red-600 bg-red-50',
  repair_start: 'text-orange-600 bg-orange-50',
  repair_end: 'text-teal-600 bg-teal-50',
  write_off: 'text-muted-foreground bg-muted',
  dispose: 'text-muted-foreground bg-muted',
  transfer: 'text-indigo-600 bg-indigo-50',
};

// ─────────────────────────────────────────────
// REUSABLE UI PRIMITIVES
// To modify the card appearance globally, change StatCard below.
// ─────────────────────────────────────────────

interface StatCardProps {
  id?: string;
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  accent?: string;
  trend?: { value: number; label: string };
  alert?: boolean;
  onClick?: () => void;
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  id, icon, label, value, sub, accent = 'text-blue-600 bg-blue-50',
  trend, alert, onClick, description,
}) => (
  <div
    id={id}
    onClick={onClick}
    className={`bg-card border rounded-xl p-5 flex flex-col gap-3 transition-all
      ${alert ? 'border-red-200 shadow-red-50 shadow' : 'border'}
      ${onClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm' : ''}`}
  >
    <div className="flex items-center justify-between">
      <span className={`p-2 rounded-lg ${accent}`}>{icon}</span>
      {alert && (
        <span className="flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
      )}
    </div>
    <div>
      <p className="text-2xl font-bold text-foreground tabular-nums leading-none">{value}</p>
      <div className="flex items-center gap-1 mt-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {description && <InfoTooltip text={description} />}
      </div>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
    {trend && (
      <div className={`flex items-center gap-1 text-xs font-semibold ${trend.value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
        {trend.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(trend.value)}% {trend.label}
      </div>
    )}
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode; note?: string; description?: string }> = ({ children, note, description }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-1.5">
      <h2 className="text-sm font-semibold text-foreground">{children}</h2>
      {description && <InfoTooltip text={description} />}
    </div>
    {note && <span className="text-xs text-muted-foreground">{note}</span>}
  </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-card border rounded-xl p-6 ${className}`}>{children}</div>
);

// Status badge color map for the recent-assignment widget cards
const STATUS_BADGE_COLORS: Record<string, string> = {
  deployed: 'text-blue-700 bg-blue-50 border-blue-200',
  available: 'text-green-700 bg-green-50 border-green-200',
  active: 'text-green-700 bg-green-50 border-green-200',
  assigned: 'text-blue-700 bg-blue-50 border-blue-200',
  returned: 'text-slate-700 bg-slate-50 border-slate-200',
  closed: 'text-slate-700 bg-slate-50 border-slate-200',
  maintenance: 'text-amber-700 bg-amber-50 border-amber-200',
  repair: 'text-amber-700 bg-amber-50 border-amber-200',
  expiring_soon: 'text-amber-700 bg-amber-50 border-amber-200',
  expired: 'text-red-700 bg-red-50 border-red-200',
  lost: 'text-red-700 bg-red-50 border-red-200',
  stolen: 'text-red-700 bg-red-50 border-red-200',
  retired: 'text-slate-700 bg-slate-50 border-slate-200',
  disposed: 'text-slate-700 bg-slate-50 border-slate-200',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span
    className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border whitespace-nowrap
      ${STATUS_BADGE_COLORS[status?.toLowerCase()] || 'text-muted-foreground bg-muted border-border'}`}
  >
    {status?.replace(/_/g, ' ') || 'unknown'}
  </span>
);

const formatShortDate = (d: string | null): string =>
  d ? new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// A single row of a recent-assignment widget card
interface AssignmentRowData {
  primaryLabel: string;   // column header for the primary field, e.g. "Asset Name"
  primary: string;        // e.g. asset/license/item name
  secondaryLabel: string; // e.g. "Assigned To"
  secondary: string;
  metaLabel: string;      // e.g. "Assigned Date" / "Expiry Date"
  meta: string;
  quantity?: number;      // Inventory card only
  status?: string;        // omitted for the Inventory card
}

// Reusable widget card: header (icon + title), scrollable stacked-row list, "View All" footer link.
// Rows are laid out as two lines (name+status, then assigned-to · date) instead of a cramped
// multi-column table, so full names/dates stay readable instead of being ellipsis-truncated.
interface AssignmentWidgetCardProps {
  icon: React.ReactNode;
  accent: string;
  title: string;
  viewAllHref: string;
  rows: AssignmentRowData[];
  emptyLabel: string;
}

const AssignmentWidgetCard: React.FC<AssignmentWidgetCardProps> = ({
  icon, accent, title, viewAllHref, rows, emptyLabel,
}) => (
  <Card className="flex flex-col p-0 overflow-hidden">
    <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
      <span className={`p-2 rounded-lg ${accent}`}>{icon}</span>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    <div className="flex-1 overflow-y-auto max-h-80">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{emptyLabel}</p>
      ) : (
        <ul>
          {rows.map((row, i) => (
            <li key={i} className="px-5 py-3 border-b border-border last:border-0 hover:bg-accent/40">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-foreground text-sm break-words" title={row.primary}>{row.primary}</p>
                {row.status && <StatusBadge status={row.status} />}
              </div>
              <div className="flex items-end justify-between gap-3 mt-1.5">
                <span className="text-xs text-muted-foreground break-words" title={row.secondary}>
                  {row.secondaryLabel}: <span className="text-foreground">{row.secondary}</span>
                </span>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  {row.quantity !== undefined && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      Qty: <span className="text-foreground font-medium">{row.quantity}</span>
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {row.metaLabel}: <span className="text-foreground font-medium">{row.meta}</span>
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
    <Link
      to={viewAllHref}
      className="flex items-center justify-center gap-1 px-5 py-3 text-xs font-semibold text-blue-600 border-t border-border hover:bg-accent/40 transition-colors"
    >
      View All <ArrowRight className="w-3 h-3" />
    </Link>
  </Card>
);

// KPI 5 / KPI 14 — Alert tier chip
const AlertChip: React.FC<{ label: string; count: number; color: string }> = ({ label, count, color }) => (
  <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${color}`}>
    <span className="text-xs font-semibold">{label}</span>
    <span className="text-sm font-bold tabular-nums">{count}</span>
  </div>
);

// Progress bar row for license utilization
const LicenseRow: React.FC<{
  name: string;
  used: number;
  total: number;
}> = ({ name, used, total }) => {
  const utilPct = pct(used, total);
  const overUsed = used > total;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-foreground truncate max-w-[60%]">{name}</span>
        <span className={`font-semibold tabular-nums ${overUsed ? 'text-red-600' : 'text-foreground'}`}>
          {used}/{total} seats
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${overUsed ? 'bg-red-500' : utilPct > 80 ? 'bg-amber-500' : 'bg-blue-600'}`}
          style={{ width: `${Math.min(utilPct, 100)}%` }}
        />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// APEXCHARTS CONFIGURATIONS
// ─────────────────────────────────────────────

// Palette shared with the analytics dashboard — see lib/chartColors.ts

const buildDonutOptions = (labels: string[], total: number): ApexCharts.ApexOptions => ({
  chart: { type: 'donut', fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
  labels,
  colors: Object.values(CHART_COLORS),
  stroke: { show: false },
  dataLabels: { enabled: false },
  plotOptions: {
    pie: {
      donut: {
        size: '74%',
        labels: {
          show: true,
          total: {
            show: true, label: 'Total', fontSize: '12px',
            fontWeight: 700, color: '#6b7280',
            formatter: () => String(total),
          },
          value: { fontSize: '20px', fontWeight: 700, color: '#111827' },
        },
      },
    },
  },
  legend: { position: 'bottom', fontSize: '11px', fontWeight: '600', markers: { size: 6 } },
  tooltip: { theme: 'light' },
});

const buildGroupedBarOptions = (categories: string[], colors: string[]): ApexCharts.ApexOptions => ({
  chart: { type: 'bar', fontFamily: 'Inter, sans-serif', toolbar: { show: false }, stacked: false },
  colors,
  plotOptions: { bar: { columnWidth: '55%', borderRadius: 4, borderRadiusApplication: 'end' } },
  dataLabels: { enabled: false },
  xaxis: {
    categories,
    axisBorder: { show: false }, axisTicks: { show: false },
    labels: { style: { fontSize: '11px', fontWeight: '600', colors: '#9ca3af' } },
  },
  yaxis: { labels: { style: { fontSize: '11px', colors: '#9ca3af' } } },
  grid: { borderColor: '#f1f5f9', strokeDashArray: 3, xaxis: { lines: { show: false } } },
  legend: { show: true, position: 'top', horizontalAlign: 'right', fontSize: '11px', fontWeight: '600' },
  tooltip: { theme: 'light' },
});

const buildSparklineOptions = (color: string): ApexCharts.ApexOptions => ({
  chart: { type: 'area', sparkline: { enabled: true }, fontFamily: 'Inter, sans-serif' },
  stroke: { curve: 'smooth', width: 2 },
  fill: { type: 'gradient', gradient: { opacityFrom: 0.3, opacityTo: 0 } },
  colors: [color],
  tooltip: { theme: 'light', x: { show: false } },
});

// ─────────────────────────────────────────────
// MAIN DASHBOARD STATE SHAPE
// ─────────────────────────────────────────────

interface DashboardData {
  global: GlobalSummary | null;
  assets: AssetStats | null;
  serializedUnits: SerializedUnitKpis | null;
  inventoryKpis: InventoryKpis | null;
  assignmentKpis: AssignmentKpis | null;
  licenseStats: LicenseStats | null;
  userStats: UserStats | null;
  financialKpis: AssetFinancialKpis | null;
  auditActivity: AuditActivityKpis | null;
  alerts: DashboardAlerts | null;
  licenseUtil: { license_softwareName: string; license_totalSeats: number; license_usedSeats: number }[];
  stockMovement: { thisMonth: { reason: string; count: string }[]; lastMonth: { reason: string; count: string }[] };
  recentAssets: RecentAssetAssignment[];
  recentLicenses: RecentLicenseAssignment[];
  recentInventory: RecentInventoryAssignment[];
}

const EMPTY_DATA: DashboardData = {
  global: null, assets: null, serializedUnits: null,
  inventoryKpis: null, assignmentKpis: null, licenseStats: null,
  userStats: null, financialKpis: null, auditActivity: null,
  alerts: null, licenseUtil: [],
  stockMovement: { thisMonth: [], lastMonth: [] },
  recentAssets: [], recentLicenses: [], recentInventory: [],
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

const DashboardHome: React.FC = () => {
  const { showToast } = useToast();
  const { currencySymbol } = useCurrency();
  const currency = (v: number): string =>
    `${currencySymbol}${Math.round(v).toLocaleString()}`;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);

  // ─── Data fetching ───
  // All 12 API calls are made in parallel using Promise.allSettled
  // so a failure in one KPI group doesn't block the others.
  const loadDashboard = useCallback(async () => {
    setRefreshing(true);
    try {
      const f = {};
      const [
        globalRes, assetsRes, serializedRes, invKpiRes,
        assignRes, licenseRes, userRes, financialRes,
        auditRes, alertsRes, licenseUtilRes, stockMovRes,
        recentAssetsRes, recentLicensesRes, recentInventoryRes,
      ] = await Promise.allSettled([
        dashboardService.getGlobalSummary(f),         // KPI 1
        dashboardService.getAssetStats(f),             // KPI 2, 3, 5
        dashboardService.getSerializedUnitKpis(f),     // KPI 4
        dashboardService.getInventoryKpis(f),          // KPI 6, 7, 8
        dashboardService.getAssignmentKpis(f),         // KPI 9, 10, 11, 12
        dashboardService.getLicenseStats(f),           // KPI 13, 14, 15
        dashboardService.getUserStats(f),              // KPI 16
        dashboardService.getAssetFinancialKpis(f),     // KPI 17, 18, 19
        dashboardService.getAuditActivityKpis(),       // KPI 20
        dashboardService.getAlerts(f),                 // Alert strip
        dashboardService.getLicenseUtilization(f),     // KPI 13 detail
        dashboardService.getStockMovement(f),          // Stock bar chart
        dashboardService.getRecentAssetAssignments(10),     // Recent asset assignments card
        dashboardService.getRecentLicenseAssignments(10),   // Recent license assignments card
        dashboardService.getRecentInventoryAssignments(10), // Recent inventory assignments card
      ]);

      const safe = <T,>(r: PromiseSettledResult<T>): T | null =>
        r.status === 'fulfilled' ? r.value : null;

      setData({
        global: safe(globalRes),
        assets: safe(assetsRes),
        serializedUnits: safe(serializedRes),
        inventoryKpis: safe(invKpiRes),
        assignmentKpis: safe(assignRes),
        licenseStats: safe(licenseRes),
        userStats: safe(userRes),
        financialKpis: safe(financialRes),
        auditActivity: safe(auditRes),
        alerts: safe(alertsRes),
        licenseUtil: (safe(licenseUtilRes) as DashboardData['licenseUtil']) ?? [],
        stockMovement: (safe(stockMovRes) as DashboardData['stockMovement']) ?? { thisMonth: [], lastMonth: [] },
        recentAssets: safe(recentAssetsRes) ?? [],
        recentLicenses: safe(recentLicensesRes) ?? [],
        recentInventory: safe(recentInventoryRes) ?? [],
      });

      setLastUpdated(new Date());
    } catch {
      showToast('Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // ─── Derived values ───
  const g = data.global;
  const assets = data.assets;
  const inv = data.inventoryKpis;
  const asgn = data.assignmentKpis;
  const lic = data.licenseStats;
  const fin = data.financialKpis;
  const audit = data.auditActivity;
  const su = data.serializedUnits;
  const alerts = data.alerts;
  const us = data.userStats;
  const sm = data.stockMovement;

  const totalAssets = num(g?.totalAssets);
  const byStatus = (s: string) =>
    parseInt((assets?.byStatus || []).find(x => x.status.toLowerCase() === s)?.count || '0');

  const deployed = byStatus('deployed');
  const available = byStatus('available');
  const maintenance = byStatus('maintenance');

  // ─── Chart: Asset Status Donut ───
  const donutSeries = (assets?.byStatus || []).map(s => parseInt(s.count));
  const donutLabels = (assets?.byStatus || []).map(s =>
    s.status.charAt(0).toUpperCase() + s.status.slice(1).replace('_', ' '),
  );

  // ─── Chart: Serialized Units Bar (KPI 4) ───
  const unitLabels = ['In Stock', 'Assigned', 'In Repair', 'Written-Off', 'Lost'];
  const unitValues = [
    num(su?.inStock), num(su?.assigned), num(su?.inRepair), num(su?.writtenOff), num(su?.lost),
  ];

  // ─── Chart: Stock Movement Bar ───
  const movKeys = ['procurement', 'issue', 'return', 'adjustment'];
  const movLabels = ['Procure', 'Issue', 'Return', 'Adjust'];
  const getMovVal = (arr: { reason: string; count: string }[], key: string) =>
    parseInt(arr.find(m => m.reason === key)?.count || '0');

  // ─── Chart: Hourly Activity Sparkline (KPI 20) ───
  const hourlyData = Array.from({ length: 24 }, (_, h) => {
    const entry = (audit?.hourlyBreakdown || []).find(r => parseInt(r.hour) === h);
    return parseInt(entry?.count || '0');
  });

  // ─── Loading skeleton ───
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <RefreshCw className="w-7 h-7 animate-spin" />
          <span className="text-sm font-medium">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  const totalCritical = num(alerts?.totalCritical);

  return (
    <TooltipProvider delayDuration={200}>
    <div className={`space-y-6 transition-opacity duration-300 ${refreshing ? 'opacity-60' : 'opacity-100'}`}>

        {/* ════════════════════════════════════
            HEADER
        ════════════════════════════════════ */}
        <PageHeader
          title="Dashboard"
          description={
            lastUpdated
              ? `Last updated at ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'IT Asset Management Overview'
          }
        >
          <button
            id="dashboard-refresh-btn"
            onClick={() => loadDashboard()}
            disabled={refreshing}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-card border rounded-lg px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-primary' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </PageHeader>

        {/* ════════════════════════════════════
            CRITICAL ALERT STRIP
            Shows only when there are critical issues.
        ════════════════════════════════════ */}
        {totalCritical > 0 && (
          <div className="flex flex-wrap gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2 mr-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-semibold text-red-700">
                {totalCritical} Critical Alert{totalCritical !== 1 ? 's' : ''}
              </span>
            </div>
            {num(alerts?.warrantyExpired) > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                🔴 {alerts?.warrantyExpired} Warranty Expired
              </span>
            )}
            {num(alerts?.outOfStock) > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                📦 {alerts?.outOfStock} Out of Stock
              </span>
            )}
            {num(alerts?.expiredLicenses) > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                🔑 {alerts?.expiredLicenses} License Expired
              </span>
            )}
            {num(alerts?.overdueReturns) > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                ⏰ {alerts?.overdueReturns} Overdue Assignment{(num(alerts?.overdueReturns)) !== 1 ? 's' : ''}
              </span>
            )}
            {num(alerts?.overAllocatedLicenses) > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                ⚠️ {alerts?.overAllocatedLicenses} Over-Allocated License{(num(alerts?.overAllocatedLicenses)) !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* ════════════════════════════════════
            SECTION 1 — P0 Headline KPIs
            KPI 1, 2, 9, 10, 13, 6
        ════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">

          {/* KPI 1 — Total Hardware Assets */}
          <StatCard
            id="kpi-total-assets"
            icon={<Server className="w-4 h-4" />}
            label="Total Assets"
            value={totalAssets.toLocaleString()}
            sub={`${deployed} deployed`}
            accent="text-blue-600 bg-blue-50"
            description={KPI_DESCRIPTIONS.totalAssets}
          />

          {/* KPI 2 — Asset Utilization Rate */}
          <StatCard
            id="kpi-utilization"
            icon={<BarChart2 className="w-4 h-4" />}
            label="Utilization"
            value={`${num(assets?.utilizationPercentage)}%`}
            sub={`${deployed} deployed / ${totalAssets} total`}
            accent="text-green-600 bg-green-50"
            description={KPI_DESCRIPTIONS.utilization}
          />

          {/* KPI 9 — Active Assignments */}
          <StatCard
            id="kpi-active-assignments"
            icon={<Tag className="w-4 h-4" />}
            label="Active Assignments"
            value={num(asgn?.active).toLocaleString()}
            sub={`${num(asgn?.serializedActive)} serialized`}
            accent="text-purple-600 bg-purple-50"
            description={KPI_DESCRIPTIONS.activeAssignments}
          />

          {/* KPI 10 — Overdue Assignments */}
          <StatCard
            id="kpi-overdue"
            icon={<Clock className="w-4 h-4" />}
            label="Overdue"
            value={num(asgn?.totalOverdue)}
            sub={`${num(asgn?.overdueImplicit)} past due date`}
            accent="text-red-600 bg-red-50"
            alert={num(asgn?.totalOverdue) > 0}
            description={KPI_DESCRIPTIONS.overdue}
          />

          {/* KPI 13 — License Seat Utilization % */}
          <StatCard
            id="kpi-license-seats"
            icon={<Key className="w-4 h-4" />}
            label="License Seats"
            value={`${num(lic?.utilizationPct)}%`}
            sub={`${num(lic?.usedSeats)}/${num(lic?.totalSeats)} used`}
            accent={num(lic?.overAllocated) > 0 ? 'text-red-600 bg-red-50' : 'text-sky-600 bg-sky-50'}
            alert={num(lic?.overAllocated) > 0}
            description={KPI_DESCRIPTIONS.licenseSeats}
          />

          {/* KPI 6 — Items Below Min Stock */}
          <StatCard
            id="kpi-low-stock"
            icon={<Layers className="w-4 h-4" />}
            label="Low Stock Items"
            value={num(inv?.belowMinStock)}
            sub={`${num(inv?.outOfStock)} fully out`}
            accent={num(inv?.belowMinStock) > 0 ? 'text-orange-600 bg-orange-50' : 'text-emerald-600 bg-emerald-50'}
            alert={num(inv?.outOfStock) > 0}
            description={KPI_DESCRIPTIONS.lowStock}
          />
        </div>

        {/* ════════════════════════════════════
            SECTION 2 — Asset Intelligence
            KPI 3 (donut), KPI 4 (bar), KPI 5 (warranty tiers)
        ════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* KPI 3 — Asset Status Donut */}
          <Card className="lg:col-span-2">
            <SectionTitle note={`${totalAssets} total`} description={KPI_DESCRIPTIONS.assetDistribution}>Asset Distribution</SectionTitle>
            {donutSeries.length > 0 && donutSeries.some(v => v > 0)
              ? <Chart options={buildDonutOptions(donutLabels, totalAssets)} series={donutSeries} type="donut" height={260} />
              : <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">No asset data</div>
            }
          </Card>

          {/* KPI 4 + KPI 5 — Right column */}
          <div className="lg:col-span-3 flex flex-col gap-6">

            {/* KPI 4 — Serialized Units breakdown */}
            <Card>
              <SectionTitle note={`${num(su?.total)} total units`} description={KPI_DESCRIPTIONS.serializedUnits}>Serialized Asset Units</SectionTitle>
              <Chart
                options={buildGroupedBarOptions(unitLabels, [CHART_COLORS.blue, CHART_COLORS.green, CHART_COLORS.amber, CHART_COLORS.slate, CHART_COLORS.red])}
                series={[{ name: 'Units', data: unitValues }]}
                type="bar"
                height={150}
              />
            </Card>

            {/* KPI 5 — Warranty Expiry Tiers */}
            <Card>
              <SectionTitle description={KPI_DESCRIPTIONS.warrantyStatus}>Warranty Status</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                <AlertChip label="🔴 Expired" count={num(assets?.warrantyExpired)} color="bg-red-50 text-red-700" />
                <AlertChip label="🟠 ≤ 30 Days" count={num(assets?.warrantyExpiring30)} color="bg-orange-50 text-orange-700" />
                <AlertChip label="🟡 ≤ 60 Days" count={num(assets?.warrantyExpiring60)} color="bg-amber-50 text-amber-700" />
                <AlertChip label="🟢 ≤ 90 Days" count={num(assets?.warrantyExpiring90)} color="bg-yellow-50 text-yellow-700" />
              </div>
            </Card>
          </div>
        </div>

        {/* ════════════════════════════════════
            SECTION 3 — Financial Snapshot
            KPI 18 (book value), KPI 15 (license spend), KPI 19 (MRC)
        ════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* KPI 18 — Asset Book Value */}
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <div className="p-2 rounded-lg text-indigo-600 bg-indigo-50">
                <DollarSign className="w-4 h-4" />
              </div>
              Total Asset Book Value
              <InfoTooltip text={KPI_DESCRIPTIONS.bookValue} />
            </div>
            <p className="text-3xl font-bold text-foreground tabular-nums">
              {currency(num(fin?.totalBookValue))}
            </p>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Purchase cost: {currency(num(fin?.totalPurchaseCost))}</span>
              <span className="text-red-500 font-medium">
                -{num(fin?.depreciationPct)}% depreciated
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                style={{ width: `${100 - num(fin?.depreciationPct)}%` }}
              />
            </div>
          </Card>

          {/* KPI 15 — Annual License Spend */}
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <div className="p-2 rounded-lg text-sky-600 bg-sky-50">
                <Key className="w-4 h-4" />
              </div>
              Annual License Spend
              <InfoTooltip text={KPI_DESCRIPTIONS.annualLicenseSpend} />
            </div>
            <p className="text-3xl font-bold text-foreground tabular-nums">
              {currency(num(lic?.annualizedSpend))}
            </p>
            <div className="space-y-1 mt-1">
              {(lic?.spendByFrequency || []).map(s => (
                <div key={s.frequency} className="flex justify-between text-xs text-muted-foreground">
                  <span className="capitalize">{s.frequency.replace('_', ' ')}</span>
                  <span className="font-medium text-foreground">{currency(parseFloat(s.total))}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* KPI 19 — Rented Asset MRC */}
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <div className="p-2 rounded-lg text-amber-600 bg-amber-50">
                <RotateCcw className="w-4 h-4" />
              </div>
              Monthly Recurring Cost
              <InfoTooltip text={KPI_DESCRIPTIONS.mrc} />
            </div>
            <p className="text-3xl font-bold text-foreground tabular-nums">
              {currency(num(fin?.monthlyRecurringCost))}
            </p>
            <p className="text-xs text-muted-foreground">
              From {num(fin?.rentedAssetCount)} rented asset{num(fin?.rentedAssetCount) !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              Annualized: {currency(num(fin?.monthlyRecurringCost) * 12)}
            </p>
          </Card>
        </div>

        {/* ════════════════════════════════════
            SECTION 4 — License & User Intelligence
            KPI 13 detail, KPI 14, KPI 16, KPI 17
        ════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* KPI 13 — Per-software license utilization */}
          <Card className="lg:col-span-3">
            <SectionTitle note={`${num(lic?.total)} licenses total`} description={KPI_DESCRIPTIONS.licenseUtilTable}>
              License Seat Utilization
            </SectionTitle>
            <div className="space-y-3">
              {data.licenseUtil.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No license data</p>
              )}
              {data.licenseUtil.map((l) => (
                <LicenseRow
                  key={l.license_softwareName}
                  name={l.license_softwareName}
                  used={num(l.license_usedSeats)}
                  total={num(l.license_totalSeats)}
                />
              ))}
            </div>
          </Card>

          {/* KPI 14, KPI 16, KPI 17 — Right column */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* KPI 14 — License Expiry Tiers */}
            <Card>
              <SectionTitle description={KPI_DESCRIPTIONS.licenseExpiry}>License Expiry Alerts</SectionTitle>
              <div className="space-y-2">
                <AlertChip label="🔴 Expired" count={num(lic?.expired)} color="bg-red-50 text-red-700" />
                <AlertChip label="🟠 Expiring ≤ 30 Days" count={num(lic?.expiring30)} color="bg-orange-50 text-orange-700" />
                <AlertChip label="🟡 Expiring ≤ 60 Days" count={num(lic?.expiring60)} color="bg-amber-50 text-amber-700" />
                <AlertChip label="🟢 Expiring ≤ 90 Days" count={num(lic?.expiring90)} color="bg-yellow-50 text-yellow-700" />
              </div>
            </Card>

            {/* KPI 16 — Users vs. Assets Ratio */}
            <Card>
              <SectionTitle description={KPI_DESCRIPTIONS.workforce}>Workforce Metrics</SectionTitle>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Users</span>
                  <span className="font-bold text-foreground">{num(us?.activeUsers).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Users with Assets</span>
                  <span className="font-bold text-foreground">{num(us?.usersWithAssets).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Assets/User</span>
                  <span className="font-bold text-blue-600">{num(us?.assetsPerUser)}</span>
                </div>
                {/* KPI 17 — New Registrations This Month */}
                <div className="pt-2 border-t border-border flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    New Assets This Month
                    <InfoTooltip text={KPI_DESCRIPTIONS.newAssets} />
                  </span>
                  <span className={`font-bold ${num(fin?.newThisMonth) > num(fin?.newLastMonth) ? 'text-green-600' : 'text-foreground'}`}>
                    {num(fin?.newThisMonth)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* ════════════════════════════════════
            SECTION 5 — Assignment Health
            KPI 9, 10, 11, 12
        ════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

          {/* KPI 9 — Active Assignments (with type split) */}
          <Card className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-muted-foreground">Active Assignments</span>
              <InfoTooltip text={KPI_DESCRIPTIONS.activeAssignments} />
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{num(asgn?.active).toLocaleString()}</p>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>📌 {num(asgn?.serializedActive)} serialized</span>
              <span>📦 {num(asgn?.bulkActive)} bulk</span>
            </div>
          </Card>

          {/* KPI 10 — Overdue */}
          <Card className={`flex flex-col gap-2 ${num(asgn?.totalOverdue) > 0 ? 'border-red-200' : ''}`}>
            <div className="flex items-center gap-2">
              <XCircle className={`w-4 h-4 ${num(asgn?.totalOverdue) > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
              <span className="text-xs font-semibold text-muted-foreground">Overdue</span>
              <InfoTooltip text={KPI_DESCRIPTIONS.overdue} />
            </div>
            <p className={`text-2xl font-bold tabular-nums ${num(asgn?.totalOverdue) > 0 ? 'text-red-600' : 'text-foreground'}`}>
              {num(asgn?.totalOverdue)}
            </p>
            <p className="text-xs text-muted-foreground">{num(asgn?.overdueImplicit)} past due date</p>
          </Card>

          {/* KPI 11 — Return Rate */}
          <Card className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-muted-foreground">Return Rate (30d)</span>
              <InfoTooltip text={KPI_DESCRIPTIONS.returnRate} />
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{num(asgn?.returnRate)}%</p>
            <p className="text-xs text-muted-foreground">{num(asgn?.returnsIn30d)} of {num(asgn?.assignmentsIn30d)}</p>
          </Card>

          {/* KPI 12 — Damaged Returns */}
          <Card className={`flex flex-col gap-2 ${num(asgn?.damagedReturnRate) > 5 ? 'border-orange-200' : ''}`}>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-semibold text-muted-foreground">Returned Damaged</span>
              <InfoTooltip text={KPI_DESCRIPTIONS.damagedReturns} />
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{num(asgn?.damagedReturns)}</p>
            <p className="text-xs text-muted-foreground">{num(asgn?.damagedReturnRate)}% of returns</p>
          </Card>
        </div>

        {/* ════════════════════════════════════
            SECTION 6 — Inventory KPIs
            KPI 6, 7, 8
        ════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* KPI 6 — Stock Health */}
          <Card>
            <SectionTitle description={KPI_DESCRIPTIONS.stockHealth}>Consumable Stock Health</SectionTitle>
            <div className="space-y-3">
              {[
                { label: 'Total Stock Units', value: num(inv?.totalStockUnits), color: 'bg-blue-600', pctVal: 100 },
                { label: 'Available', value: num(inv?.availableUnits), color: 'bg-green-600', pctVal: pct(num(inv?.availableUnits), num(inv?.totalStockUnits)) },
                { label: 'Below Min Stock', value: num(inv?.belowMinStock), color: 'bg-amber-500', pctVal: pct(num(inv?.belowMinStock), num(inv?.totalStockUnits)) },
                { label: 'Out of Stock', value: num(inv?.outOfStock), color: 'bg-red-600', pctVal: pct(num(inv?.outOfStock), num(inv?.totalStockUnits)) },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-bold text-foreground tabular-nums">{item.value.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${item.color}`} style={{ width: `${item.pctVal}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* KPI 7 — Inventory Spend */}
          <Card className="flex flex-col gap-3">
            <SectionTitle description={KPI_DESCRIPTIONS.inventorySpend}>Inventory Spend</SectionTitle>
            <div>
              <p className="text-xs text-muted-foreground mb-1">This Month</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">{currency(num(inv?.thisMonthSpend))}</p>
              <div className="flex items-center gap-1 mt-1 text-xs">
                {num(inv?.thisMonthSpend) >= num(inv?.lastMonthSpend)
                  ? <TrendingUp className="w-3 h-3 text-green-600" />
                  : <TrendingDown className="w-3 h-3 text-red-500" />
                }
                <span className="text-muted-foreground">Last month: {currency(num(inv?.lastMonthSpend))}</span>
              </div>
            </div>
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">All-Time Total</p>
              <p className="text-xl font-bold text-foreground tabular-nums">{currency(num(inv?.allTimeSpend))}</p>
            </div>
          </Card>

          {/* KPI 8 — Inventory Turnover */}
          <Card className="flex flex-col gap-3">
            <SectionTitle description={KPI_DESCRIPTIONS.inventoryTurnover}>Inventory Turnover</SectionTitle>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Units Issued This Month</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {num(inv?.turnoverThisMonth).toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs">
                {num(inv?.turnoverThisMonth) >= num(inv?.turnoverLastMonth)
                  ? <TrendingUp className="w-3 h-3 text-green-600" />
                  : <TrendingDown className="w-3 h-3 text-red-500" />
                }
                <span className="text-muted-foreground">Last month: {num(inv?.turnoverLastMonth).toLocaleString()} units</span>
              </div>
            </div>
            <div className="pt-3 border-t border-border flex gap-2 text-xs text-muted-foreground">
              <Boxes className="w-3.5 h-3.5 mt-0.5" />
              <span>Refundable: {num(inv?.distribution?.refundable)} · Non-refundable: {num(inv?.distribution?.nonRefundable)}</span>
            </div>
          </Card>
        </div>

        {/* ════════════════════════════════════
            SECTION 7 — Stock Movement + Activity
            Stock movement bar, KPI 20
        ════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Stock Movement Bar Chart */}
          <Card className="lg:col-span-3">
            <SectionTitle note="this vs last period" description={KPI_DESCRIPTIONS.stockMovement}>Stock Movement</SectionTitle>
            <Chart
              options={buildGroupedBarOptions(movLabels, ['#e2e8f0', CHART_COLORS.blue])}
              series={[
                { name: 'Last Period', data: movKeys.map(r => getMovVal(sm.lastMonth, r)) },
                { name: 'This Period', data: movKeys.map(r => getMovVal(sm.thisMonth, r)) },
              ]}
              type="bar"
              height={220}
            />
          </Card>

          {/* KPI 20 — System Activity Feed */}
          <Card className="lg:col-span-2 flex flex-col">
            <SectionTitle note="last 24 hours" description={KPI_DESCRIPTIONS.systemActivity}>System Activity</SectionTitle>

            {/* Activity summary row */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'Total', value: num(audit?.total24h), color: 'text-foreground' },
                { label: 'Issues', value: num(audit?.issueCount), color: 'text-blue-600' },
                { label: 'Returns', value: num(audit?.returnCount), color: 'text-green-600' },
                { label: 'Logins', value: num(audit?.loginCount), color: 'text-purple-600' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Hourly sparkline */}
            <Chart
              options={buildSparklineOptions(CHART_COLORS.blue)}
              series={[{ name: 'Events', data: hourlyData }]}
              type="area"
              height={60}
            />

            {/* Recent event feed */}
            <div className="mt-3 flex-1 overflow-y-auto space-y-2 max-h-48">
              {(audit?.recentEvents || []).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
              )}
              {(audit?.recentEvents || []).map(e => (
                <div key={e.id} className="flex items-start gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${actionColor[e.action] || 'text-muted-foreground bg-muted'}`}>
                    {e.action.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">
                      <span className="font-medium">{e.actorName}</span> · {e.entityType}
                      {e.entityId ? ` #${e.entityId}` : ''}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{timeAgo(e.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ════════════════════════════════════
            SECTION 8 — Recent Assignments
            Last 10 asset / license / inventory assignments
        ════════════════════════════════════ */}
        <div>
          <SectionTitle>Recent Assignments</SectionTitle>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Asset Card */}
            <AssignmentWidgetCard
              icon={<Server className="w-4 h-4" />}
              accent="text-blue-600 bg-blue-50"
              title="Recent Asset Assignments"
              viewAllHref="/dashboard/assets"
              emptyLabel="No recent asset assignments"
              rows={data.recentAssets.map((r) => ({
                primaryLabel: 'Asset Name',
                primary: r.assetName,
                secondaryLabel: 'Assigned To',
                secondary: r.assignedTo,
                metaLabel: 'Date',
                meta: formatShortDate(r.assignedDate),
                status: r.status,
              }))}
            />

            {/* License Card */}
            <AssignmentWidgetCard
              icon={<Key className="w-4 h-4" />}
              accent="text-sky-600 bg-sky-50"
              title="Recent License Assignments"
              viewAllHref="/dashboard/licenses"
              emptyLabel="No recent license assignments"
              rows={data.recentLicenses.map((r) => ({
                primaryLabel: 'License Name',
                primary: r.licenseName,
                secondaryLabel: 'Assigned To',
                secondary: r.assignedTo,
                metaLabel: 'Expires',
                meta: formatShortDate(r.expiryDate),
                status: r.status,
              }))}
            />

            {/* Inventory Card */}
            <AssignmentWidgetCard
              icon={<Package className="w-4 h-4" />}
              accent="text-emerald-600 bg-emerald-50"
              title="Recent Inventory Assignments"
              viewAllHref="/dashboard/inventory"
              emptyLabel="No recent inventory assignments"
              rows={data.recentInventory.map((r) => ({
                primaryLabel: 'Item Name',
                primary: r.itemName,
                secondaryLabel: 'Assigned To',
                secondary: r.assignedTo,
                metaLabel: 'Date',
                meta: formatShortDate(r.assignedDate),
                quantity: r.quantity,
              }))}
            />
          </div>
        </div>

    </div>
    </TooltipProvider>
  );
};

export default DashboardHome;
