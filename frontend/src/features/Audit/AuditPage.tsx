import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Filter, ChevronLeft, ChevronRight, User, Calendar
} from 'lucide-react';
import { auditEventsService, AuditEvent, AuditAction, AuditEventQuery } from '../../services/auditEventsService';
import { useToast } from '../../context/ToastContext';

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
  const pageSize = 50;

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
  }, [page, actionFilter, entityTypeFilter, startDate, endDate]);

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
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-sm text-gray-500">{total} events</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value as any); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Actions</option>
          {['issue', 'return', 'partial_return', 'transfer', 'lost', 'write_off', 'adjust', 'create', 'update', 'delete', 'dispose'].map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select value={entityTypeFilter} onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Entities</option>
          {['assignment', 'asset_unit', 'stock', 'catalog_item', 'return_transaction', 'user'].map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm" />
        <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Timestamp</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Entity</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Actor</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No events</td></tr>
            ) : events.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {new Date(e.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionColors[e.action] || 'bg-gray-100 text-gray-700'}`}>
                    {e.action.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-600">{e.entityType}</span>
                  {e.entityId && <span className="text-gray-400 ml-1">#{e.entityId}</span>}
                </td>
                <td className="px-4 py-3">
                  {e.actor ? `${e.actor.firstName} ${e.actor.lastName}` : 'System'}
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <details>
                    <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                      {Object.keys(e.metadata).length} fields
                    </summary>
                    <pre className="text-xs bg-gray-50 p-2 rounded mt-1 max-h-40 overflow-auto">
                      {JSON.stringify(e.metadata, null, 2)}
                    </pre>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
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

export default AuditPage;
