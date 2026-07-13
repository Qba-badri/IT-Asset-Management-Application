import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, FileDown, FileSpreadsheet, Loader2,
  ClipboardList, Boxes, Wrench, Archive, Search, Eye, X, SlidersHorizontal,
} from 'lucide-react';
import { auditReportService, AuditReportEntry, AuditReportModule, AuditReportQuery, AuditReportStats } from '../../services/auditReportService';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatCard } from '../../components/shared/StatCard';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { cn } from '../../lib/utils';

const MODULE_COLORS: Record<AuditReportModule, string> = {
  Asset: 'bg-blue-100 text-blue-800',
  License: 'bg-purple-100 text-purple-800',
  Inventory: 'bg-green-100 text-green-800',
};

type TabKey = 'overview' | 'assets' | 'licenses' | 'inventory';

const TABS: { key: TabKey; label: string; module?: AuditReportModule }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'assets', label: 'Asset Audit', module: 'Asset' },
  { key: 'licenses', label: 'License Audit', module: 'License' },
  { key: 'inventory', label: 'Inventory Audit', module: 'Inventory' },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function entityCell(e: AuditReportEntry): { name: string; code: string } {
  const type = e.entityType.replace(/_/g, ' ');
  return {
    name: e.entityName || (type.charAt(0).toUpperCase() + type.slice(1)),
    code: e.entityCode || (e.entityId ? `#${e.entityId}` : '—'),
  };
}

const AuditReportPage: React.FC = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey) || 'overview';

  const [activeTab, setActiveTab] = useState<TabKey>(TABS.some(t => t.key === initialTab) ? initialTab : 'overview');
  const [entries, setEntries] = useState<AuditReportEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<AuditReportStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewEntry, setViewEntry] = useState<AuditReportEntry | null>(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [entityTypeFilter, setEntityTypeFilter] = useState('');

  const activeModule = TABS.find(t => t.key === activeTab)?.module;

  const availableActions = useMemo(() => {
    const set = new Set(entries.map(e => e.action));
    return Array.from(set).sort();
  }, [entries]);

  const availableEntityTypes = useMemo(() => {
    const set = new Set(entries.map(e => e.entityType));
    return Array.from(set).sort();
  }, [entries]);

  const changeTab = (key: TabKey) => {
    setActiveTab(key);
    setPage(1);
    setActionFilter('');
    setEntityTypeFilter('');
    setSearchParams(key === 'overview' ? {} : { tab: key });
  };

  const buildQuery = useCallback((): AuditReportQuery => {
    const query: AuditReportQuery = { page, limit: pageSize };
    if (activeModule) query.module = activeModule;
    if (actionFilter) query.action = actionFilter;
    if (search) query.search = search;
    if (startDate) query.startDate = startDate;
    if (endDate) query.endDate = endDate;
    return query;
  }, [page, pageSize, activeModule, actionFilter, search, startDate, endDate]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const result = await auditReportService.getAll(buildQuery());
      let data = result.data;
      if (entityTypeFilter) data = data.filter(e => e.entityType === entityTypeFilter);
      if (sortDir === 'asc') data = [...data].reverse();
      setEntries(data);
      setTotal(result.total);
    } catch {
      showToast('Failed to load audit report', 'error');
    } finally {
      setLoading(false);
    }
  }, [buildQuery, entityTypeFilter, sortDir]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const query: AuditReportQuery = {};
      if (startDate) query.startDate = startDate;
      if (endDate) query.endDate = endDate;
      const result = await auditReportService.getStats(query);
      setStats(result);
    } catch {
      // non-critical — leave stats blank
    } finally {
      setStatsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Keep activeTab in sync when the URL changes from outside this component
  // (e.g. clicking a sub-item in the sidebar navigates to a new ?tab= value).
  useEffect(() => {
    const tabFromUrl = (searchParams.get('tab') as TabKey) || 'overview';
    const resolved = TABS.some(t => t.key === tabFromUrl) ? tabFromUrl : 'overview';
    setActiveTab((prev) => {
      if (prev === resolved) return prev;
      setPage(1);
      setActionFilter('');
      setEntityTypeFilter('');
      return resolved;
    });
  }, [searchParams]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      setExporting(format);
      await auditReportService.exportFile(buildQuery(), format);
    } catch {
      showToast(`Failed to export ${format.toUpperCase()}`, 'error');
    } finally {
      setExporting(null);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setActionFilter('');
    setStartDate('');
    setEndDate('');
    setEntityTypeFilter('');
    setPage(1);
  };

  const hasActiveFilters = !!(search || actionFilter || startDate || endDate || entityTypeFilter);

  const pageNumbers = useMemo(() => {
    const pages: (number | '...')[] = [];
    const windowSize = 1;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= windowSize) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  }, [totalPages, page]);

  return (
    <div className="space-y-6">
      <PageHeader title="Audit" description="Track and review all system activities across Assets, Licenses and Inventory">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} disabled={exporting !== null}>
            {exporting === 'pdf' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')} disabled={exporting !== null}>
            {exporting === 'excel' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
            Export Excel
          </Button>
        </div>
      </PageHeader>

      {/* Tabs */}
      <div className="flex border-b overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => changeTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap',
              activeTab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <StatCard
          title="Total Activities"
          value={stats?.total ?? 0}
          subtitle="All modules"
          icon={ClipboardList}
          iconColor="bg-blue-100 text-blue-600"
          loading={statsLoading}
        />
        <StatCard
          title="Asset Activities"
          value={stats?.asset ?? 0}
          subtitle="Deployments & returns"
          icon={Boxes}
          iconColor="bg-emerald-100 text-emerald-600"
          loading={statsLoading}
        />
        <StatCard
          title="License Activities"
          value={stats?.license ?? 0}
          subtitle="Assignments & renewals"
          icon={Wrench}
          iconColor="bg-purple-100 text-purple-600"
          loading={statsLoading}
        />
        <StatCard
          title="Inventory Activities"
          value={stats?.inventory ?? 0}
          subtitle="Stock movements"
          icon={Archive}
          iconColor="bg-amber-100 text-amber-600"
          loading={statsLoading}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by entity name, ID, or reason..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={actionFilter || 'all'} onValueChange={(v) => { setActionFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Actions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {availableActions.map(a => (
              <SelectItem key={a} value={a} className="capitalize">{a.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="w-auto" />
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="w-auto" />
        </div>
        <Button
          variant={showMoreFilters ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowMoreFilters((v) => !v)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {showMoreFilters && (
        <div className="flex flex-wrap items-center gap-3 -mt-2">
          <Select value={entityTypeFilter || 'all'} onValueChange={(v) => { setEntityTypeFilter(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Entity Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entity Types</SelectItem>
              {availableEntityTypes.map(t => (
                <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    <button className="flex items-center gap-1 hover:text-foreground" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>
                      Date &amp; Time
                      {sortDir === 'desc' ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Module</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    {activeModule === 'License' ? 'Plan & ID' : 'Entity (Name & ID)'}
                  </th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Action</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Received/Returned By<br/>(Name &amp; Email)</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Performed By<br/>(Name &amp; Email)</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Reason</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Details</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">Loading...</td></tr>
                ) : entries.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">No activity found</td></tr>
                ) : entries.map((e) => {
                  const entity = entityCell(e);
                  return (
                    <tr key={e.id} className="hover:bg-muted/30 align-top">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${MODULE_COLORS[e.module]}`}>{e.module}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-blue-600">{entity.name}</div>
                        <div className="text-xs text-muted-foreground">{entity.code}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap capitalize font-medium">{e.action.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {e.personName ? (
                          <>
                            <div>{e.personName}</div>
                            {e.personEmail && <div className="text-xs text-muted-foreground">{e.personEmail}</div>}
                          </>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>{e.actorName}</div>
                        {e.actorEmail && <div className="text-xs text-muted-foreground">{e.actorEmail}</div>}
                      </td>
                      <td className="px-4 py-3 max-w-[180px] truncate" title={e.reason}>{e.reason || '—'}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate" title={e.details}>{e.details || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewEntry(e)} title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t">
            <span className="text-sm text-muted-foreground">
              Showing {total === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} entries
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {pageNumbers.map((p, i) => p === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">...</span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'ghost'}
                  size="sm"
                  className="min-w-[32px]"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
              <Button variant="ghost" size="icon" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map(size => (
                    <SelectItem key={size} value={String(size)}>{size} / page</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entry detail modal */}
      <Dialog open={!!viewEntry} onOpenChange={(open) => !open && setViewEntry(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Activity Details</DialogTitle></DialogHeader>
          {viewEntry && (
            <div className="space-y-3 pt-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Date &amp; Time</span><span>{new Date(viewEntry.timestamp).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Module</span><span className={`px-2 py-0.5 rounded text-xs font-medium ${MODULE_COLORS[viewEntry.module]}`}>{viewEntry.module}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Entity</span><span>{entityCell(viewEntry).name} ({entityCell(viewEntry).code})</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Action</span><span className="capitalize font-medium">{viewEntry.action.replace(/_/g, ' ')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Received/Returned By</span><span>{viewEntry.personName ? `${viewEntry.personName}${viewEntry.personEmail ? ' (' + viewEntry.personEmail + ')' : ''}` : '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Performed By</span><span>{viewEntry.actorName}{viewEntry.actorEmail ? ` (${viewEntry.actorEmail})` : ''}</span></div>
              <div className="pt-2 border-t">
                <div className="text-muted-foreground mb-1">Reason</div>
                <div>{viewEntry.reason || '—'}</div>
              </div>
              <div className="pt-2 border-t">
                <div className="text-muted-foreground mb-1">Details</div>
                <div>{viewEntry.details || '—'}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditReportPage;
