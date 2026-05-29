import React, { useState, useEffect, useCallback } from 'react';
import Chart from 'react-apexcharts';
import {
    RefreshCw, ChevronDown, Server, Monitor, Package, Key,
    Layers, AlertTriangle, TrendingUp, Clock, CheckCircle, XCircle
} from 'lucide-react';
import { dashboardService, DashboardFilters, GlobalSummary, AssetStats, InventoryStats } from '../../services/dashboardService';
import { masterService, Department, Location, Brand, Vendor } from '../../services/masterService';
import { categoryService } from '../../services/categoryService';
import { useToast } from '../../context/ToastContext';

/* ── tiny helpers ── */
const num = (v: number | string | null | undefined) => Number(v ?? 0);
const pct = (a: number, b: number) => b > 0 ? Math.round((a / b) * 100) : 0;

const Badge: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${color}`}>{children}</span>
);

const StatCard: React.FC<{
    icon: React.ReactNode; label: string; value: number | string;
    sub?: string; accent?: string; onClick?: () => void;
}> = ({ icon, label, value, sub, accent = 'text-blue-600 bg-blue-50', onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3 ${onClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm' : ''} transition-all`}
    >
        <div className="flex items-center justify-between">
            <span className={`p-2 rounded-lg ${accent}`}>{icon}</span>
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">{value}</p>
            <p className="text-sm font-medium text-gray-600 mt-1">{label}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
    </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode; note?: string }> = ({ children, note }) => (
    <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-800">{children}</h2>
        {note && <span className="text-xs text-gray-400">{note}</span>}
    </div>
);



/* ══════════════════════════════════════════ */
const DashboardHome: React.FC = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    interface StockMovementItem { reason: string; count: string; }
    interface DashboardData {
        global: GlobalSummary | null;
        assets: AssetStats | null;
        inventory: InventoryStats | null;
        recentActivity: Record<string, unknown>[];
        stockMovement: { thisMonth: StockMovementItem[]; lastMonth: StockMovementItem[] };
        licenseUtil: Record<string, unknown>[];
    }
    const [data, setData] = useState<DashboardData>({
        global: null, assets: null, inventory: null,
        recentActivity: [], stockMovement: { thisMonth: [], lastMonth: [] }, licenseUtil: []
    });





    const loadDashboard = useCallback(async () => {
        setRefreshing(true);
        try {
            const f = {};
            const [global, assets, , inventory, , recentActivity, stockMovement, licenseUtil] = await Promise.all([
                dashboardService.getGlobalSummary(f), dashboardService.getAssetStats(f),
                dashboardService.getLicenseStats(f), dashboardService.getInventoryStats(f),
                dashboardService.getAlerts(f), dashboardService.getRecentActivity(f),
                dashboardService.getStockMovement(f), dashboardService.getLicenseUtilization(f)
            ]);
            setData({ global, assets, inventory, recentActivity, stockMovement, licenseUtil });
            setLastUpdated(new Date());
        } catch {
            showToast('Failed to load dashboard', 'error');
        } finally { setLoading(false); setRefreshing(false); }
    }, [showToast]);

    useEffect(() => { loadDashboard(); }, [loadDashboard]);



    /* ── derived ── */
    const g = data.global;
    const assets = data.assets;
    const inv = data.inventory;
    const licenseUtil = data.licenseUtil || [];
    const activity = data.recentActivity || [];
    const sm = data.stockMovement || { thisMonth: [], lastMonth: [] };

    interface AssetStatus { status: string; count: string | number; }
    const byStatus = (s: string) => parseInt(((assets?.byStatus as AssetStatus[]) || []).find((x: AssetStatus) => x.status.toLowerCase() === s)?.count as string || '0');
    const deployed = byStatus('deployed');
    const available = byStatus('available');
    const maintenance = byStatus('maintenance');
    const totalAssets = num(g?.totalAssets);

    /* ── chart: asset donut ── */
    const donutSeries = ((assets?.byStatus as AssetStatus[]) || []).map((s: AssetStatus) => parseInt(s.count as string)) || [];
    const donutLabels = ((assets?.byStatus as AssetStatus[]) || []).map((s: AssetStatus) =>
        s.status.charAt(0).toUpperCase() + s.status.slice(1)
    ) || [];
    const donutOptions: ApexCharts.ApexOptions = {
        chart: { type: 'donut', fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
        labels: donutLabels,
        colors: ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#64748b'],
        stroke: { show: false },
        dataLabels: { enabled: false },
        plotOptions: {
            pie: {
                donut: {
                    size: '72%',
                    labels: {
                        show: true,
                        total: {
                            show: true, label: 'Assets', fontSize: '12px',
                            fontWeight: 700, color: '#6b7280',
                            formatter: () => String(totalAssets)
                        },
                        value: { fontSize: '20px', fontWeight: 700, color: '#111827' }
                    }
                }
            }
        },
        legend: { position: 'bottom', fontSize: '11px', fontWeight: 600, markers: { size: 6 } },
        tooltip: { theme: 'light' }
    };

    /* ── chart: stock movement bar ── */
    const movKeys = ['procurement', 'issue', 'return', 'adjustment'];
    const movLabels = ['Procure', 'Issue', 'Return', 'Adjust'];
    const barOptions: ApexCharts.ApexOptions = {
        chart: { type: 'bar', fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
        colors: ['#e2e8f0', '#2563eb'],
        plotOptions: { bar: { columnWidth: '55%', borderRadius: 5, borderRadiusApplication: 'end' } },
        dataLabels: { enabled: false },
        xaxis: {
            categories: movLabels,
            axisBorder: { show: false }, axisTicks: { show: false },
            labels: { style: { fontSize: '11px', fontWeight: 600, colors: '#9ca3af' } }
        },
        yaxis: { labels: { style: { fontSize: '11px', colors: '#9ca3af' } } },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 3, xaxis: { lines: { show: false } } },
        legend: { show: true, position: 'top', horizontalAlign: 'right', fontSize: '11px', fontWeight: 600 },
        tooltip: { theme: 'light' }
    };
    const barSeries = [
        { name: 'Last Period', data: movKeys.map(r => parseInt(sm.lastMonth.find((m: StockMovementItem) => m.reason === r)?.count || '0')) },
        { name: 'This Period', data: movKeys.map(r => parseInt(sm.thisMonth.find((m: StockMovementItem) => m.reason === r)?.count || '0')) }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-gray-400">
                    <RefreshCw className="w-7 h-7 animate-spin" />
                    <span className="text-sm font-medium">Loading dashboard…</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-gray-50 transition-opacity duration-300 ${refreshing ? 'opacity-60' : 'opacity-100'}`}>
            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {lastUpdated
                                ? `Last updated at ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                : 'IT Asset Management Overview'}
                        </p>
                    </div>
                    <button
                        onClick={() => loadDashboard()}
                        disabled={refreshing}
                        className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
                        {refreshing ? 'Refreshing…' : 'Refresh'}
                    </button>
                </div>



                {/* ── KPI Row ── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard
                        icon={<Server className="w-4 h-4" />}
                        label="Total Assets" value={totalAssets}
                        sub="All hardware" accent="text-blue-600 bg-blue-50"
                    />
                    <StatCard
                        icon={<Monitor className="w-4 h-4" />}
                        label="Deployed" value={deployed}
                        sub={`${pct(deployed, totalAssets)}% of fleet`} accent="text-green-600 bg-green-50"
                    />
                    <StatCard
                        icon={<Package className="w-4 h-4" />}
                        label="Available" value={available}
                        sub="Ready to assign" accent="text-purple-600 bg-purple-50"
                    />
                    <StatCard
                        icon={<AlertTriangle className="w-4 h-4" />}
                        label="In Maintenance" value={maintenance}
                        sub="Under review" accent="text-amber-600 bg-amber-50"
                    />
                    <StatCard
                        icon={<Key className="w-4 h-4" />}
                        label="Licenses" value={num(g?.totalLicenses)}
                        sub={`${licenseUtil.length} software titles`} accent="text-sky-600 bg-sky-50"
                    />
                    <StatCard
                        icon={<Layers className="w-4 h-4" />}
                        label="Inventory" value={num(g?.totalInventoryItems)}
                        sub={`${num(inv?.lowStockAlerts)} low stock`} accent="text-orange-600 bg-orange-50"
                    />
                </div>

                {/* ── Middle Row: Charts ── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                    {/* Donut chart */}
                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
                        <SectionTitle note={`${totalAssets} items`}>Asset Distribution</SectionTitle>
                        {donutSeries.length > 0 && donutSeries.some((v: number) => v > 0)
                            ? <Chart options={donutOptions} series={donutSeries} type="donut" height={260} />
                            : <div className="h-64 flex items-center justify-center text-sm text-gray-400">No asset data</div>
                        }
                    </div>

                    {/* Stock movement bar */}
                    <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl p-6">
                        <SectionTitle note="this vs last period">Stock Movement</SectionTitle>
                        <Chart options={barOptions} series={barSeries} type="bar" height={260} />
                    </div>
                </div>

                {/* ── Bottom Row ── */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <SectionTitle>Inventory Status</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { label: 'Total Stock', value: num(inv?.totalStockUnits), pct: 100, color: 'bg-blue-600' },
                            { label: 'Available', value: num(inv?.availableUnits), pct: pct(num(inv?.availableUnits), num(inv?.totalStockUnits)), color: 'bg-green-600' },
                            { label: 'Low Stock', value: num(inv?.lowStockAlerts), pct: pct(num(inv?.lowStockAlerts), num(inv?.totalStockUnits)), color: 'bg-amber-500' },
                            { label: 'Out of Stock', value: num(inv?.outOfStock), pct: pct(num(inv?.outOfStock), num(inv?.totalStockUnits)), color: 'bg-red-600' },
                        ].map(item => (
                            <div key={item.label}>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="font-medium text-gray-700">{item.label}</span>
                                    <span className="font-bold text-gray-900 tabular-nums">{item.value.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${item.color}`}
                                        style={({ width: `${item.pct}%` }) as React.CSSProperties}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DashboardHome;
