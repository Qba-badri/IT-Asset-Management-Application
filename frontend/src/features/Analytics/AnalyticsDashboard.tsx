import React, { useEffect, useState, useCallback } from 'react';
import Chart from 'react-apexcharts';
import {
    RefreshCw, BarChart3, Key, Package, Users, AlertTriangle,
    ShieldAlert, TrendingUp, TrendingDown, CheckCircle, Clock,
    Server, Layers, Activity, AlertCircle,
    XCircle, Cpu, RotateCcw, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
    analyticsService,
    DashboardFilters,
    GlobalSummary,
    AssetStats,
    LicenseStats,
    InventoryStats,
    UserStats,
    AlertsData,
    StockMovement,
    LicenseUtilization,
} from '../../services/analyticsService';
import { masterService, Department, Location, Brand } from '../../services/masterService';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '../../context/CurrencyContext';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { cn } from '../../lib/utils';
import { CHART_SERIES } from '../../lib/chartColors';

/* ══════════════════════ helpers ══════════════════════ */
const num = (v: number | string | null | undefined) => Number(v ?? 0);
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
const fmt = (n: number) => n.toLocaleString();

type TabKey = 'overview' | 'assets' | 'licenses' | 'inventory' | 'users' | 'alerts';

/* ══════════════════════ sub-components ══════════════════════ */

/* KPI card */
interface KpiCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    sub?: string;
    trend?: { value: number; label: string };
    accent?: string;
    iconBg?: string;
}
const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, sub, trend, accent = '#2563eb', iconBg = '#eff6ff' }) => {
    const trendUp = trend && trend.value >= 0;
    return (
        <Card>
            <CardContent className="p-4">
                <div className="analytics-kpi-top">
                    <div className="analytics-kpi-icon" style={({ background: iconBg, color: accent }) as React.CSSProperties}>
                        {icon}
                    </div>
                    {trend && (
                        <span className={`analytics-trend ${trendUp ? 'trend-up' : 'trend-down'}`}>
                            {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {Math.abs(trend.value)}%
                        </span>
                    )}
                </div>
                <p className="analytics-kpi-value text-foreground">{typeof value === 'number' ? fmt(value) : value}</p>
                <p className="analytics-kpi-label text-muted-foreground">{label}</p>
                {sub && <p className="analytics-kpi-sub text-muted-foreground">{sub}</p>}
            </CardContent>
        </Card>
    );
};

/* Section header */
const SectionHead: React.FC<{ title: string; note?: string }> = ({ title, note }) => (
    <div className="analytics-section-head">
        <span className="analytics-section-title text-foreground">{title}</span>
        {note && <span className="analytics-section-note text-muted-foreground">{note}</span>}
    </div>
);

/* Progress bar row */
const ProgressRow: React.FC<{ label: string; value: number; total: number; color: string }> = ({ label, value, total, color }) => {
    const p = pct(value, total);
    return (
        <div className="analytics-progress-row">
            <div className="analytics-progress-label">
                <span>{label}</span>
                <span className="analytics-progress-count">{fmt(value)} <small>({p}%)</small></span>
            </div>
            <div className="analytics-progress-track">
                <div className="analytics-progress-fill" style={({ width: `${p}%`, background: color }) as React.CSSProperties} />
            </div>
        </div>
    );
};

/* Alert badge row */
const AlertRow: React.FC<{ icon: React.ReactNode; label: string; count: number; severity: 'critical' | 'warning' | 'info' }> = ({ icon, label, count, severity }) => (
    <div className={`analytics-alert-row alert-${severity}`}>
        <span className="alert-icon">{icon}</span>
        <span className="alert-label">{label}</span>
        <span className="alert-count">{count}</span>
    </div>
);



/* ══════════════════════ CHART DEFAULTS ══════════════════════ */
const CHART_COLORS = CHART_SERIES;
const chartFont = { fontFamily: 'Inter, system-ui, sans-serif' };

/* ══════════════════════ MAIN COMPONENT ══════════════════════ */
const AnalyticsDashboard: React.FC = () => {
    const { showToast } = useToast();
    const { formatDisplayAmount } = useCurrency();

    const [activeTab, setActiveTab] = useState<TabKey>('overview');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const [masters, setMasters] = useState<{ departments: Department[]; locations: Location[]; brands: Brand[] }>({
        departments: [], locations: [], brands: [],
    });

    const [global, setGlobal] = useState<GlobalSummary | null>(null);
    const [assets, setAssets] = useState<AssetStats | null>(null);
    const [licenses, setLicenses] = useState<LicenseStats | null>(null);
    const [inventory, setInventory] = useState<InventoryStats | null>(null);
    const [users, setUsers] = useState<UserStats | null>(null);
    const [alerts, setAlerts] = useState<AlertsData | null>(null);
    interface ActivityLog { id: number; action: string; entityType: string; actorName?: string; createdAt: string; }
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [stockMovement, setStockMovement] = useState<StockMovement>({ thisMonth: [], lastMonth: [] });
    const [licenseUtil, setLicenseUtil] = useState<LicenseUtilization[]>([]);

    /* ── load masters ── */
    useEffect(() => {
        masterService.getDepartments().then(d => setMasters(m => ({ ...m, departments: d }))).catch(() => { });
        masterService.getLocations().then(d => setMasters(m => ({ ...m, locations: d }))).catch(() => { });
        masterService.getBrands().then(d => setMasters(m => ({ ...m, brands: d }))).catch(() => { });
    }, []);

    /* ── load data ── */
    const loadAll = useCallback(async (f: DashboardFilters) => {
        setRefreshing(true);
        try {
            const [g, a, lic, inv, u, al, act, sm, lu] = await Promise.all([
                analyticsService.getGlobalSummary(f || {}),
                analyticsService.getAssetStats(f || {}),
                analyticsService.getLicenseStats(f || {}),
                analyticsService.getInventoryStats(f || {}),
                analyticsService.getUserStats(f || {}),
                analyticsService.getAlerts(f || {}),
                analyticsService.getRecentActivity(f || {}),
                analyticsService.getStockMovement(f || {}),
                analyticsService.getLicenseUtilization(f || {}),
            ]);
            setGlobal(g);
            setAssets(a);
            setLicenses(lic);
            setInventory(inv);
            setUsers(u);
            setAlerts(al);
            setActivity(act || []);
            setStockMovement(sm || { thisMonth: [], lastMonth: [] });
            setLicenseUtil(lu || []);
            setLastUpdated(new Date());
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            showToast(error?.response?.data?.message || 'Failed to load analytics', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [showToast]);

    useEffect(() => { loadAll({}); }, [loadAll]);



    /* ══════ DERIVED CHART DATA ══════ */

    /* Asset donut */
    const assetStatusSeries = (assets?.byStatus || []).map(s => parseInt(s.count));
    const assetStatusLabels = (assets?.byStatus || []).map(s => s.status.charAt(0).toUpperCase() + s.status.slice(1));

    /* Asset by category bar */
    const catLabels = (assets?.byCategory || []).map(c => c.category || 'Unknown');
    const catSeries = (assets?.byCategory || []).map(c => parseInt(c.count));

    /* Stock movement */
    const movKeys = ['procurement', 'issue', 'return', 'adjustment'];
    const movLabels = ['Procurement', 'Issue', 'Return', 'Adjustment'];
    interface StockMovementItem { reason: string; count: string; }
    const smThis = movKeys.map(r => parseInt(stockMovement.thisMonth.find((m: StockMovementItem) => m.reason === r)?.count || '0'));
    const smLast = movKeys.map(r => parseInt(stockMovement.lastMonth.find((m: StockMovementItem) => m.reason === r)?.count || '0'));

    /* License utilization */
    const luLabels = licenseUtil.map(l => l.license_softwareName || 'Unknown');
    const luUsed = licenseUtil.map(l => num(l.license_usedSeats));
    const luFree = licenseUtil.map(l => Math.max(0, num(l.license_totalSeats) - num(l.license_usedSeats)));

    /* ══════ CHART OPTIONS ══════ */
    const donutOptions: ApexCharts.ApexOptions = {
        chart: { type: 'donut', ...chartFont, toolbar: { show: false } },
        labels: assetStatusLabels,
        colors: CHART_COLORS,
        stroke: { show: false },
        dataLabels: { enabled: false },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        total: {
                            show: true, label: 'Assets', fontSize: '12px',
                            fontWeight: 700, color: '#6b7280',
                            formatter: () => String(num(global?.totalAssets)),
                        },
                        value: { fontSize: '22px', fontWeight: 800, color: '#111827' }
                    }
                }
            }
        },
        legend: { position: 'bottom', fontSize: '12px', fontWeight: '600', markers: { size: 6 } },
        tooltip: { theme: 'light' }
    };

    const catBarOptions: ApexCharts.ApexOptions = {
        chart: { type: 'bar', ...chartFont, toolbar: { show: false } },
        colors: CHART_COLORS,
        plotOptions: { bar: { borderRadius: 6, borderRadiusApplication: 'end', columnWidth: '55%' } },
        dataLabels: { enabled: false },
        xaxis: {
            categories: catLabels,
            axisBorder: { show: false }, axisTicks: { show: false },
            labels: { style: { fontSize: '11px', fontWeight: '600', colors: '#9ca3af' } }
        },
        yaxis: { labels: { style: { fontSize: '11px', colors: '#9ca3af' } } },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 4, xaxis: { lines: { show: false } } },
        tooltip: { theme: 'light' }
    };

    const stockMovOptions: ApexCharts.ApexOptions = {
        chart: { type: 'bar', ...chartFont, toolbar: { show: false } },
        colors: ['#cbd5e1', '#2563eb'],
        plotOptions: { bar: { columnWidth: '55%', borderRadius: 5, borderRadiusApplication: 'end' } },
        dataLabels: { enabled: false },
        xaxis: {
            categories: movLabels,
            axisBorder: { show: false }, axisTicks: { show: false },
            labels: { style: { fontSize: '11px', fontWeight: '600', colors: '#9ca3af' } }
        },
        yaxis: { labels: { style: { fontSize: '11px', colors: '#9ca3af' } } },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 4, xaxis: { lines: { show: false } } },
        legend: { position: 'top', horizontalAlign: 'right', fontSize: '11px', fontWeight: '600' },
        tooltip: { theme: 'light' }
    };

    const luBarOptions: ApexCharts.ApexOptions = {
        chart: { type: 'bar', ...chartFont, toolbar: { show: false }, stacked: true },
        colors: ['#2563eb', '#e2e8f0'],
        plotOptions: { bar: { borderRadius: 6, borderRadiusApplication: 'end', horizontal: true, barHeight: '55%' } },
        dataLabels: { enabled: false },
        xaxis: { categories: luLabels, labels: { style: { fontSize: '11px', colors: '#9ca3af' } } },
        yaxis: { labels: { style: { fontSize: '11px', colors: '#374151' }, maxWidth: 160 } },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 4, yaxis: { lines: { show: false } } },
        legend: { position: 'top', horizontalAlign: 'right', fontSize: '11px', fontWeight: '600' },
        tooltip: { theme: 'light' }
    };

    const inventoryDonutOptions: ApexCharts.ApexOptions = {
        chart: { type: 'donut', ...chartFont, toolbar: { show: false } },
        labels: ['Refundable', 'Non-Refundable'],
        colors: ['#2563eb', '#f59e0b'],
        stroke: { show: false },
        dataLabels: { enabled: false },
        plotOptions: { pie: { donut: { size: '65%' } } },
        legend: { position: 'bottom', fontSize: '12px', fontWeight: '600', markers: { size: 6 } },
        tooltip: { theme: 'light' }
    };

    /* ══════ LOADING ══════ */
    if (loading) {
        return (
            <div className="analytics-loading text-muted-foreground">
                <RefreshCw className="animate-spin" size={28} />
                <span>Loading analytics…</span>
            </div>
        );
    }

    /* ══════ TABS ══════ */
    const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
        { key: 'overview', label: 'Overview', icon: <BarChart3 size={15} /> },
        { key: 'assets', label: 'Assets', icon: <Server size={15} /> },
        { key: 'licenses', label: 'Licenses', icon: <Key size={15} /> },
        { key: 'inventory', label: 'Inventory', icon: <Package size={15} /> },
        { key: 'users', label: 'Users & Assignments', icon: <Users size={15} /> },
        { key: 'alerts', label: 'Alerts', icon: <AlertTriangle size={15} /> },
    ];

    const totalAlertsCount = num(alerts?.warrantyExpiring) + num(alerts?.lowStockItems) + num(alerts?.expiredLicenses) + num(alerts?.overdueReturns);

    /* ══════ PANELS ══════ */

    const renderOverview = () => (
        <div className="analytics-panel">
            {/* KPIs */}
            <div className="analytics-kpi-grid">
                <KpiCard icon={<Server size={18} />} label="Total Assets" value={num(global?.totalAssets)} sub={`${formatDisplayAmount(num(global?.totalAssetValue))} total value`} accent="#2563eb" iconBg="#eff6ff" />
                <KpiCard icon={<Key size={18} />} label="Licenses" value={num(global?.totalLicenses)} sub="Software titles" accent="#7c3aed" iconBg="#f5f3ff" />
                <KpiCard icon={<Package size={18} />} label="Inventory Items" value={num(global?.totalInventoryItems)} sub={`${num(inventory?.lowStockAlerts)} low stock`} accent="#d97706" iconBg="#fffbeb" />
                <KpiCard icon={<Users size={18} />} label="Total Users" value={num(global?.totalUsers)} sub={`${num(users?.activeUsers)} active`} accent="#059669" iconBg="#ecfdf5" />
                <KpiCard icon={<Activity size={18} />} label="Active Assignments" value={num(global?.activeAssignments)} sub="Currently deployed" accent="#0891b2" iconBg="#ecfeff" />
                <KpiCard icon={<AlertCircle size={18} />} label="Open Alerts" value={num(alerts?.warrantyExpiring) + num(alerts?.lowStockItems) + num(alerts?.expiredLicenses)} sub="Requires attention" accent="#dc2626" iconBg="#fef2f2" />
            </div>

            {/* Charts row */}
            <div className="analytics-charts-row">
                <Card className="col-2">
                    <CardContent className="p-5">
                        <SectionHead title="Asset Distribution by Status" note={`${num(global?.totalAssets)} total`} />
                        {assetStatusSeries.length > 0 && assetStatusSeries.some(v => v > 0)
                            ? <Chart options={donutOptions} series={assetStatusSeries} type="donut" height={280} />
                            : <div className="analytics-no-data">No asset data</div>
                        }
                    </CardContent>
                </Card>
                <Card className="col-3">
                    <CardContent className="p-5">
                        <SectionHead title="Stock Movement" note="This vs Last period" />
                        <Chart
                            options={stockMovOptions}
                            series={[{ name: 'Last Period', data: smLast }, { name: 'This Period', data: smThis }]}
                            type="bar" height={280}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardContent className="p-5">
                    <div className="analytics-section-head">
                        <span className="analytics-section-title text-foreground">Recent Activity</span>
                        <span className="analytics-live-dot"><span />Live</span>
                    </div>
                    {activity.length > 0 ? (
                        <div className="analytics-activity-list">
                            {activity.slice(0, 8).map((log: ActivityLog) => {
                                const isCreate = log.action?.includes('CREATE');
                                const isDelete = log.action?.includes('DELETE');
                                return (
                                    <div key={log.id} className="analytics-activity-row">
                                        <div className={`activity-icon ${isCreate ? 'create' : isDelete ? 'delete' : 'update'}`}>
                                            {isCreate ? <CheckCircle size={14} /> : isDelete ? <XCircle size={14} /> : <RefreshCw size={14} />}
                                        </div>
                                        <div className="activity-body">
                                            <p className="activity-action text-foreground">
                                                {(log.action || '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase())}
                                            </p>
                                            <p className="activity-entity text-muted-foreground">
                                                {log.entityType}{log.actorName ? ` · ${log.actorName}` : ''}
                                            </p>
                                        </div>
                                        <div className="activity-time text-muted-foreground">
                                            <p>{new Date(log.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                                            <p>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="analytics-no-data"><Clock size={24} /><span>No recent activity</span></div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    const renderAssets = () => (
        <div className="analytics-panel">
            <div className="analytics-kpi-grid">
                <KpiCard icon={<Server size={18} />} label="Total Assets" value={num(global?.totalAssets)} accent="#2563eb" iconBg="#eff6ff" />
                <KpiCard icon={<TrendingUp size={18} />} label="Utilization" value={`${num(assets?.utilizationPercentage).toFixed(1)}%`} sub="Deployed / Total" accent="#059669" iconBg="#ecfdf5" />
                <KpiCard icon={<Cpu size={18} />} label="Recently Added" value={num(assets?.recentlyAdded)} sub="Last 30 days" accent="#7c3aed" iconBg="#f5f3ff" />
                <KpiCard icon={<ShieldAlert size={18} />} label="Warranty Expiring" value={num(assets?.warrantyExpiring60)} sub="Within 60 days" accent="#dc2626" iconBg="#fef2f2" />
                <KpiCard icon={<AlertTriangle size={18} />} label="Expiring in 30d" value={num(assets?.warrantyExpiring30)} sub="Critical window" accent="#d97706" iconBg="#fffbeb" />
                <KpiCard icon={<Activity size={18} />} label="Total Asset Value" value={formatDisplayAmount(num(global?.totalAssetValue))} accent="#0891b2" iconBg="#ecfeff" />
            </div>
            <div className="analytics-charts-row">
                <Card className="col-2">
                    <CardContent className="p-5">
                        <SectionHead title="Assets by Status" />
                        {assetStatusSeries.some(v => v > 0)
                            ? <Chart options={donutOptions} series={assetStatusSeries} type="donut" height={300} />
                            : <div className="analytics-no-data">No data</div>
                        }
                    </CardContent>
                </Card>
                <Card className="col-3">
                    <CardContent className="p-5">
                        <SectionHead title="Assets by Category" />
                        {catSeries.length > 0
                            ? <Chart options={catBarOptions} series={[{ name: 'Assets', data: catSeries }]} type="bar" height={300} />
                            : <div className="analytics-no-data">No category data</div>
                        }
                    </CardContent>
                </Card>
            </div>
            {/* Status breakdown table */}
            <Card>
                <CardContent className="p-5 pb-0">
                    <SectionHead title="Status Breakdown" />
                </CardContent>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Count</TableHead>
                                <TableHead>Share</TableHead>
                                <TableHead>Distribution</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(assets?.byStatus || []).map((s, i) => {
                                const count = parseInt(s.count);
                                const share = pct(count, num(global?.totalAssets));
                                return (
                                    <TableRow key={s.status}>
                                        <TableCell>
                                            <span className="status-dot" style={({ background: CHART_COLORS[i % CHART_COLORS.length] }) as React.CSSProperties} />
                                            {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                                        </TableCell>
                                        <TableCell className="tabular-nums font-semibold text-foreground">{fmt(count)}</TableCell>
                                        <TableCell className="tabular-nums text-muted-foreground">{share}%</TableCell>
                                        <TableCell className="w-40">
                                            <div className="mini-bar-track">
                                                <div className="mini-bar-fill" style={({ width: `${share}%`, background: CHART_COLORS[i % CHART_COLORS.length] }) as React.CSSProperties} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );

    const renderLicenses = () => (
        <div className="analytics-panel">
            <div className="analytics-kpi-grid">
                <KpiCard icon={<Key size={18} />} label="Total Licenses" value={num(licenses?.total)} accent="#7c3aed" iconBg="#f5f3ff" />
                <KpiCard icon={<CheckCircle size={18} />} label="Seats Assigned" value={num(licenses?.assigned)} sub="In use" accent="#059669" iconBg="#ecfdf5" />
                <KpiCard icon={<Package size={18} />} label="Seats Available" value={num(licenses?.available)} sub="Free to assign" accent="#2563eb" iconBg="#eff6ff" />
                <KpiCard icon={<TrendingDown size={18} />} label="Expired" value={num(licenses?.expired)} sub="Need renewal" accent="#dc2626" iconBg="#fef2f2" />
                <KpiCard icon={<AlertTriangle size={18} />} label="Expiring Soon" value={num(licenses?.expiringSoon)} sub="Within 30 days" accent="#d97706" iconBg="#fffbeb" />
                <KpiCard icon={<Activity size={18} />} label="Compliance" value={`${num(licenses?.compliancePercentage)}%`} sub="Seat utilization" accent="#0891b2" iconBg="#ecfeff" />
            </div>

            <div className="analytics-charts-row">
                <Card className="col-3">
                    <CardContent className="p-5">
                        <SectionHead title="License Seat Utilization (Top Titles)" note={`${licenseUtil.length} titles`} />
                        {luLabels.length > 0
                            ? <Chart
                                options={{ ...luBarOptions, xaxis: { ...luBarOptions.xaxis, categories: luLabels } }}
                                series={[{ name: 'Used', data: luUsed }, { name: 'Available', data: luFree }]}
                                type="bar" height={Math.max(220, luLabels.length * 52)}
                            />
                            : <div className="analytics-no-data">No license data</div>
                        }
                    </CardContent>
                </Card>
                <Card className="col-2">
                    <CardContent className="p-5">
                        <SectionHead title="Seat Overview" />
                        <div className="py-2">
                            <ProgressRow label="Used Seats" value={num(licenses?.assigned)} total={num(licenses?.assigned) + num(licenses?.available)} color="#2563eb" />
                            <ProgressRow label="Available Seats" value={num(licenses?.available)} total={num(licenses?.assigned) + num(licenses?.available)} color="#16a34a" />
                            <ProgressRow label="Expired Licenses" value={num(licenses?.expired)} total={num(licenses?.total)} color="#dc2626" />
                            <ProgressRow label="Expiring in 30d" value={num(licenses?.expiringSoon)} total={num(licenses?.total)} color="#f59e0b" />
                        </div>
                        <div className="license-compliance-badge">
                            <span className="compliance-label">Compliance Score</span>
                            <span className={`compliance-score ${num(licenses?.compliancePercentage) >= 80 ? 'good' : 'warn'}`}>
                                {num(licenses?.compliancePercentage)}%
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    const renderInventory = () => {
        const refundable = num(inventory?.distribution?.refundable);
        const nonRefundable = num(inventory?.distribution?.nonRefundable);
        return (
            <div className="analytics-panel">
                <div className="analytics-kpi-grid">
                    <KpiCard icon={<Layers size={18} />} label="Total Stock Units" value={num(inventory?.totalStockUnits)} accent="#2563eb" iconBg="#eff6ff" />
                    <KpiCard icon={<CheckCircle size={18} />} label="Available Units" value={num(inventory?.availableUnits)} sub="Ready to issue" accent="#059669" iconBg="#ecfdf5" />
                    <KpiCard icon={<AlertTriangle size={18} />} label="Low Stock Alerts" value={num(inventory?.lowStockAlerts)} sub="Below reorder point" accent="#d97706" iconBg="#fffbeb" />
                    <KpiCard icon={<XCircle size={18} />} label="Out of Stock" value={num(inventory?.outOfStock)} sub="Zero available" accent="#dc2626" iconBg="#fef2f2" />
                    <KpiCard icon={<RotateCcw size={18} />} label="Refundable Items" value={refundable} accent="#7c3aed" iconBg="#f5f3ff" />
                    <KpiCard icon={<Package size={18} />} label="Non-Refundable" value={nonRefundable} accent="#0891b2" iconBg="#ecfeff" />
                </div>
                <div className="analytics-charts-row">
                    <Card className="col-2">
                        <CardContent className="p-5">
                            <SectionHead title="Refundable vs Non-Refundable" />
                            {(refundable + nonRefundable) > 0
                                ? <Chart options={inventoryDonutOptions} series={[refundable, nonRefundable]} type="donut" height={280} />
                                : <div className="analytics-no-data">No data</div>
                            }
                        </CardContent>
                    </Card>
                    <Card className="col-3">
                        <CardContent className="p-5">
                            <SectionHead title="Stock Health Overview" />
                            <div className="py-3">
                                <ProgressRow label="Total Stock" value={num(inventory?.totalStockUnits)} total={num(inventory?.totalStockUnits)} color="#2563eb" />
                                <ProgressRow label="Available" value={num(inventory?.availableUnits)} total={num(inventory?.totalStockUnits)} color="#16a34a" />
                                <ProgressRow label="Low Stock Items" value={num(inventory?.lowStockAlerts)} total={num(inventory?.totalStockUnits)} color="#f59e0b" />
                                <ProgressRow label="Out of Stock Items" value={num(inventory?.outOfStock)} total={num(inventory?.totalStockUnits)} color="#dc2626" />
                            </div>
                            <div className="analytics-charts-row mt-4">
                                <Card className="col-5">
                                    <CardContent className="p-5">
                                        <SectionHead title="Stock Movement This Period" />
                                        <Chart
                                            options={stockMovOptions}
                                            series={[{ name: 'Last Period', data: smLast }, { name: 'This Period', data: smThis }]}
                                            type="bar" height={220}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    };

    const renderUsers = () => (
        <div className="analytics-panel">
            <div className="analytics-kpi-grid-4">
                <KpiCard icon={<Users size={18} />} label="Total Users" value={num(users?.totalUsers)} accent="#2563eb" iconBg="#eff6ff" />
                <KpiCard icon={<CheckCircle size={18} />} label="Active Users" value={num(users?.activeUsers)} sub={`${pct(num(users?.activeUsers), num(users?.totalUsers))}% active rate`} accent="#059669" iconBg="#ecfdf5" />
                <KpiCard icon={<AlertCircle size={18} />} label="Inactive Users" value={num(users?.totalUsers) - num(users?.activeUsers)} accent="#dc2626" iconBg="#fef2f2" />
                <KpiCard icon={<Activity size={18} />} label="Active Assignments" value={num(global?.activeAssignments)} sub="Items on loan" accent="#7c3aed" iconBg="#f5f3ff" />
            </div>
            <div className="analytics-charts-row">
                <Card className="col-5">
                    <CardContent className="p-5">
                        <SectionHead title="User Activity Status" />
                        <Chart
                            options={{
                                chart: { type: 'donut', ...chartFont, toolbar: { show: false } },
                                labels: ['Active Users', 'Inactive Users'],
                                colors: ['#16a34a', '#e5e7eb'],
                                stroke: { show: false },
                                dataLabels: { enabled: false },
                                plotOptions: {
                                    pie: {
                                        donut: {
                                            size: '70%',
                                            labels: {
                                                show: true,
                                                total: {
                                                    show: true, label: 'Users', fontSize: '12px',
                                                    fontWeight: 700, color: '#6b7280',
                                                    formatter: () => String(num(users?.totalUsers))
                                                },
                                                value: { fontSize: '22px', fontWeight: 800, color: '#111827' }
                                            }
                                        }
                                    }
                                },
                                legend: { position: 'bottom', fontSize: '12px', fontWeight: '600', markers: { size: 6 } },
                                tooltip: { theme: 'light' }
                            }}
                            series={[num(users?.activeUsers), Math.max(0, num(users?.totalUsers) - num(users?.activeUsers))]}
                            type="donut" height={300}
                        />
                    </CardContent>
                </Card>
                <Card className="col-5">
                    <CardContent className="p-5">
                        <SectionHead title="Department Insights" />
                        <div className="users-info-block">
                            <div className="users-info-row">
                                <span className="ui-label">Most Active Department</span>
                                <span className="ui-value dept-chip">{users?.mostAssignedDepartment || 'N/A'}</span>
                            </div>
                            <div className="users-info-row">
                                <span className="ui-label">Active Rate</span>
                                <div className="ui-progress-wrap">
                                    <div className="ui-progress-bar" style={({ width: `${pct(num(users?.activeUsers), num(users?.totalUsers))}%` }) as React.CSSProperties} />
                                    <span className="ui-progress-label">{pct(num(users?.activeUsers), num(users?.totalUsers))}%</span>
                                </div>
                            </div>
                            <div className="users-info-row">
                                <span className="ui-label">Avg Assignments/User</span>
                                <span className="ui-value">
                                    {num(users?.totalUsers) > 0 ? (num(global?.activeAssignments) / num(users?.totalUsers)).toFixed(1) : '0'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    const renderAlerts = () => {
        const totalAlerts = num(alerts?.warrantyExpiring) + num(alerts?.lowStockItems) + num(alerts?.expiredLicenses) + num(alerts?.overdueReturns);
        return (
            <div className="analytics-panel">
                <div className="analytics-kpi-grid">
                    <KpiCard icon={<ShieldAlert size={18} />} label="Warranty Expiring" value={num(alerts?.warrantyExpiring)} sub="Within 60 days" accent="#d97706" iconBg="#fffbeb" />
                    <KpiCard icon={<ShieldAlert size={18} />} label="Warranty Expiring" value={num(alerts?.warrantyExpiring30)} sub="Within 30 days — Critical" accent="#dc2626" iconBg="#fef2f2" />
                    <KpiCard icon={<Package size={18} />} label="Low Stock Items" value={num(alerts?.lowStockItems)} sub="Below min level" accent="#f59e0b" iconBg="#fffbeb" />
                    <KpiCard icon={<Key size={18} />} label="Expired Licenses" value={num(alerts?.expiredLicenses)} sub="Need renewal" accent="#dc2626" iconBg="#fef2f2" />
                    <KpiCard icon={<Clock size={18} />} label="Overdue Returns" value={num(alerts?.overdueReturns)} sub="Past due date" accent="#7c3aed" iconBg="#f5f3ff" />
                    <KpiCard icon={<Server size={18} />} label="Unassigned Assets" value={num(alerts?.assetsUnassigned)} sub="Available but idle" accent="#0891b2" iconBg="#ecfeff" />
                </div>

                {totalAlerts > 0 && (
                    <Card>
                        <CardContent className="p-5">
                            <SectionHead title="Alert Summary" note={`${totalAlerts} total alerts`} />
                            <div className="alerts-list">
                                {num(alerts?.warrantyExpiring30) > 0 && (
                                    <AlertRow icon={<ShieldAlert size={16} />} label="Warranties expiring within 30 days" count={num(alerts?.warrantyExpiring30)} severity="critical" />
                                )}
                                {num(alerts?.expiredLicenses) > 0 && (
                                    <AlertRow icon={<Key size={16} />} label="Licenses already expired" count={num(alerts?.expiredLicenses)} severity="critical" />
                                )}
                                {num(alerts?.overdueReturns) > 0 && (
                                    <AlertRow icon={<Clock size={16} />} label="Overdue return assignments" count={num(alerts?.overdueReturns)} severity="critical" />
                                )}
                                {num(alerts?.warrantyExpiring) > 0 && (
                                    <AlertRow icon={<ShieldAlert size={16} />} label="Warranties expiring within 60 days" count={num(alerts?.warrantyExpiring)} severity="warning" />
                                )}
                                {num(alerts?.lowStockItems) > 0 && (
                                    <AlertRow icon={<Package size={16} />} label="Inventory items below minimum stock level" count={num(alerts?.lowStockItems)} severity="warning" />
                                )}
                                {num(alerts?.assetsUnassigned) > 0 && (
                                    <AlertRow icon={<Server size={16} />} label="Assets available but not yet assigned" count={num(alerts?.assetsUnassigned)} severity="info" />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {totalAlerts === 0 && (
                    <Card>
                        <CardContent className="p-5">
                            <div className="analytics-no-data py-12">
                                <CheckCircle size={40} className="text-green-600" />
                                <span className="text-green-600 font-semibold">All clear — no active alerts!</span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    };

    const panelMap: Record<TabKey, () => React.ReactNode> = {
        overview: renderOverview,
        assets: renderAssets,
        licenses: renderLicenses,
        inventory: renderInventory,
        users: renderUsers,
        alerts: renderAlerts,
    };

    return (
        <>
            <style>{CSS}</style>
            <div className={cn('space-y-6', refreshing && 'opacity-60 pointer-events-none transition-opacity')}>

                {/* ── Header ── */}
                <PageHeader
                    title="Analytics & Reporting"
                    description={lastUpdated
                        ? `Last updated · ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Comprehensive IT asset intelligence'}
                >
                    <Button variant="outline" onClick={() => loadAll({})} disabled={refreshing}>
                        <RefreshCw size={15} className={cn('mr-2', refreshing && 'animate-spin')} />
                        {refreshing ? 'Refreshing…' : 'Refresh'}
                    </Button>
                </PageHeader>

                {/* ── Tabs ── */}
                <div className="flex border-b overflow-x-auto">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={cn(
                                'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap',
                                activeTab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {t.icon}
                            {t.label}
                            {t.key === 'alerts' && totalAlertsCount > 0 && (
                                <span className="tab-badge">{totalAlertsCount}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Panel ── */}
                <div className="analytics-content">
                    {panelMap[activeTab]()}
                </div>
            </div>
        </>
    );
};

/* ══════════════════════ SCOPED CSS ══════════════════════ */
/* Kept only for elements with dynamic/semantic coloring (progress fills, alert
   severities, activity icon backgrounds, trend badges, live-dot pulse, mini-bar,
   compliance badge) that don't map cleanly onto static design-system tokens. */
const CSS = `
/* Loading */
.analytics-loading {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 14px;
}
.animate-spin { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Tab badge */
.tab-badge {
    background: #ef4444;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    border-radius: 999px;
    padding: 1px 6px;
    min-width: 18px;
    text-align: center;
    line-height: 16px;
}

/* Content */
.analytics-panel { display: flex; flex-direction: column; gap: 20px; }

/* KPI grid */
.analytics-kpi-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 16px;
}
.analytics-kpi-grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
}
@media (max-width: 1200px) { .analytics-kpi-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 768px)  { .analytics-kpi-grid, .analytics-kpi-grid-4 { grid-template-columns: repeat(2, 1fr); } }

/* KPI card */
.analytics-kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.analytics-kpi-icon {
    width: 38px; height: 38px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
}
.analytics-trend {
    display: flex; align-items: center; gap: 2px;
    font-size: 11px; font-weight: 700;
    border-radius: 6px; padding: 3px 7px;
}
.trend-up { background: #ecfdf5; color: #059669; }
.trend-down { background: #fef2f2; color: #dc2626; }
.analytics-kpi-value {
    font-size: 26px; font-weight: 800;
    font-variant-numeric: tabular-nums; line-height: 1.1;
    margin: 0;
}
.analytics-kpi-label { font-size: 12px; font-weight: 600; margin: 0; }
.analytics-kpi-sub  { font-size: 11px; margin: 0; }

/* Charts row */
.analytics-charts-row {
    display: grid;
    grid-template-columns: 2fr 3fr;
    gap: 20px;
}
@media (max-width: 960px) { .analytics-charts-row { grid-template-columns: 1fr; } }

/* Section head */
.analytics-section-head {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 14px;
}
.analytics-section-title { font-size: 13px; font-weight: 700; }
.analytics-section-note  { font-size: 11px; }
.analytics-live-dot {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 600; color: #16a34a;
}
.analytics-live-dot span {
    width: 7px; height: 7px; border-radius: 50%;
    background: #16a34a; display: inline-block;
    animation: pulse 1.5s infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }

/* Progress */
.analytics-progress-row { margin-bottom: 14px; }
.analytics-progress-label {
    display: flex; justify-content: space-between;
    font-size: 12px; font-weight: 600; color: #374151;
    margin-bottom: 6px;
}
.analytics-progress-count { color: #0f172a; }
.analytics-progress-track {
    height: 8px; background: #f1f5f9; border-radius: 99px; overflow: hidden;
}
.analytics-progress-fill {
    height: 100%; border-radius: 99px;
    transition: width .6s cubic-bezier(.4,0,.2,1);
}

/* No data */
.analytics-no-data {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 10px;
    color: #cbd5e1; font-size: 13px; padding: 40px 0;
}

/* Activity */
.analytics-activity-list { display: flex; flex-direction: column; }
.analytics-activity-row {
    display: flex; align-items: center; gap: 14px;
    padding: 12px 4px; border-bottom: 1px solid #f1f5f9;
    transition: background .15s;
}
.analytics-activity-row:last-child { border-bottom: none; }
.analytics-activity-row:hover { background: #f8fafc; border-radius: 8px; }
.activity-icon {
    width: 34px; height: 34px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.activity-icon.create { background: #ecfdf5; color: #16a34a; }
.activity-icon.delete { background: #fef2f2; color: #dc2626; }
.activity-icon.update { background: #eff6ff; color: #2563eb; }
.activity-body { flex: 1; min-width: 0; }
.activity-action { font-size: 13px; font-weight: 600; margin: 0; }
.activity-entity { font-size: 11px; margin: 2px 0 0; }
.activity-time { text-align: right; flex-shrink: 0; }
.activity-time p { font-size: 11px; margin: 0; font-weight: 500; }
.activity-time p:first-child { font-weight: 600; }

/* Table helpers */
.status-dot {
    display: inline-block; width: 8px; height: 8px;
    border-radius: 50%; margin-right: 8px;
}
.mini-bar-track {
    height: 6px; background: #f1f5f9; border-radius: 99px; overflow: hidden;
}
.mini-bar-fill {
    height: 100%; border-radius: 99px; transition: width .5s;
}

/* License compliance */
.license-compliance-badge {
    margin-top: 20px; padding: 14px 16px;
    background: #f8fafc; border-radius: 10px;
    display: flex; align-items: center; justify-content: space-between;
}
.compliance-label { font-size: 12px; font-weight: 600; color: #64748b; }
.compliance-score {
    font-size: 22px; font-weight: 800;
    font-variant-numeric: tabular-nums;
}
.compliance-score.good { color: #16a34a; }
.compliance-score.warn { color: #dc2626; }

/* Alerts */
.alerts-list { display: flex; flex-direction: column; gap: 10px; }
.analytics-alert-row {
    display: flex; align-items: center; gap: 12px;
    border-radius: 10px; padding: 12px 16px;
    font-size: 13px; font-weight: 600;
}
.analytics-alert-row.alert-critical { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.analytics-alert-row.alert-warning  { background: #fffbeb; color: #92400e; border: 1px solid #fcd34d; }
.analytics-alert-row.alert-info     { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.alert-icon { flex-shrink: 0; }
.alert-label { flex: 1; }
.alert-count {
    font-size: 18px; font-weight: 800;
    font-variant-numeric: tabular-nums;
    min-width: 32px; text-align: right;
}

/* Users */
.users-info-block { display: flex; flex-direction: column; gap: 20px; padding: 8px 0; }
.users-info-row { display: flex; flex-direction: column; gap: 8px; }
.ui-label { font-size: 12px; font-weight: 600; color: #64748b; }
.ui-value { font-size: 16px; font-weight: 700; color: #0f172a; }
.dept-chip {
    display: inline-block; background: #eff6ff; color: #2563eb;
    border-radius: 8px; padding: 4px 12px; font-size: 13px;
}
.ui-progress-wrap {
    display: flex; align-items: center; gap: 10px;
}
.ui-progress-bar {
    flex: 1; height: 10px; background: #2563eb; border-radius: 99px;
    transition: width .5s;
    max-width: calc(100% - 48px);
}
.ui-progress-label { font-size: 12px; font-weight: 700; color: #0f172a; min-width: 36px; }
`;

export default AnalyticsDashboard;
