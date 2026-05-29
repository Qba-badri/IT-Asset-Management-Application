import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, MapPin, User, Calendar, Tag, DollarSign,
    Edit, QrCode, ExternalLink, Loader2, Calculator, RefreshCw, Download
} from 'lucide-react';
import { authService } from '../../services/authService';
import { assetService, Asset, AssetPhoto } from '../../services/assetService';
import { API_URL } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import AssetPhotoGallery from './AssetPhotoGallery';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { useCurrency } from '../../context/CurrencyContext';

const AssetDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { formatCost } = useCurrency();
    const [asset, setAsset] = useState<Asset | null>(null);
    const [photos, setPhotos] = useState<AssetPhoto[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try { const profile = await authService.getProfile(); setCurrentUser(profile); }
            catch { showToast('Authentication failed', 'error'); }
        };
        fetchProfile();

        if (id) loadAssetData(parseInt(id));
        else { setAsset(null); setLoading(false); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const loadAssetData = async (assetId: number) => {
        try {
            setLoading(true);
            const assetData = await assetService.getAsset(assetId);
            setAsset(assetData);
            try { setHistory(await assetService.getAssetHistory(assetId)); } catch { setHistory([]); }
            try {
                const photosData = await assetService.getAssetPhotos(assetId);
                setPhotos(photosData.map(p => ({ ...p, url: p.url.startsWith('http') ? p.url : `${API_URL}${p.url}` })));
            } catch { setPhotos([]); }
        } catch {
            showToast('Failed to load asset details.', 'error');
            setAsset(null);
        } finally { setLoading(false); }
    };

    const handlePhotoUpload = async (files: FileList) => {
        if (!asset) return;
        try {
            const formData = new FormData();
            Array.from(files).forEach(f => formData.append('photos', f));
            const uploaded = await assetService.uploadAssetPhotos(asset.id, formData);
            setPhotos(prev => [...prev, ...uploaded.map((p: any) => ({ ...p, url: p.url.startsWith('http') ? p.url : `${API_URL}${p.url}` }))]);
            showToast(`${uploaded.length} photo(s) uploaded`, 'success');
        } catch { showToast('Failed to upload photos', 'error'); }
    };

    const handlePhotoDelete = async (photoId: number) => {
        if (!asset) return;
        try {
            await assetService.deleteAssetPhoto(asset.id, photoId);
            setPhotos(prev => prev.filter(p => p.id !== photoId));
            showToast('Photo deleted', 'success');
        } catch { showToast('Failed to delete photo', 'error'); }
    };

    const handleExportHistory = () => {
        if (!asset || history.length === 0) {
            showToast('No history records to export', 'warning');
            return;
        }

        const headers = ['Date', 'Action', 'Assigned To', 'Performed By', 'Details/Notes'];
        const rows = history.map(log => [
            new Date(log.actionDate).toLocaleString(),
            log.action || '-',
            log.assignedTo ? `${log.assignedTo.firstName} ${log.assignedTo.lastName}` : 'Unassigned',
            log.performedBy ? `${log.performedBy.firstName} ${log.performedBy.lastName}` : 'System',
            log.notes || '-'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${asset.name.replace(/\s+/g, '_')}_History_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('History exported successfully', 'success');
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading asset details...</p>
        </div>
    );

    if (!asset) return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-1"><ArrowLeft className="h-4 w-4" />Back to Assets</Button>
            <Card className="max-w-md mx-auto">
                <CardContent className="pt-6 text-center space-y-4">
                    <h3 className="text-lg font-semibold text-destructive">Asset Not Found</h3>
                    <p className="text-muted-foreground text-sm">The asset could not be found. It may have been deleted or you may not have permission.</p>
                    <Button onClick={() => navigate('/dashboard/assets')}>Return to Asset List</Button>
                </CardContent>
            </Card>
        </div>
    );

    const getStatusVariant = (status: string) => {
        const map: Record<string, any> = {
            available: 'success',
            deployed: 'default',
            maintenance: 'warning',
            repair: 'warning',
            disposed: 'secondary',
            lost: 'destructive',
            stolen: 'destructive'
        };
        return map[status.toLowerCase()] || 'outline';
    };

    const getActionBadge = (action: string) => {
        const map: Record<string, { variant: any; label: string }> = {
            created: { variant: 'success', label: 'Created' }, updated: { variant: 'info', label: 'Updated' },
            checkout: { variant: 'info', label: 'Check-Out' }, checkin: { variant: 'default', label: 'Check-In' },
            maintenance_start: { variant: 'warning', label: 'Maint Start' }, maintenance_end: { variant: 'success', label: 'Maint End' },
            disposed: { variant: 'destructive', label: 'Disposed' }, location_change: { variant: 'secondary', label: 'Relocated' },
            depreciation: { variant: 'outline', label: 'Depreciation' },
        };
        const s = map[action.toLowerCase()] || { variant: 'outline', label: action };
        return <Badge variant={s.variant}>{s.label}</Badge>;
    };

    const DataItem = ({ label, children }: { label: string; children: React.ReactNode }) => (
        <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <div className="text-sm">{children}</div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1 mb-2"><ArrowLeft className="h-4 w-4" />Back to Assets</Button>
                <h2 className="text-2xl font-bold">Asset Details: {asset.assetTag}</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>General Information</CardTitle>
                            <div className="flex gap-2">
                                <Badge variant="outline" className="capitalize">{asset.acquisitionType || 'purchased'}</Badge>
                                <Badge variant={getStatusVariant(asset.status)}>{asset.status.toUpperCase()}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <DataItem label="Asset Tag"><div className="flex items-center gap-1.5"><Tag className="h-4 w-4 text-muted-foreground" /><strong>{asset.assetTag}</strong></div></DataItem>
                                    <DataItem label="Name">{asset.name}</DataItem>
                                    <DataItem label="Category"><span className="capitalize">{asset.category}</span></DataItem>
                                    <DataItem label="Hostname">{asset.hostname || '-'}</DataItem>
                                    <DataItem label="Make / Model">{asset.brand} {asset.model || '-'}</DataItem>
                                </div>
                                <div className="space-y-4">
                                    <DataItem label="Serial Number">{asset.serialNumber || 'N/A'}</DataItem>
                                    <DataItem label="Condition"><Badge variant="outline">{asset.condition.toUpperCase()}</Badge></DataItem>
                                    <DataItem label="Created At">{new Date(asset.createdAt).toLocaleString()}</DataItem>
                                    <DataItem label="QR Code"><div className="flex items-center gap-1.5"><QrCode className="h-4 w-4 text-primary" /><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{asset.assetTag}-{asset.id}</code></div></DataItem>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Acquisition & Vendor Details</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <DataItem label="Vendor">{asset.vendor || 'N/A'}</DataItem>
                                    <DataItem label="Acquisition Type">
                                        <span className="capitalize font-medium">{asset.acquisitionType || 'purchased'}</span>
                                    </DataItem>
                                    {asset.acquisitionType === 'rented' ? (
                                        <>
                                            <DataItem label="Monthly Rent"><span className="text-primary font-semibold">{formatCost(Number(asset.vendorMonthlyRent || 0))}</span></DataItem>
                                            <DataItem label="Rental Start Date">{asset.receivedFromVendorDate ? new Date(asset.receivedFromVendorDate).toLocaleDateString() : '-'}</DataItem>
                                        </>
                                    ) : (
                                        <>
                                            <DataItem label="Purchase Date">{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-'}</DataItem>
                                            <DataItem label="Purchase Cost"><span className="text-primary font-semibold">{formatCost(Number(asset.purchaseCost || 0))}</span></DataItem>
                                            <DataItem label="PO / Invoice">{asset.poNumber || '-'}{asset.invoiceNumber ? ` / ${asset.invoiceNumber}` : ''}</DataItem>
                                            <DataItem label="Cost Center">{asset.costCenter || '-'}</DataItem>
                                            <DataItem label="Business Owner">{asset.businessOwner ? `${asset.businessOwner.firstName} ${asset.businessOwner.lastName}` : 'N/A'}</DataItem>
                                        </>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <DataItem label="Received from Vendor">{asset.receivedFromVendorDate ? new Date(asset.receivedFromVendorDate).toLocaleDateString() : '-'}</DataItem>
                                    <DataItem label="Warranty">{asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : 'N/A'}{asset.warrantyType ? ` (${asset.warrantyType})` : ''}</DataItem>
                                    <DataItem label="Location"><div className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-muted-foreground" />{asset.location || 'Not Specified'}</div></DataItem>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {asset.notes && (
                        <Card>
                            <CardHeader><CardTitle>Additional Notes</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{asset.notes}</p>
                            </CardContent>
                        </Card>
                    )}

                    <AssetPhotoGallery assetId={asset.id} assetName={asset.name} photos={photos} onPhotoUpload={handlePhotoUpload} onPhotoDelete={handlePhotoDelete} />

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <CardTitle>Movement History</CardTitle>
                            <Button variant="outline" size="sm" onClick={handleExportHistory} className="h-8 gap-2">
                                <Download className="h-3.5 w-3.5" />
                                Export History
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Assigned To</TableHead>
                                        <TableHead>Performed By</TableHead>
                                        <TableHead>Details / Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No history records found.</TableCell></TableRow>
                                    ) : history.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="text-xs text-muted-foreground">{new Date(log.actionDate).toLocaleString()}</TableCell>
                                            <TableCell>{getActionBadge(log.action)}</TableCell>
                                            <TableCell>
                                                {log.assignedTo ? (
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-medium">{log.assignedTo.firstName[0]}{log.assignedTo.lastName[0]}</span>
                                                        <span className="text-xs">{log.assignedTo.firstName} {log.assignedTo.lastName}</span>
                                                    </span>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {log.performedBy ? (
                                                    <span className="flex items-center gap-1.5">
                                                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="text-xs">{log.performedBy.firstName || 'System'}</span>
                                                    </span>
                                                ) : <span className="text-xs text-muted-foreground italic">System</span>}
                                            </TableCell>
                                            <TableCell className="max-w-[300px]">
                                                <div className="space-y-1">
                                                    {log.notes && <p className="text-xs text-muted-foreground italic">{log.notes}</p>}
                                                    {log.changes && log.changes.formulaDetails && (
                                                        <div className="bg-muted/50 p-2 rounded text-[10px] space-y-1 my-1 border border-primary/10">
                                                            <p className="font-semibold text-primary/80 uppercase text-[9px]">Depreciation Formula Details:</p>
                                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                                <p><span className="text-muted-foreground">Original Cost:</span> {formatCost(log.changes.formulaDetails.purchaseCost)}</p>
                                                                <p><span className="text-muted-foreground">Salvage Value:</span> {formatCost(log.changes.formulaDetails.salvageValue)}</p>
                                                                <p><span className="text-muted-foreground">Useful Life:</span> {asset?.usefulLifeYears} Yrs</p>
                                                                <p><span className="text-muted-foreground">Annual Dep.:</span> {formatCost(log.changes.formulaDetails.annualDepreciation)}</p>
                                                                <p><span className="text-muted-foreground">Time Passed:</span> {log.changes.formulaDetails.yearsElapsed} Yrs</p>
                                                                <p className="font-medium text-emerald-600"><span className="text-muted-foreground">New Value:</span> {formatCost(log.changes.currentValue.new)}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {log.changes && Object.keys(log.changes).filter(k => k !== 'formulaDetails').length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {Object.entries(log.changes).filter(([k]) => k !== 'formulaDetails').map(([field, delta]: [string, any]) => {
                                                                const formatFieldName = (name: string) => {
                                                                    const labels: Record<string, string> = {
                                                                        brandId: 'Brand', vendorId: 'Vendor', assetTag: 'Tag',
                                                                        purchaseCost: 'Cost', purchaseDate: 'Pur. Date',
                                                                        vendorMonthlyRent: 'Monthly Rent', acquisitionType: 'Acq. Type',
                                                                        receivedFromVendorDate: 'Recv. Date', usefulLifeYears: 'Useful Life',
                                                                        salvageValue: 'Salvage', warrantyExpiry: 'Warranty Exp.'
                                                                    };
                                                                    return labels[name] || name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1');
                                                                };
                                                                return (
                                                                    <Badge key={field} variant="outline" className="text-[10px] font-normal py-0 px-1 border-primary/20 bg-primary/5">
                                                                        <span className="font-semibold mr-1">{formatFieldName(field)}:</span>
                                                                        <span className="line-through text-muted-foreground mr-1">{String(delta.old ?? 'none')}</span>
                                                                        <span className="text-primary font-medium">→ {String(delta.new ?? 'none')}</span>
                                                                    </Badge>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-6 w-6 text-primary" /></div>
                                <div>
                                    <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">Current Custodian</p>
                                    {asset.assignedTo ? (
                                        <>
                                            <p className="text-lg font-bold">{asset.assignedTo.firstName} {asset.assignedTo.lastName}</p>
                                            <p className="text-sm text-muted-foreground">{asset.assignedTo.email}</p>
                                            {asset.deploymentDate && (
                                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Calendar className="h-3 w-3" />Deployed: {new Date(asset.deploymentDate).toLocaleDateString()}</p>
                                            )}
                                        </>
                                    ) : <p className="text-muted-foreground italic">Unassigned (In Inventory)</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-primary">
                        <CardContent className="pt-6 flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-xs text-muted-foreground">Current Location</p>
                                <p className="font-semibold">{asset.location || 'Not Specified'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle>Financial & Depreciation</CardTitle>
                            {asset.acquisitionType !== 'rented' && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                    disabled={calculating}
                                    onClick={async () => {
                                        if (!id) return;
                                        try {
                                            setCalculating(true);
                                            await assetService.calculateDepreciation(parseInt(id), currentUser?.id ? Number(currentUser.id) : undefined);
                                            showToast('Depreciation recalculated', 'success');
                                            loadAssetData(parseInt(id));
                                        } catch (err: any) {
                                            showToast(err.response?.data?.message || 'Calculation failed', 'error');
                                        } finally {
                                            setCalculating(false);
                                        }
                                    }}
                                >
                                    {calculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <DataItem label="Original Cost"><span className="text-primary font-semibold">{formatCost(Number(asset.purchaseCost || 0))}</span></DataItem>
                            <DataItem label="Current Book Value">
                                <span className={`font-semibold ${calculating ? 'animate-pulse text-muted-foreground' : 'text-emerald-600'}`}>
                                    {formatCost(Number(asset.currentValue || 0))}
                                </span>
                            </DataItem>
                            <DataItem label="Useful Life">{asset.usefulLifeYears} Years</DataItem>
                            <DataItem label="Salvage Value">{formatCost(Number(asset.salvageValue || 0))}</DataItem>
                            <DataItem label="Next Maintenance">{asset.nextMaintenanceDate ? new Date(asset.nextMaintenanceDate).toLocaleDateString() : 'None Scheduled'}</DataItem>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6 space-y-2">
                            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate(`/dashboard/assets/${id}/audit`)}><ExternalLink className="h-4 w-4" />View Audit Log</Button>
                            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/dashboard/assets', { state: { editAsset: asset } })}><Edit className="h-4 w-4" />Edit Properties</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AssetDetails;
