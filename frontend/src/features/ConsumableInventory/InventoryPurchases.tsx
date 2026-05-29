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
import { inventoryService, InventoryPurchase } from "../../services/consumableInventoryService";
import { useToast } from "../../context/ToastContext";
import { ShoppingCart, ExternalLink } from "lucide-react";

export default function InventoryPurchases() {
    const { showToast } = useToast();
    const [purchases, setPurchases] = useState<InventoryPurchase[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPurchases();
    }, []);

    const loadPurchases = async () => {
        try {
            setLoading(true);
            const data = await inventoryService.getPurchases();
            setPurchases(data || []);
        } catch (error: any) {
            console.error("Failed to load purchases", error);

            if (error.response?.status === 401) {
                showToast("Session expired. Please login again.", "warning");
            } else if (error.response?.status === 403) {
                showToast("You don't have permission to view purchase history.", "error");
            } else {
                const message = error.response?.data?.message || error.message || "Unknown error";
                showToast(`Failed to load purchase history: ${message}`, "error");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    Purchase History
                </CardTitle>
                <CardDescription>Log of all incoming stock from vendors.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Unit Cost</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Invoice</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10">Loading purchases...</TableCell>
                            </TableRow>
                        ) : purchases.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10">No purchases found.</TableCell>
                            </TableRow>
                        ) : (
                            purchases.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="text-xs">
                                        {new Date(p.purchaseDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="font-medium">{p.vendorName}</TableCell>
                                    <TableCell>{p.item?.name}</TableCell>
                                    <TableCell className="text-right">{p.quantity}</TableCell>
                                    <TableCell className="text-right">${p.unitCost.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-semibold">${p.totalCost.toFixed(2)}</TableCell>
                                    <TableCell className="text-xs">
                                        {p.invoiceNumber ? (
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                {p.invoiceNumber}
                                                <ExternalLink className="h-3 w-3" />
                                            </span>
                                        ) : '—'}
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
