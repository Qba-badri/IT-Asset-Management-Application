import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Activity,
  Calendar,
  Filter,
  X,
  AlertCircle,
  Clock,
} from 'lucide-react';
import {
  auditEventsService,
  AuditEvent,
  AuditAction,
  AuditEventQuery,
} from '../../services/auditEventsService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Skeleton } from '../../components/ui/skeleton';
import { Pagination } from '../../components/shared/Pagination';
import { Card, CardContent } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

// ─── Constants ────────────────────────────────────────────────────

const AUDIT_ACTIONS: { value: AuditAction; label: string }[] = [
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'login', label: 'Login' },
  { value: 'issue', label: 'Issue' },
  { value: 'return', label: 'Return' },
  { value: 'partial_return', label: 'Partial Return' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'repair_start', label: 'Repair Start' },
  { value: 'repair_end', label: 'Repair End' },
  { value: 'lost', label: 'Lost' },
  { value: 'write_off', label: 'Write Off' },
  { value: 'adjust', label: 'Adjust' },
  { value: 'dispose', label: 'Dispose' },
  { value: 'approval', label: 'Approval' },
  { value: 'rejection', label: 'Rejection' },
];

const ENTITY_TYPES = [
  { value: 'assignment', label: 'Assignment' },
  { value: 'asset_unit', label: 'Asset Unit' },
  { value: 'catalog_item', label: 'Catalog Item' },
  { value: 'stock', label: 'Stock' },
  { value: 'user', label: 'User' },
  { value: 'license', label: 'License' },
  { value: 'inventory_item', label: 'Inventory Item' },
  { value: 'return_transaction', label: 'Return Transaction' },
];

const PAGE_SIZE = 25;

// ─── Action Badge Config ──────────────────────────────────────────

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'muted';

interface ActionConfig {
  variant: BadgeVariant;
  label: string;
}

const ACTION_CONFIG: Record<AuditAction, ActionConfig> = {
  create:        { variant: 'info',        label: 'Create' },
  update:        { variant: 'info',        label: 'Update' },
  delete:        { variant: 'destructive', label: 'Delete' },
  login:         { variant: 'success',     label: 'Login' },
  issue:         { variant: 'default',     label: 'Issue' },
  return:        { variant: 'success',     label: 'Return' },
  partial_return:{ variant: 'warning',     label: 'Partial Return' },
  transfer:      { variant: 'info',        label: 'Transfer' },
  repair_start:  { variant: 'warning',     label: 'Repair Start' },
  repair_end:    { variant: 'success',     label: 'Repair End' },
  lost:          { variant: 'destructive', label: 'Lost' },
  write_off:     { variant: 'destructive', label: 'Write Off' },
  adjust:        { variant: 'muted',       label: 'Adjust' },
  dispose:       { variant: 'muted',       label: 'Dispose' },
  approval:      { variant: 'success',     label: 'Approval' },
  rejection:     { variant: 'destructive', label: 'Rejection' },
};

// ─── Helper Utilities ─────────────────────────────────────────────

function formatTimestamp(iso: string): { full: string; relative: string } {
  const date = new Date(iso);
  const full = date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  let relative = '';
  if (diffMins < 1) relative = 'just now';
  else if (diffMins < 60) relative = `${diffMins}m ago`;
  else if (diffHours < 24) relative = `${diffHours}h ago`;
  else if (diffDays < 30) relative = `${diffDays}d ago`;
  else relative = full;

  return { full, relative };
}

function getActorInitials(actor: AuditEvent['actor']): string {
  if (!actor) return 'SY';
  return `${actor.firstName?.[0] ?? ''}${actor.lastName?.[0] ?? ''}`.toUpperCase();
}

// ─── Sub-components ──────────────────────────────────────────────

const SkeletonRow: React.FC = () => (
  <TableRow>
    {[140, 100, 120, 160, 90, 60].map((w, i) => (
      <TableCell key={i}>
        <Skeleton className={`h-4 w-${w === 60 ? '16' : w < 110 ? '24' : w < 130 ? '28' : '32'}`} />
      </TableCell>
    ))}
  </TableRow>
);

interface MetadataCellProps {
  metadata: Record<string, any>;
}

const MetadataCell: React.FC<MetadataCellProps> = ({ metadata }) => {
  const [expanded, setExpanded] = useState(false);
  const keys = Object.keys(metadata);

  if (keys.length === 0) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {keys.length} field{keys.length !== 1 ? 's' : ''}
      </button>
      {expanded && (
        <pre className="mt-2 text-[10px] bg-muted/60 border border-border/50 rounded-md p-2 max-h-36 overflow-auto font-mono leading-relaxed text-foreground/80">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────

interface FilterState {
  action: AuditAction | '';
  entityType: string;
  startDate: string;
  endDate: string;
  search: string;
}

const EMPTY_FILTERS: FilterState = {
  action: '',
  entityType: '',
  startDate: '',
  endDate: '',
  search: '',
};

const ActivityLogsTab: React.FC = () => {
  const { showToast } = useToast();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search input
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const handleSearchChange = (value: string) => {
    setFilters((f) => ({ ...f, search: value }));
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  };

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const query: AuditEventQuery = {
        page,
        limit: PAGE_SIZE,
        ...(filters.action && { action: filters.action }),
        ...(filters.entityType && { entityType: filters.entityType }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(debouncedSearch && { search: debouncedSearch }),
      };
      const result = await auditEventsService.getAll(query);
      setEvents(result.data);
      setTotal(result.total);
      setLastFetched(new Date());
    } catch {
      showToast('Failed to load activity logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, filters.action, filters.entityType, filters.startDate, filters.endDate, debouncedSearch]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setDebouncedSearch('');
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  const handleExport = async () => {
    setExporting(true);
    try {
      const query: AuditEventQuery = {
        ...(filters.action && { action: filters.action }),
        ...(filters.entityType && { entityType: filters.entityType }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(debouncedSearch && { search: debouncedSearch }),
      };
      await auditEventsService.exportCsv(query, 'activity-logs.csv');
      showToast('CSV exported successfully', 'success');
    } catch {
      showToast('Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        {/* Top Row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by actor name or email..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters || hasActiveFilters ? 'border-primary text-primary' : ''}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                {Object.values(filters).filter((v) => v !== '').length}
              </span>
            )}
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2">
            {lastFetched && (
              <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Updated {formatTimestamp(lastFetched.toISOString()).relative}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchEvents}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting || loading}
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </div>

        {/* Expanded Filter Row */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-dashed">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Action</label>
              <Select
                value={filters.action || 'all'}
                onValueChange={(v) => handleFilterChange('action', v === 'all' ? '' : v)}
              >
                <SelectTrigger className="h-8 w-[160px]"><SelectValue placeholder="All Actions" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {AUDIT_ACTIONS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Entity</label>
              <Select
                value={filters.entityType || 'all'}
                onValueChange={(v) => handleFilterChange('entityType', v === 'all' ? '' : v)}
              >
                <SelectTrigger className="h-8 w-[170px]"><SelectValue placeholder="All Entities" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {ENTITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="h-8 w-auto"
              />
              <span className="text-muted-foreground text-sm">—</span>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="h-8 w-auto"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Bar */}
      {!loading && (
        <div className="px-4 py-2 rounded-md bg-muted/30 border text-xs text-muted-foreground flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5" />
          {total === 0 ? 'No activity records found' : (
            <>
              Showing <span className="font-medium text-foreground">
                {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)}
              </span> of <span className="font-medium text-foreground">{total.toLocaleString()}</span> events
            </>
          )}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <ActivityRow key={event.id} event={event} />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && total > PAGE_SIZE && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={total}
          pageSize={PAGE_SIZE}
        />
      )}
    </div>
  );
};

// ─── Activity Row ─────────────────────────────────────────────────

const ActivityRow: React.FC<{ event: AuditEvent }> = ({ event }) => {
  const { full, relative } = formatTimestamp(event.createdAt);
  const actionCfg = ACTION_CONFIG[event.action] ?? { variant: 'muted' as BadgeVariant, label: event.action };
  const initials = getActorInitials(event.actor);
  const actorName = event.actor
    ? `${event.actor.firstName} ${event.actor.lastName}`
    : 'System';

  const entityLabel = event.entityType.replace(/_/g, ' ');

  return (
    <TableRow>
      {/* Timestamp */}
      <TableCell className="whitespace-nowrap">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-foreground">{relative}</span>
          <span className="text-[10px] text-muted-foreground font-mono">{full}</span>
        </div>
      </TableCell>

      {/* Action */}
      <TableCell>
        <Badge variant={actionCfg.variant} className="whitespace-nowrap capitalize">
          {actionCfg.label}
        </Badge>
      </TableCell>

      {/* Entity */}
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium capitalize text-foreground">{entityLabel}</span>
          {event.entityId && (
            <span className="text-[10px] text-muted-foreground font-mono">#{event.entityId}</span>
          )}
        </div>
      </TableCell>

      {/* Actor */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6 flex-shrink-0">
            <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xs font-medium text-foreground truncate">{actorName}</span>
            {event.actor?.email && (
              <span className="text-[10px] text-muted-foreground truncate">{event.actor.email}</span>
            )}
          </div>
        </div>
      </TableCell>

      {/* IP Address */}
      <TableCell>
        {event.ipAddress ? (
          <span className="text-xs font-mono text-muted-foreground">{event.ipAddress}</span>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </TableCell>

      {/* Metadata */}
      <TableCell className="max-w-[200px]">
        <MetadataCell metadata={event.metadata} />
      </TableCell>
    </TableRow>
  );
};

// ─── Empty State ──────────────────────────────────────────────────

const EmptyState: React.FC<{ hasFilters: boolean; onClear: () => void }> = ({
  hasFilters,
  onClear,
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
      {hasFilters ? (
        <AlertCircle className="h-7 w-7 text-muted-foreground" />
      ) : (
        <Activity className="h-7 w-7 text-muted-foreground" />
      )}
    </div>
    <p className="text-sm font-medium text-foreground mb-1">
      {hasFilters ? 'No matching events' : 'No activity yet'}
    </p>
    <p className="text-xs text-muted-foreground max-w-xs">
      {hasFilters
        ? 'Try adjusting your filters or clearing them to see all events.'
        : 'User actions across the system will appear here as they happen.'}
    </p>
    {hasFilters && (
      <Button variant="outline" size="sm" className="mt-4" onClick={onClear}>
        <X className="h-4 w-4 mr-2" />
        Clear Filters
      </Button>
    )}
  </div>
);

export default ActivityLogsTab;
