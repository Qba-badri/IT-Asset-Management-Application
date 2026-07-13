import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { inventoryService } from "../../services/consumableInventoryService";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

export default function InventoryDebug() {
    const [status, setStatus] = useState<any>({});
    const [loading, setLoading] = useState(false);

    const testEndpoint = async (name: string, fn: () => Promise<any>) => {
        try {
            setLoading(true);
            const result = await fn();
            setStatus((prev: any) => ({
                ...prev,
                [name]: { success: true, data: result, error: null }
            }));
        } catch (error: any) {
            setStatus((prev: any) => ({
                ...prev,
                [name]: {
                    success: false,
                    data: null,
                    error: error.response?.data?.message || error.message
                }
            }));
        } finally {
            setLoading(false);
        }
    };

    const runAllTests = async () => {
        setStatus({});
        await testEndpoint("Dashboard Stats", () => inventoryService.getDashboardStats());
        await testEndpoint("Categories", () => inventoryService.getCategories());
        await testEndpoint("Items", () => inventoryService.getItems());
        await testEndpoint("Purchases", () => inventoryService.getPurchases());
        await testEndpoint("Assignments", () => inventoryService.getAssignments());
        await testEndpoint("Transactions", () => inventoryService.getTransactions());
    };

    useEffect(() => {
        runAllTests();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold">Inventory API Debug</h2>
                    <p className="text-muted-foreground">Testing all inventory endpoints</p>
                </div>
                <Button onClick={runAllTests} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Retest All
                </Button>
            </div>

            <div className="grid gap-4">
                {Object.entries(status).map(([name, result]: [string, any]) => (
                    <Card key={name}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {result.success ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                )}
                                {name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {result.success ? (
                                <div>
                                    <p className="text-sm text-green-600 font-semibold mb-2">✓ Success</p>
                                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                                        {JSON.stringify(result.data, null, 2)}
                                    </pre>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm text-red-600 font-semibold mb-2">✗ Failed</p>
                                    <p className="text-sm bg-red-50 p-3 rounded border border-red-200">
                                        {result.error}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {Object.keys(status).length === 0 && !loading && (
                <Card>
                    <CardContent className="py-10 text-center text-muted-foreground">
                        Click "Retest All" to run diagnostics
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
