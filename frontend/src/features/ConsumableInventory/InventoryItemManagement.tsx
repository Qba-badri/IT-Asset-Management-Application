import React, { useState, useEffect } from "react";
import {
    Package,
    Plus,
    History,
    ShoppingCart,
    UserPlus,
    RefreshCcw,
    AlertTriangle,
    Info
} from "lucide-react";
import { Button } from "../../components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "../../components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { inventoryService, InventoryItem, InventoryCategory } from "../../services/consumableInventoryService";
import { useToast } from "../../context/ToastContext";

export default function ConsumableItemManagement() {
    const { showToast } = useToast();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [categories, setCategories] = useState<InventoryCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // New Item State
    const [newItem, setNewItem] = useState({
        name: "",
        categoryId: "",
        isRefundable: false,
        minStockLevel: 5,
        status: "active"
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [fetchedItems, fetchedCategories] = await Promise.all([
                inventoryService.getItems(),
                inventoryService.getCategories()
            ]);
            setItems(fetchedItems || []);
            setCategories(fetchedCategories || []);
        } catch (error: any) {
            console.error("Failed to load inventory data", error);

            // Provide specific error messages based on status code
            if (error.response?.status === 401) {
                showToast("Session expired. Please login again.", "warning");
            } else if (error.response?.status === 403) {
                showToast("You don't have permission to view inventory. Contact your administrator.", "error");
            } else if (error.response?.status === 404) {
                showToast("Inventory API not found. Please contact support.", "error");
            } else if (error.response?.status === 500) {
                showToast("Server error. Please try again later.", "error");
            } else {
                const message = error.response?.data?.message || error.message || "Unknown error";
                showToast(`Failed to load inventory data: ${message}`, "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateItem = async () => {
        try {
            if (!newItem.name || !newItem.categoryId) {
                showToast("Please fill in all required fields", "warning");
                return;
            }
            await inventoryService.createItem({
                ...newItem,
                categoryId: parseInt(newItem.categoryId)
            });
            showToast("Item created successfully", "success");
            setIsAdding(false);
            setNewItem({ name: "", categoryId: "", isRefundable: false, minStockLevel: 5, status: "active" });
            loadData();
        } catch (error) {
            showToast("Failed to create item", "error");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Inventory Master</h2>
                    <p className="text-muted-foreground">Manage small IT items and inventory.</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isAdding} onOpenChange={setIsAdding}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add New Item
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Inventory Item</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Item Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Wireless Mouse"
                                        value={newItem.name}
                                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="category">Category</Label>
                                    <select
                                        id="category"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={newItem.categoryId}
                                        onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center space-x-2 py-2">
                                    <Switch
                                        id="refundable"
                                        checked={newItem.isRefundable}
                                        onCheckedChange={(checked) => setNewItem({ ...newItem, isRefundable: !!checked })}
                                    />
                                    <Label htmlFor="refundable">Refundable (Must be returned?)</Label>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="minStock">Minimum Stock Level</Label>
                                    <Input
                                        id="minStock"
                                        type="number"
                                        value={newItem.minStockLevel}
                                        onChange={(e) => setNewItem({ ...newItem, minStockLevel: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                                <Button onClick={handleCreateItem}>Create Item</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Available / Total</TableHead>
                                <TableHead>Refundable</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">Loading...</TableCell>
                                </TableRow>
                            ) : items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">No items found.</TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.category?.name}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className={item.availableStock <= item.minStockLevel ? "text-destructive font-bold" : ""}>
                                                    {item.availableStock}
                                                </span>
                                                <span className="text-muted-foreground">/</span>
                                                <span>{item.totalStock}</span>
                                                {item.availableStock <= item.minStockLevel && (
                                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={item.isRefundable ? "default" : "secondary"}>
                                                {item.isRefundable ? "Yes" : "No"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={item.status === "active" ? "outline" : "destructive"}>
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={async () => {
                                                    try {
                                                        const itemDetails = await inventoryService.getItem(item.id);
                                                        // Show details in a simple alert for now
                                                        // TODO: Create a proper modal or detail page
                                                        alert(`Item: ${itemDetails.name}\nCategory: ${itemDetails.category?.name}\nTotal Stock: ${itemDetails.totalStock}\nAvailable: ${itemDetails.availableStock}\nMin Level: ${itemDetails.minStockLevel}\nRefundable: ${itemDetails.isRefundable ? 'Yes' : 'No'}`);
                                                    } catch (error) {
                                                        showToast("Failed to load item details", "error");
                                                    }
                                                }}
                                            >
                                                Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
