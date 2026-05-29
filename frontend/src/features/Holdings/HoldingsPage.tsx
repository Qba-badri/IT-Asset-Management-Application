import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  User, Package, Clock, AlertTriangle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { assignmentsService, Assignment, HoldingsQuery } from '../../services/assignmentsService';
import { useToast } from '../../context/ToastContext';
import { Pagination } from '../../components/shared/Pagination';

/**
 * HoldingsPage — Shows who has what now.
 * Can be filtered by employee (via route param or query).
 */
const HoldingsPage: React.FC = () => {
  const { id: employeeId } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [holdings, setHoldings] = useState<Assignment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 25;

  const fetchHoldings = useCallback(async () => {
    setLoading(true);
    try {
      const query: HoldingsQuery = { page, limit: pageSize };
      if (employeeId) query.assigneeId = Number(employeeId);
      const result = await assignmentsService.getHoldings(query);
      setHoldings(result.data);
      setTotal(result.total);
    } catch {
      showToast('Failed to load holdings', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, employeeId]);

  useEffect(() => { fetchHoldings(); }, [fetchHoldings]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {employeeId ? `Employee #${employeeId} Holdings` : 'All Holdings'}
      </h1>
      <p className="text-sm text-gray-500 mb-6">{total} active assignments</p>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Employee</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Item</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Asset Tag</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Qty Held</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Due Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Issued</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
            ) : holdings.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No holdings</td></tr>
            ) : holdings.map((h) => {
              const remaining = h.quantity - h.returnedQuantity;
              const isOverdue = h.dueDate && new Date(h.dueDate) < new Date();
              return (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {h.assignee?.firstName} {h.assignee?.lastName}
                    </div>
                  </td>
                  <td className="px-4 py-3">{h.catalogItem?.name}</td>
                  <td className="px-4 py-3 font-mono">{h.assetUnit?.assetTag || '—'}</td>
                  <td className="px-4 py-3 text-right font-bold">{remaining}</td>
                  <td className="px-4 py-3">
                    {h.dueDate ? (
                      <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                        {isOverdue && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                        {new Date(h.dueDate).toLocaleDateString()}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${h.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        h.status === 'partially_returned' ? 'bg-yellow-100 text-yellow-800' :
                          h.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                      }`}>{h.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{new Date(h.createdAt).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={total}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
};

export default HoldingsPage;
