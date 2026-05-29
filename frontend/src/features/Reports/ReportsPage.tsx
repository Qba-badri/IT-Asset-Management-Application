import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Download, Search, ChevronLeft, ChevronRight, FileText, AlertTriangle, Cpu
} from 'lucide-react';
import { reportsService, AssetHistory, DashboardSummary } from '../../services/reportsService';
import { StockLedgerEntry } from '../../services/stockService';
import { Assignment } from '../../services/assignmentsService';
import { AuditEvent } from '../../services/auditEventsService';
import { useToast } from '../../context/ToastContext';

type Tab = 'dashboard' | 'ledger' | 'writeoffs' | 'asset-history';

const ReportsPage: React.FC = () => {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      </div>
      <div className="flex border-b mb-6">
        {([
          { key: 'dashboard', label: 'Dashboard Summary' },
          { key: 'ledger', label: 'Ledger Report' },
          { key: 'writeoffs', label: 'Write-Offs' },
          { key: 'asset-history', label: 'Asset History' },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px
              ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
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
  if (!data) return <p className="text-center py-12 text-gray-400">Loading...</p>;
  const cards = [
    { label: 'Total Asset Units', value: data.totalAssetUnits, color: 'blue' },
    { label: 'Active Assignments', value: data.activeAssignments, color: 'green' },
    { label: 'Overdue Assignments', value: data.overdueAssignments, color: 'red' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((c) => (
        <div key={c.label} className={`bg-white rounded-lg border p-5`}>
          <p className="text-sm text-gray-500">{c.label}</p>
          <p className={`text-3xl font-bold text-${c.color}-600 mt-1`}>{c.value ?? '—'}</p>
        </div>
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
  const pageSize = 50;

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
  }, [page, reason, startDate, endDate]);

  useEffect(() => { fetch(); }, [fetch]);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={reason} onChange={(e) => { setReason(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Reasons</option>
          {['initial_stock','procurement','issue','return','transfer_in','transfer_out','adjustment','write_off','lost','disposed'].map((r) => (
            <option key={r} value={r}>{r.replace(/_/g,' ')}</option>
          ))}
        </select>
        <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm" />
        <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm" />
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Item</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Location</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Reason</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Change</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No ledger entries</td></tr>
            ) : entries.map((e: any) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 font-medium">{e.catalogItem?.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{e.location?.name ?? '—'}</td>
                <td className="px-4 py-3"><span className="bg-gray-100 text-gray-700 rounded px-2 py-0.5 text-xs">{e.reason?.replace(/_/g,' ')}</span></td>
                <td className={`px-4 py-3 text-right font-mono font-medium ${e.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {e.quantityChange > 0 ? '+' : ''}{e.quantityChange}
                </td>
                <td className="px-4 py-3 text-right font-mono">{e.runningBalance}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <span className="text-sm text-gray-600">Page {page} / {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Write-Offs ─────────────────────────────────── */
const WriteOffsTab: React.FC = () => {
  const [entries, setEntries] = useState<Assignment[]>([]);
  useEffect(() => { reportsService.getWriteOffsReport({ limit: 200 }).then((r) => setEntries(r.data)).catch(() => {}); }, []);
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Item</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Reason</th>
            <th className="px-4 py-3 text-right font-medium text-gray-600">Qty</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {entries.length === 0 ? (
            <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-400">No write-offs</td></tr>
          ) : entries.map((e: any, i: number) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</td>
              <td className="px-4 py-3 font-medium">{e.catalogItem?.name ?? '—'}</td>
              <td className="px-4 py-3">{e.reason?.replace(/_/g, ' ')}</td>
              <td className="px-4 py-3 text-right font-mono">{Math.abs(e.quantityChange)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
    <div>
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input value={assetId} onChange={(e) => setAssetId(e.target.value)} placeholder="Enter Asset Unit ID"
            className="pl-9 pr-3 py-2 border rounded-lg text-sm w-full" onKeyDown={(e) => e.key === 'Enter' && search()} />
        </div>
        <button onClick={search} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Loading...' : 'Search'}
        </button>
      </div>
      {history && (
        <div>
          <div className="bg-white rounded-lg border p-4 mb-4">
            <h3 className="font-medium text-gray-900">Asset: {history.unit?.assetTag ?? 'N/A'}</h3>
            <p className="text-sm text-gray-500">Serial: {history.unit?.serialNumber ?? '—'} · Status: {history.unit?.status ?? '—'}</p>
          </div>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Actor</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.events.map((e: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{e.action?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">{e.actor ? `${e.actor.firstName} ${e.actor.lastName}` : 'System'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{JSON.stringify(e.metadata)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
