import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  User, AlertTriangle
} from 'lucide-react';
import { assignmentsService, Assignment, HoldingsQuery } from '../../services/assignmentsService';
import { useToast } from '../../context/ToastContext';
import { Pagination } from '../../components/shared/Pagination';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';

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

  const statusVariant = (status: string): 'info' | 'warning' | 'destructive' | 'muted' => {
    if (status === 'active') return 'info';
    if (status === 'partially_returned') return 'warning';
    if (status === 'overdue') return 'destructive';
    return 'muted';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={employeeId ? `Employee #${employeeId} Holdings` : 'All Holdings'}
        description={`${total} active assignments`}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Asset Tag</TableHead>
                <TableHead className="text-right">Qty Held</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issued</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : holdings.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No holdings</TableCell></TableRow>
              ) : holdings.map((h) => {
                const remaining = h.quantity - h.returnedQuantity;
                const isOverdue = h.dueDate && new Date(h.dueDate) < new Date();
                return (
                  <TableRow key={h.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        {h.assignee?.firstName} {h.assignee?.lastName}
                      </div>
                    </TableCell>
                    <TableCell>{h.catalogItem?.name}</TableCell>
                    <TableCell className="font-mono">{h.assetUnit?.assetTag || '—'}</TableCell>
                    <TableCell className="text-right font-bold">{remaining}</TableCell>
                    <TableCell>
                      {h.dueDate ? (
                        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                          {isOverdue && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                          {new Date(h.dueDate).toLocaleDateString()}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(h.status)}>{h.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(h.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={total}
            pageSize={pageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default HoldingsPage;
