import React, { useState, useEffect } from "react";
import {
    Package,
    ShoppingCart,
    UserPlus,
    AlertCircle,
    RotateCcw,
    CheckCircle2,
    TrendingUp
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../../components/ui/card";
import { inventoryService, DashboardStats } from "../../services/consumableInventoryService";

export default function ConsumableDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await inventoryService.getDashboardStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to load dashboard stats", error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: "Total Items",
            value: stats?.totalItems || 0,
            icon: Package,
            description: "Unique catalog items",
            color: "text-blue-600",
            bg: "bg-blue-100"
        },
        {
            title: "Total Stock",
            value: stats?.totalStock || 0,
            icon: TrendingUp,
            description: "Aggregate units in hand",
            color: "text-green-600",
            bg: "bg-green-100"
        },
        {
            title: "Low Stock Alert",
            value: stats?.lowStockAlert || 0,
            icon: AlertCircle,
            description: "Items needing restock",
            color: "text-red-600",
            bg: "bg-red-100"
        },
        {
            title: "Assigned Items",
            value: stats?.assignedItems || 0,
            icon: UserPlus,
            description: "Units currently with users",
            color: "text-purple-600",
            bg: "bg-purple-100"
        },
        {
            title: "Pending Returns",
            value: stats?.pendingReturns || 0,
            icon: RotateCcw,
            description: "Refundable issued items",
            color: "text-orange-600",
            bg: "bg-orange-100"
        },
        {
            title: "Refundable Items",
            value: stats?.refundableItemsCount || 0,
            icon: CheckCircle2,
            description: "Returnable catalog items",
            color: "text-cyan-600",
            bg: "bg-cyan-100"
        }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Inventory Dashboard</h2>
                <p className="text-muted-foreground">Snapshot of small IT inventory and item usage.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {statCards.map((card, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {card.title}
                            </CardTitle>
                            <div className={`${card.bg} p-2 rounded-full`}>
                                <card.icon className={`h-4 w-4 ${card.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {loading ? "..." : card.value}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {card.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Placeholder for charts or recent activity */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Inventory Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center border-dashed border-2 m-4 rounded-lg">
                        <p className="text-muted-foreground">Stock Level Chart Visualization Placeholder</p>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Movement</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center border-dashed border-2 m-4 rounded-lg">
                        <p className="text-muted-foreground">Activity Feed Placeholder</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
