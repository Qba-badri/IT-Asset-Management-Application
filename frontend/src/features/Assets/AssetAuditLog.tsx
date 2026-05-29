import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, History, Calendar, User, FileText, Loader2, Info, Download } from 'lucide-react';
import { assetService } from '../../services/assetService';
import { Button } from '../../components/ui/button';
import { useToast } from '../../context/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { useCurrency } from '../../context/CurrencyContext';

const AssetAuditLog: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [auditHistory, setAuditHistory] = useState<any[]>([]);
    const [assetName, setAssetName] = useState('');
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const { formatCost } = useCurrency();

    const formatFieldName = (name: string) => {
        const labels: Record<string, string> = {
            brandId: 'Brand', vendorId: 'Vendor', assetTag: 'Tag',
            purchaseCost: 'Cost', purchaseDate: 'Pur. Date',
            vendorMonthlyRent: 'Monthly Rent', acquisitionType: 'Acq. Type',
            receivedFromVendorDate: 'Recv. Date', usefulLifeYears: 'Useful Life',
            salvageValue: 'Salvage', warrantyExpiry: 'Warranty Exp.',
            status: 'Status', condition: 'Condition', name: 'Asset Name',
            location: 'Location', category: 'Category',
            hostname: 'Hostname', poNumber: 'PO Number', invoiceNumber: 'Invoice',
            costCenter: 'Cost Center', businessOwnerId: 'Business Owner',
            site: 'Site', building: 'Building', floor: 'Floor', roomDesk: 'Room/Desk',
            warrantyType: 'Warranty Type', warrantyStart: 'Warranty Start',
            maintenanceCycleDays: 'Maint. Cycle'
        };
        return labels[name] || name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1');
    };

    useEffect(() => { if (id) loadAuditData(parseInt(id)); }, [id]);

    const handleExportHistory = () => {
        if (auditHistory.length === 0) {
            showToast('No history records to export', 'warning');
            return;
        }

        const headers = ['Date', 'Time', 'Action', 'Performed By', 'Assigned To', 'Notes', 'Changes/Details'];
        const rows = auditHistory.map(entry => {
            const entryDate = entry.actionDate || entry.date || entry.createdAt;
            const d = entryDate ? new Date(entryDate) : null;

            let changesStr = '-';
            if (entry.changes) {
                const changesArr = Object.entries(entry.changes)
                    .filter(([k]) => k !== 'formulaDetails')
                    .map(([k, v]: [string, any]) => `${formatFieldName(k)}: ${v.old} -> ${v.new}`);

                let changes = changesArr.join('; ');

                if (entry.changes.formulaDetails) {
                    const fd = entry.changes.formulaDetails;
                    changesStr = `Depreciation - Cost: ${fd.purchaseCost}, Value: ${entry.changes.currentValue?.new || 0}; ${changes}`;
                } else {
                    changesStr = changes || '-';
                }
            }

            return [
                d ? d.toLocaleDateString() : '-',
                d ? d.toLocaleTimeString() : '-',
                entry.action || '-',
                entry.performedBy ? `${entry.performedBy.firstName} ${entry.performedBy.lastName}` : 'System',
                entry.assignedTo ? `${entry.assignedTo.firstName} ${entry.assignedTo.lastName}` : '-',
                entry.notes || '-',
                changesStr
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${assetName.replace(/\s+/g, '_')}_Movement_History_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Movement history exported successfully', 'success');
    };

    const loadAuditData = async (assetId: number) => {
        try {
            setLoading(true);
            const [assetData, historyData] = await Promise.all([
                assetService.getAsset(assetId).catch(() => null),
                assetService.getAssetHistory(assetId).catch(() => [])
            ]);

            if (assetData) {
                setAssetName(assetData.name);
            }
            setAuditHistory(historyData);
        } catch (error) {
            console.error('Error loading audit data', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action: string) => {
        if (!action) return '📝';
        const icons: Record<string, string> = {
            created: '✅', updated: '✏️', deployed: '🚀', checkout: '🚀',
            undeployed: '⬅️', checkin: '⬅️', maintenance: '🔧',
            'maint start': '🔧', maintenance_start: '🔧',
            'maint end': '✅', maintenance_end: '✅',
            disposed: '🗑️', location_change: '📍'
        };
        return icons[action.toLowerCase()] || '📝';
    };

    const getActionColor = (action: string) => {
        if (!action) return 'text-muted-foreground';
        const colors: Record<string, string> = {
            created: 'text-emerald-600', updated: 'text-blue-600',
            deployed: 'text-primary', checkout: 'text-primary',
            undeployed: 'text-amber-600', checkin: 'text-amber-600',
            maintenance: 'text-amber-600', maintenance_start: 'text-amber-600',
            'maint start': 'text-amber-600',
            'maint end': 'text-emerald-600', maintenance_end: 'text-emerald-600',
            disposed: 'text-destructive', location_change: 'text-blue-500'
        };
        return colors[action.toLowerCase()] || 'text-muted-foreground';
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    if (!assetName && auditHistory.length === 0) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" size="sm" asChild className="gap-1 mb-2">
                    <Link to="/dashboard/assets"><ArrowLeft className="h-4 w-4" />Back to Assets</Link>
                </Button>
                <Card>
                    <CardContent className="py-12 text-center">
                        <History className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold">Asset Not Found</h3>
                        <p className="text-muted-foreground">The asset you are looking for does not exist or has no history.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <Button variant="ghost" size="sm" asChild className="gap-1 mb-2">
                    <Link to="/dashboard/assets"><ArrowLeft className="h-4 w-4" />Back to Assets</Link>
                </Button>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Asset Audit Trail</p>
                        <h2 className="text-2xl font-bold flex items-center gap-2"><History className="h-6 w-6" />{assetName || 'Unknown Asset'} - Audit Log</h2>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExportHistory} className="gap-2">
                        <Download className="h-4 w-4" />
                        Export History
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader><CardTitle>Movement & Activity History</CardTitle></CardHeader>
                <CardContent className="p-0">
                    {auditHistory.length === 0 ? (
                        <div className="text-center py-12">
                            <History className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground">No audit history available for this asset.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Assigned To / Modified By</TableHead>
                                    <TableHead>Details / Changes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {auditHistory.map((entry, index) => {
                                    const entryDate = entry.actionDate || entry.date || entry.createdAt;
                                    const actionLabel = entry.action ? entry.action.replace('_', ' ') : '-';

                                    return (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <div className="text-sm">{entryDate ? new Date(entryDate).toLocaleDateString() : '-'}</div>
                                                        <div className="text-xs text-muted-foreground">{entryDate ? new Date(entryDate).toLocaleTimeString() : '-'}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="flex items-center gap-1.5 text-sm">
                                                    <span>{getActionIcon(entry.action)}</span>
                                                    <span className={`font-medium capitalize ${getActionColor(entry.action)}`}>
                                                        {actionLabel}
                                                    </span>
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    {entry.assignedTo ? (
                                                        <div className="flex items-center gap-1 text-sm font-medium">
                                                            <User className="h-3.5 w-3.5 text-primary" />
                                                            <span>{entry.assignedTo.firstName} {entry.assignedTo.lastName}</span>
                                                        </div>
                                                    ) : entry.performedBy ? (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <span>By: {entry.performedBy.firstName} {entry.performedBy.lastName}</span>
                                                        </div>
                                                    ) : <span className="text-xs text-muted-foreground italic">System</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-2 py-1">
                                                    {entry.notes && (
                                                        <div className="flex items-start gap-1 text-xs text-muted-foreground italic">
                                                            <FileText className="h-3 w-3 mt-0.5 shrink-0" />
                                                            <span>{entry.notes}</span>
                                                        </div>
                                                    )}

                                                    {entry.changes?.formulaDetails && (
                                                        <div className="bg-primary/5 p-2 rounded text-[10px] space-y-1 border border-primary/10 max-w-[400px]">
                                                            <p className="font-semibold text-primary/80 uppercase text-[9px] flex items-center gap-1">
                                                                <Info className="h-2.5 w-2.5" /> Depreciation Formula Details:
                                                            </p>
                                                            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                                                                <p><span className="text-muted-foreground text-[9px]">Original Cost:</span> {formatCost(entry.changes.formulaDetails.purchaseCost)}</p>
                                                                <p><span className="text-muted-foreground text-[9px]">Salvage Value:</span> {formatCost(entry.changes.formulaDetails.salvageValue)}</p>
                                                                <p><span className="text-muted-foreground text-[9px]">Annual Depr:</span> {formatCost(entry.changes.formulaDetails.annualDepreciation)}</p>
                                                                <p><span className="text-muted-foreground text-[9px]">Time Elapsed:</span> {entry.changes.formulaDetails.yearsElapsed} Yrs</p>
                                                                <p className="font-medium text-emerald-600 col-span-2">
                                                                    <span className="text-muted-foreground text-[9px] mr-1">New Book Value:</span>
                                                                    {formatCost(entry.changes.currentValue?.new || 0)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {entry.changes && Object.keys(entry.changes).filter(k => k !== 'formulaDetails').length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                                            {Object.entries(entry.changes).filter(([k]) => k !== 'formulaDetails').map(([field, delta]: [string, any]) => (
                                                                <Badge key={field} variant="outline" className="text-[10px] font-normal py-0 px-1.5 border-primary/20 bg-primary/5 h-5">
                                                                    <span className="font-semibold mr-1">{formatFieldName(field)}:</span>
                                                                    <span className="line-through text-muted-foreground mr-1">{String(delta.old ?? 'none')}</span>
                                                                    <span className="text-primary font-medium">→ {String(delta.new ?? 'none')}</span>
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AssetAuditLog;
