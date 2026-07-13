import React, { useState, useEffect } from 'react';
import {
    License,
    LicenseAssignment,
    LicenseRenewal,
    LicenseHistory,
    licenseService
} from '../../services/licenseService';
import {
    CreditCard,
    Users,
    Calendar,
    ShieldCheck,
    History,
    UserPlus,
    RefreshCw,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Loader2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Progress } from '../../components/ui/progress';
import { useCurrency } from '../../context/CurrencyContext';

interface LicenseDetailsProps {
    license: License;
    onClose: () => void;
    onAssign: () => void;
    onRenew: () => void;
    onUnassign: (assignmentId: number) => void;
}

const LicenseDetails: React.FC<LicenseDetailsProps> = ({
    license,
    onClose,
    onAssign,
    onRenew,
    onUnassign
}) => {
    const { formatCost } = useCurrency();
    const [history, setHistory] = useState<LicenseHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoadingHistory(true);
                const data = await licenseService.getHistory(license.id);
                setHistory(data);
            } catch (error) {
                console.error("Failed to fetch license history", error);
            } finally {
                setLoadingHistory(false);
            }
        };
        fetchHistory();
    }, [license.id]);

    const isExpired = license.expiryDate ? new Date(license.expiryDate) < new Date() : false;
    const daysUntilExpiry = license.expiryDate ? Math.ceil((new Date(license.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

    const getStatusBadge = () => {
        if (isExpired) return <Badge variant="destructive">Expired</Badge>;
        if (daysUntilExpiry !== null && daysUntilExpiry <= 30) return <Badge variant="warning">Expiring Soon</Badge>;
        return <Badge variant="success">Active</Badge>;
    };

    return (
        <div className="space-y-6">
            {/* Header / Overview */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        {license.softwareName}
                        {getStatusBadge()}
                    </h2>
                    <p className="text-muted-foreground">{license.vendor} • {license.category} • {license.type}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onRenew}><RefreshCw className="mr-2 h-4 w-4" /> Renew</Button>
                    <Button onClick={onAssign} disabled={isExpired || license.usedSeats >= license.totalSeats}>
                        <UserPlus className="mr-2 h-4 w-4" /> Assign
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Seats Utilization</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{license.usedSeats} / {license.totalSeats}</div>
                        <Progress value={(license.usedSeats / license.totalSeats) * 100} className="h-2 mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">{license.totalSeats - license.usedSeats} seats available</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Cost Overview</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCost(license.unitPrice || 0, license.currency)}
                            <span className="text-sm font-normal text-muted-foreground"> / {license.billingFrequency}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Total: {formatCost((license.unitPrice || 0) * license.totalSeats, license.currency)} / cycle
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Renewal Status</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {license.expiryDate ? new Date(license.expiryDate).toLocaleDateString() : 'Perpetual'}
                        </div>
                        {license.nextRenewalDate && (
                            <p className="text-xs text-muted-foreground mt-2">Next Renewal: {new Date(license.nextRenewalDate).toLocaleDateString()}</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="assignments" className="w-full">
                <TabsList>
                    <TabsTrigger value="assignments">Assignments ({license.assignments?.length || 0})</TabsTrigger>
                    <TabsTrigger value="billing">Billing Details</TabsTrigger>
                    <TabsTrigger value="renewals">Renewal History</TabsTrigger>
                    <TabsTrigger value="history">Audit Trail</TabsTrigger>
                </TabsList>

                <TabsContent value="assignments" className="space-y-4 mt-4">
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Assigned Date</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {license.assignments?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users assigned</TableCell>
                                    </TableRow>
                                ) : (
                                    license.assignments?.map((assignment) => (
                                        <TableRow key={assignment.id}>
                                            <TableCell className="font-medium">{assignment.user?.firstName} {assignment.user?.lastName}</TableCell>
                                            <TableCell>{assignment.user?.email}</TableCell>
                                            <TableCell>{new Date(assignment.assignedAt).toLocaleDateString()}</TableCell>
                                            <TableCell>{assignment.notes || '-'}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onUnassign(assignment.id)}>
                                                    Remove
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="billing" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader><CardTitle>Financial Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-sm font-medium">Unit Price</p><p className="text-muted-foreground">{license.unitPrice} {license.currency}</p></div>
                                <div><p className="text-sm font-medium">Billing Frequency</p><p className="text-muted-foreground uppercase">{license.billingFrequency}</p></div>
                                <div><p className="text-sm font-medium">Commitment</p><p className="text-muted-foreground">{license.commitmentTerm || 'None'}</p></div>
                                <div><p className="text-sm font-medium">Purchase Date</p><p className="text-muted-foreground">{license.purchaseDate ? new Date(license.purchaseDate).toLocaleDateString() : '-'}</p></div>
                            </div>
                            <hr className="my-4" />
                            <div>
                                <h4 className="font-semibold mb-2">Cost Projection</h4>
                                <div className="text-sm text-muted-foreground">
                                    Annual estimated cost: {formatCost((license.unitPrice || 0) * license.totalSeats * (license.billingFrequency === 'monthly' ? 12 : 1), license.currency)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="renewals" className="space-y-4 mt-4">
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Renewed Date</TableHead>
                                    <TableHead>Old Expiry</TableHead>
                                    <TableHead>New Expiry</TableHead>
                                    <TableHead>Cost Change</TableHead>
                                    <TableHead>Remarks</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {license.renewals?.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">No renewal history</TableCell></TableRow>
                                ) : (
                                    license.renewals?.map((renewal) => (
                                        <TableRow key={renewal.id}>
                                            <TableCell>{new Date(renewal.renewedAt).toLocaleDateString()}</TableCell>
                                            <TableCell>{renewal.oldExpiryDate ? new Date(renewal.oldExpiryDate).toLocaleDateString() : '-'}</TableCell>
                                            <TableCell>{new Date(renewal.newExpiryDate).toLocaleDateString()}</TableCell>
                                            <TableCell className={renewal.costChange > 0 ? 'text-destructive' : 'text-success'}>
                                                {renewal.costChange > 0 ? '+' : ''}{renewal.costChange}
                                            </TableCell>
                                            <TableCell>{renewal.remarks || '-'}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-4 mt-4">
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Performed By</TableHead>
                                    <TableHead>Target User</TableHead>
                                    <TableHead>Notes / Reason</TableHead>
                                    <TableHead>Date & Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingHistory ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                                ) : history.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">No audit trail records found</TableCell></TableRow>
                                ) : (
                                    history.map((h) => (
                                        <TableRow key={h.id}>
                                            <TableCell>
                                                <Badge variant={
                                                    h.action === 'created' ? 'success' :
                                                        h.action === 'assigned' ? 'info' :
                                                            h.action === 'unassigned' ? 'warning' :
                                                                'outline'
                                                } className="capitalize">
                                                    {h.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{h.performedBy ? `${h.performedBy.firstName} ${h.performedBy.lastName}` : 'System'}</TableCell>
                                            <TableCell>{h.assignedTo ? `${h.assignedTo.firstName} ${h.assignedTo.lastName}` : '-'}</TableCell>
                                            <TableCell className="max-w-xs truncate" title={h.notes}>{h.notes || '-'}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(h.actionDate).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end">
                <Button variant="secondary" onClick={onClose}>Close</Button>
            </div>
        </div>
    );
};

export default LicenseDetails;
