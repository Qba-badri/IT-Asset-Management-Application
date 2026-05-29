import React, { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { inventoryService, InventoryTransaction } from "../../services/consumableInventoryService";
import { useToast } from "../../context/ToastContext";
import { History, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";

export default function InventoryLedger() {
    const { showToast } = useToast();
    const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            const data = await inventoryService.getTransactions();
            setTransactions(data);
        } catch (error) {
            console.error("Failed to load inventory transactions", error);
            showToast("Failed to load audit ledger", "error");
        } finally {
            setLoading(false);
        }
    };

    const getTransactionBadge = (type: string) => {
        switch (type) {
            case 'IN': return <Badge className="bg-green-100 text-green-800"><ArrowUpRight className="w-3 h-3 mr-1" /> Purchase</Badge>;
            case 'OUT': return <Badge className="bg-blue-100 text-blue-800"><ArrowDownRight className="w-3 h-3 mr-1" /> Issue</Badge>;
            case 'RETURN': return <Badge className="bg-purple-100 text-purple-800"><RefreshCw className="w-3 h-3 mr-1" /> Return</Badge>;
            case 'ADJUSTMENT': return <Badge variant="outline">Adjustment</Badge>;
            default: return <Badge variant="secondary">{type}</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Stock Ledger
                </CardTitle>
                <CardDescription>Traceable history of all inventory movements and stock changes.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead>Performed By</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead>Notes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10">Loading transactions...</TableCell>
                            </TableRow>
                        ) : transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10">No transactions recorded yet.</TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(tx.transactionDate).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="font-medium">{tx.item?.name}</TableCell>
                                    <TableCell>{getTransactionBadge(tx.type)}</TableCell>
                                    <TableCell className={`text-right font-bold ${tx.type === 'IN' || tx.type === 'RETURN' ? 'text-green-600' : 'text-blue-600'}`}>
                                        {tx.type === 'IN' || tx.type === 'RETURN' ? '+' : '-'}{tx.quantity}
                                    </TableCell>
                                    <TableCell>{tx.performedBy ? `${tx.performedBy.firstName} ${tx.performedBy.lastName}` : 'System'}</TableCell>
                                    <TableCell className="text-xs font-mono text-muted-foreground uppercase">
                                        {tx.referenceType} #{tx.referenceId}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground" title={tx.notes}>
                                        {tx.notes}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
