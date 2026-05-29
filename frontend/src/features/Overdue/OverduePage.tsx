import React, { useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { assignmentsService, Assignment, OverdueQuery } from '../../services/assignmentsService';
import { useToast } from '../../context/ToastContext';

const OverduePage: React.FC = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState<Assignment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 25;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await assignmentsService.getOverdue({ page, limit: pageSize });
      setItems(result.data);
      setTotal(result.total);
    } catch {
      showToast('Failed to load overdue items', 'error');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);
  const totalPages = Math.ceil(total / pageSize);

  const daysOverdue = (dueDate: string) => {
    const diff = Date.now() - new Date(dueDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-6 h-6 text-red-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overdue Items</h1>
          <p className="text-sm text-red-600">{total} items past their due date</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-red-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Employee</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Item</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Asset Tag</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Qty Out</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Due Date</th>
              <th className="px-4 py-3 text-right font-medium text-red-700">Days Overdue</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-green-600 font-medium">No overdue items!</td></tr>
            ) : items.map((a) => (
              <tr key={a.id} className="hover:bg-red-50/50">
                <td className="px-4 py-3">{a.assignee?.firstName} {a.assignee?.lastName}</td>
                <td className="px-4 py-3">{a.catalogItem?.name}</td>
                <td className="px-4 py-3 font-mono">{a.assetUnit?.assetTag || '—'}</td>
                <td className="px-4 py-3 text-right font-bold">{a.quantity - a.returnedQuantity}</td>
                <td className="px-4 py-3">{new Date(a.dueDate!).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right font-bold text-red-600">
                  {daysOverdue(a.dueDate!)} days
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

export default OverduePage;
