import React, { useState, useEffect, useCallback } from 'react';
import {
  Search
} from 'lucide-react';
import { reportsService, AssetHistory, DashboardSummary } from '../../services/reportsService';
import { StockLedgerEntry } from '../../services/stockService';
import { Assignment } from '../../services/assignmentsService';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/shared/PageHeader';
import { Pagination } from '../../components/shared/Pagination';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { cn } from '../../lib/utils';

type Tab = 'dashboard' | 'ledger' | 'writeoffs' | 'asset-history';

const ReportsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Asset, ledger and audit reports" />
      <div className="flex border-b">
        {([
          { key: 'dashboard', label: 'Dashboard Summary' },
          { key: 'ledger', label: 'Ledger Report' },
          { key: 'writeoffs', label: 'Write-Offs' },
          { key: 'asset-history', label: 'Asset History' },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'ledger' && <LedgerTab />}
      {tab === 'writeoffs' && <WriteOffsTab />}
      {tab === 'asset-history' && <AssetHistoryTab />}
    </div>
  );
};

/* ── Dashboard Summary ──────────────────────────── */
const DashboardTab: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  useEffect(() => { reportsService.getDashboardSummary().then(setData).catch(() => {}); }, []);
  if (!data) return <p className="text-center py-12 text-muted-foreground">Loading...</p>;
  const cards = [
    { label: 'Total Asset Units', value: data.totalAssetUnits, color: 'blue' },
    { label: 'Active Assignments', value: data.activeAssignments, color: 'green' },
    { label: 'Overdue Assignments', value: data.overdueAssignments, color: 'red' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className={`text-3xl font-bold text-${c.color}-600 mt-1`}>{c.value ?? '—'}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/* ── Ledger Report ──────────────────────────────── */
const LedgerTab: React.FC = () => {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<StockLedgerEntry[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pageSize, setPageSize] = useState(50);

  const fetch = useCallback(async () => {
    try {
      const q: any = { page, limit: pageSize };
      if (reason) q.reason = reason;
      if (startDate) q.startDate = startDate;
      if (endDate) q.endDate = endDate;
      const r = await reportsService.getLedgerReport(q);
      setEntries(r.data);
      setTotal(r.total);
    } catch { showToast('Failed to load ledger', 'error'); }
  }, [page, pageSize, reason, startDate, endDate]);

  useEffect(() => { fetch(); }, [fetch]);
  const totalPages = Math.ceil(total / pageSize);

  const reasonOptions = ['initial_stock','procurement','issue','return','transfer_in','transfer_out','adjustment','write_off','lost','disposed'];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select value={reason || 'all'} onValueChange={(v) => { setReason(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Reasons" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reasons</SelectItem>
            {reasonOptions.map((r) => (
              <SelectItem key={r} value={r}>{r.replace(/_/g,' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="w-auto" />
        <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="w-auto" />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No ledger entries</TableCell></TableRow>
              ) : entries.map((e: any) => (
                <TableRow key={e.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{e.catalogItem?.name ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{e.location?.name ?? '—'}</TableCell>
                  <TableCell><span className="bg-muted text-foreground rounded px-2 py-0.5 text-xs">{e.reason?.replace(/_/g,' ')}</span></TableCell>
                  <TableCell className={`text-right font-mono font-medium ${e.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {e.quantityChange > 0 ? '+' : ''}{e.quantityChange}
                  </TableCell>
                  <TableCell className="text-right font-mono">{e.runningBalance}</TableCell>
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

/* ── Write-Offs ─────────────────────────────────── */
const WriteOffsTab: React.FC = () => {
  const [entries, setEntries] = useState<Assignment[]>([]);
  useEffect(() => { reportsService.getWriteOffsReport({ limit: 200 }).then((r) => setEntries(r.data)).catch(() => {}); }, []);
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Qty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">No write-offs</TableCell></TableRow>
            ) : entries.map((e: any, i: number) => (
              <TableRow key={i}>
                <TableCell className="text-muted-foreground whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</TableCell>
                <TableCell className="font-medium">{e.catalogItem?.name ?? '—'}</TableCell>
                <TableCell>{e.reason?.replace(/_/g, ' ')}</TableCell>
                <TableCell className="text-right font-mono">{Math.abs(e.quantityChange)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

/* ── Per-Asset History ──────────────────────────── */
const AssetHistoryTab: React.FC = () => {
  const { showToast } = useToast();
  const [assetId, setAssetId] = useState('');
  const [history, setHistory] = useState<AssetHistory | null>(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!assetId) return;
    setLoading(true);
    try {
      const r = await reportsService.getAssetHistory(Number(assetId));
      setHistory(r);
    } catch { showToast('Failed to load asset history', 'error'); }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input value={assetId} onChange={(e) => setAssetId(e.target.value)} placeholder="Enter Asset Unit ID"
            className="pl-9" onKeyDown={(e) => e.key === 'Enter' && search()} />
        </div>
        <Button onClick={search} disabled={loading}>
          {loading ? 'Loading...' : 'Search'}
        </Button>
      </div>
      {history && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium text-foreground">Asset: {history.unit?.assetTag ?? 'N/A'}</h3>
              <p className="text-sm text-muted-foreground">Serial: {history.unit?.serialNumber ?? '—'} · Status: {history.unit?.status ?? '—'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.events.map((e: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{e.action?.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{e.actor ? `${e.actor.firstName} ${e.actor.lastName}` : 'System'}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{JSON.stringify(e.metadata)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
