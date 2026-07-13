import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, FileDown, FileSpreadsheet, Loader2, ChevronDown } from 'lucide-react';
import { auditReportService, AuditReportEntry, AuditReportModule, AuditReportQuery } from '../../services/auditReportService';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

const MODULE_COLORS: Record<AuditReportModule, string> = {
  Asset: 'bg-blue-100 text-blue-800',
  License: 'bg-purple-100 text-purple-800',
  Inventory: 'bg-green-100 text-green-800',
};

interface EntityGroup {
  key: string;
  module: AuditReportModule;
  entityType: string;
  entityId: number | null;
  entityLabel: string;
  movements: AuditReportEntry[];
  latestTimestamp: string;
}

function groupByEntity(entries: AuditReportEntry[]): EntityGroup[] {
  const groups = new Map<string, EntityGroup>();

  for (const e of entries) {
    const key = `${e.module}:${e.entityType}:${e.entityId ?? 'none'}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        module: e.module,
        entityType: e.entityType,
        entityId: e.entityId,
        entityLabel: e.entityLabel,
        movements: [],
        latestTimestamp: e.timestamp,
      };
      groups.set(key, group);
    }
    group.movements.push(e);
    if (e.timestamp > group.latestTimestamp) group.latestTimestamp = e.timestamp;
    if (!group.entityLabel && e.entityLabel) group.entityLabel = e.entityLabel;
  }

  const result = Array.from(groups.values());
  // Oldest-first within each group so "Movement 1" is chronologically first
  result.forEach((g) => g.movements.sort((a, b) => a.timestamp.localeCompare(b.timestamp)));
  // Most-recently-active entities first
  result.sort((a, b) => b.latestTimestamp.localeCompare(a.latestTimestamp));
  return result;
}

function entityHeading(g: EntityGroup): string {
  const type = g.entityType.replace(/_/g, ' ');
  const label = g.entityLabel ? ` — ${g.entityLabel}` : '';
  return `${type}${g.entityId ? ' #' + g.entityId : ''}${label}`;
}

const AuditReportPage: React.FC = () => {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<AuditReportEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const [moduleFilter, setModuleFilter] = useState<AuditReportModule | ''>('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const pageSize = 200;

  const buildQuery = useCallback((): AuditReportQuery => {
    const query: AuditReportQuery = { page, limit: pageSize };
    if (moduleFilter) query.module = moduleFilter;
    if (search) query.search = search;
    if (startDate) query.startDate = startDate;
    if (endDate) query.endDate = endDate;
    return query;
  }, [page, moduleFilter, search, startDate, endDate]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const result = await auditReportService.getAll(buildQuery());
      setEntries(result.data);
      setTotal(result.total);
    } catch {
      showToast('Failed to load audit report', 'error');
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);
  const totalPages = Math.ceil(total / pageSize);
  const groups = useMemo(() => groupByEntity(entries), [entries]);

  const toggleGroup = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

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

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Report" description={`Combined activity across Assets, Licenses and Inventory — ${total} entries`}>
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={moduleFilter || 'all'} onValueChange={(v) => { setModuleFilter(v === 'all' ? '' : (v as AuditReportModule)); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Modules" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            <SelectItem value="Asset">Asset</SelectItem>
            <SelectItem value="License">License</SelectItem>
            <SelectItem value="Inventory">Inventory</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Search actor or entity..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-[220px]"
        />
        <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="w-auto" />
        <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="w-auto" />
      </div>

      {/* Movement History — grouped by entity */}
      <Card>
        <CardContent className="p-0 divide-y">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No activity found</div>
          ) : groups.map((g) => {
            const isCollapsed = collapsed.has(g.key);
            return (
              <div key={g.key}>
                <button
                  type="button"
                  onClick={() => toggleGroup(g.key)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 text-left"
                >
                  <div className="flex items-center gap-2">
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${MODULE_COLORS[g.module]}`}>
                      {g.module}
                    </span>
                    <span className="font-medium capitalize">{entityHeading(g)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{g.movements.length} movement{g.movements.length !== 1 ? 's' : ''}</span>
                </button>
                {!isCollapsed && (
                  <div className="pl-9 pr-4 pb-3">
                    <ol className="space-y-1.5">
                      {g.movements.map((m, i) => (
                        <li key={m.id} className="flex items-start gap-3 text-sm">
                          <span className="text-muted-foreground shrink-0 w-16">Movement {i + 1}</span>
                          <span className="text-muted-foreground whitespace-nowrap">{new Date(m.timestamp).toLocaleString()}</span>
                          <span className="capitalize font-medium">{m.action.replace(/_/g, ' ')}</span>
                          <span className="text-muted-foreground">by {m.actorName}</span>
                          {m.details && <span className="text-muted-foreground truncate" title={m.details}>— {m.details}</span>}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-muted/40">
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages} ({pageSize} entries per page, grouped above)</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditReportPage;
