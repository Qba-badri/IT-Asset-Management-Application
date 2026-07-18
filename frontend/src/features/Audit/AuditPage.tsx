import React, { useState, useEffect, useCallback } from 'react';
import { auditEventsService, AuditEvent, AuditAction, AuditEventQuery } from '../../services/auditEventsService';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/shared/PageHeader';
import { Pagination } from '../../components/shared/Pagination';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

const AuditPage: React.FC = () => {
  const { showToast } = useToast();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState<AuditAction | ''>('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pageSize, setPageSize] = useState(50);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const query: AuditEventQuery = { page, limit: pageSize };
      if (actionFilter) query.action = actionFilter;
      if (entityTypeFilter) query.entityType = entityTypeFilter;
      if (startDate) query.startDate = startDate;
      if (endDate) query.endDate = endDate;
      const result = await auditEventsService.getAll(query);
      setEvents(result.data);
      setTotal(result.total);
    } catch {
      showToast('Failed to load audit events', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, actionFilter, entityTypeFilter, startDate, endDate]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  const totalPages = Math.ceil(total / pageSize);

  const actionColors: Partial<Record<AuditAction, string>> = {
    issue: 'bg-blue-100 text-blue-800',
    return: 'bg-green-100 text-green-800',
    partial_return: 'bg-yellow-100 text-yellow-800',
    transfer: 'bg-purple-100 text-purple-800',
    lost: 'bg-red-100 text-red-800',
    write_off: 'bg-gray-100 text-gray-800',
    adjust: 'bg-cyan-100 text-cyan-800',
    create: 'bg-indigo-100 text-indigo-800',
    update: 'bg-teal-100 text-teal-800',
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Trail" description={`${total} events`} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={actionFilter || 'all'} onValueChange={(v) => { setActionFilter(v === 'all' ? '' : (v as AuditAction)); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Actions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {['issue', 'return', 'partial_return', 'transfer', 'lost', 'write_off', 'adjust', 'create', 'update', 'delete', 'dispose'].map((a) => (
              <SelectItem key={a} value={a}>{a.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={entityTypeFilter || 'all'} onValueChange={(v) => { setEntityTypeFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Entities" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {['assignment', 'asset_unit', 'stock', 'catalog_item', 'return_transaction', 'user'].map((t) => (
              <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="w-auto" />
        <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="w-auto" />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : events.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No events</TableCell></TableRow>
              ) : events.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(e.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionColors[e.action] || 'bg-muted text-foreground'}`}>
                      {e.action.replace(/_/g, ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{e.entityType}</span>
                    {e.entityId && <span className="text-muted-foreground/70 ml-1">#{e.entityId}</span>}
                  </TableCell>
                  <TableCell>
                    {e.actor ? `${e.actor.firstName} ${e.actor.lastName}` : 'System'}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <details>
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                        {Object.keys(e.metadata).length} fields
                      </summary>
                      <pre className="text-xs bg-muted/40 p-2 rounded mt-1 max-h-40 overflow-auto">
                        {JSON.stringify(e.metadata, null, 2)}
                      </pre>
                    </details>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={total}
            pageSize={pageSize}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditPage;
