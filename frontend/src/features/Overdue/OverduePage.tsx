import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { assignmentsService, Assignment } from '../../services/assignmentsService';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

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
    <div className="space-y-6">
      <PageHeader title="Overdue Items" description={`${total} items past their due date`}>
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Asset Tag</TableHead>
                <TableHead className="text-right">Qty Out</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right text-red-700">Days Overdue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-green-600 font-medium">No overdue items!</TableCell></TableRow>
              ) : items.map((a) => (
                <TableRow key={a.id} className="hover:bg-red-50/50">
                  <TableCell>{a.assignee?.firstName} {a.assignee?.lastName}</TableCell>
                  <TableCell>{a.catalogItem?.name}</TableCell>
                  <TableCell className="font-mono">{a.assetUnit?.assetTag || '—'}</TableCell>
                  <TableCell className="text-right font-bold">{a.quantity - a.returnedQuantity}</TableCell>
                  <TableCell>{new Date(a.dueDate!).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right font-bold text-red-600">
                    {daysOverdue(a.dueDate!)} days
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/40">
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OverduePage;
