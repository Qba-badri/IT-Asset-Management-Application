import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Edit, Trash2,
    Save, X, Loader2, Database
} from 'lucide-react';
import { masterService } from '../../services/masterService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { PageHeader } from '../../components/shared/PageHeader';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Pagination } from '../../components/shared/Pagination';

interface MasterManagementProps {
    type: 'Brand' | 'Vendor' | 'Lookup' | 'Plan';
    title: string;
    description: string;
    lookupType?: string;
}

const MasterManagement: React.FC<MasterManagementProps> = ({ type, title, description, lookupType }) => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);
    const { showToast } = useToast();

    const [formData, setFormData] = useState<any>({});
    const [vendors, setVendors] = useState<any[]>([]);
    const [lookups, setLookups] = useState<Record<string, any[]>>({});

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const paginatedItems = React.useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return items.slice(start, start + itemsPerPage);
    }, [items, currentPage, itemsPerPage]);

    // Reset pagination on type change
    useEffect(() => {
        setCurrentPage(1);
    }, [type, lookupType]);

    useEffect(() => {
        loadData();
    }, [type, lookupType]);

    const loadData = async () => {
        try {
            console.log(`[MasterManagement] Loading data for ${type} (${lookupType || 'no-lookup-type'})`);
            setLoading(true);
            let data: any[] = [];
            if (type === 'Brand') data = await masterService.getBrands();
            else if (type === 'Vendor') data = await masterService.getVendors();
            else if (type === 'Lookup') data = await masterService.getLookups(lookupType);
            else if (type === 'Plan') {
                const [pData, vData, lData] = await Promise.all([
                    masterService.getPlans(),
                    masterService.getVendors(),
                    masterService.getLookups()
                ]);
                data = pData;
                setVendors(vData);
                const grouped: Record<string, any[]> = {};
                lData.forEach(l => {
                    if (!grouped[l.type]) grouped[l.type] = [];
                    grouped[l.type].push(l);
                });
                setLookups(grouped);
            }
            console.log(`[MasterManagement] Received ${data.length} items for ${type}`);
            setItems(data);
        } catch (error) {
            console.error(`[MasterManagement] Failed to load ${title}`, error);
            showToast(`Failed to load ${title}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditItem(null);
        if (type === 'Lookup') setFormData({ type: lookupType, label: '', value: '', sortOrder: 0 });
        else if (type === 'Plan') setFormData({ name: '', productFamily: '', type: 'user', vendorId: '', isActive: true });
        else setFormData({ name: '', description: '', isActive: true });
        setShowModal(true);
    };

    const handleOpenEdit = (item: any) => {
        setEditItem(item);
        setFormData({ ...item });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editItem) {
                if (type === 'Brand') await masterService.updateBrand(editItem.id, formData);
                else if (type === 'Vendor') await masterService.updateVendor(editItem.id, formData);
                else if (type === 'Lookup') await masterService.updateLookup(editItem.id, formData);
                else if (type === 'Plan') await masterService.updatePlan(editItem.id, formData);
                showToast(`${title} updated`, 'success');
            } else {
                if (type === 'Brand') await masterService.createBrand(formData);
                else if (type === 'Vendor') await masterService.createVendor(formData);
                else if (type === 'Lookup') await masterService.createLookup(formData);
                else if (type === 'Plan') await masterService.createPlan(formData);
                showToast(`${title} created`, 'success');
            }
            setShowModal(false);
            loadData();
        } catch (error) {
            showToast(`Failed to save ${title}`, 'error');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            if (type === 'Brand') await masterService.deleteBrand(id);
            else if (type === 'Vendor') await masterService.deleteVendor(id);
            else if (type === 'Lookup') await masterService.deleteLookup(id);
            else if (type === 'Plan') await masterService.deletePlan(id);
            showToast(`${title} deleted`, 'success');
            loadData();
        } catch (error) {
            showToast(`Failed to delete ${title}`, 'error');
        }
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <PageHeader title={title} description={description}>
                <Button onClick={handleOpenCreate}><Plus className="h-4 w-4 mr-2" /> Add {title}</Button>
            </PageHeader>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{type === 'Lookup' ? 'Label' : 'Name'}</TableHead>
                                {type === 'Lookup' && <TableHead>Value</TableHead>}
                                {type === 'Vendor' && <TableHead>Contact</TableHead>}
                                {type === 'Plan' && (
                                    <>
                                        <TableHead>Vendor</TableHead>
                                        <TableHead>Family</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Type</TableHead>
                                    </>
                                )}
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No records found</TableCell>
                                </TableRow>
                            ) : (
                                paginatedItems.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium">{type === 'Lookup' ? item.label : item.name}</div>
                                            {(item.description || item.type) && <div className="text-xs text-muted-foreground">{item.description || item.type}</div>}
                                        </TableCell>
                                        {type === 'Lookup' && <TableCell><code className="text-xs bg-muted px-1 rounded">{item.value}</code></TableCell>}
                                        {type === 'Vendor' && (
                                            <TableCell>
                                                <div className="text-sm">{item.contactPerson}</div>
                                                <div className="text-xs text-muted-foreground">{item.email}</div>
                                            </TableCell>
                                        )}
                                        {type === 'Plan' && (
                                            <>
                                                <TableCell>{item.vendor?.name}</TableCell>
                                                <TableCell>{item.productFamily}</TableCell>
                                                <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                                                <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                                            </>
                                        )}
                                        <TableCell>
                                            <Badge variant={item.isActive ? 'success' : 'secondary'}>
                                                {item.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon-sm" onClick={() => handleOpenEdit(item)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(item.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(items.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        totalItems={items.length}
                        pageSize={itemsPerPage}
                    />
                </CardContent>
            </Card>

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editItem ? 'Edit' : 'New'} {title}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>{type === 'Lookup' ? 'Label' : 'Name'}</Label>
                            <Input
                                value={type === 'Lookup' ? formData.label : formData.name}
                                onChange={e => setFormData({ ...formData, [type === 'Lookup' ? 'label' : 'name']: e.target.value })}
                                required
                            />
                        </div>
                        {type === 'Lookup' && (
                            <div className="space-y-2">
                                <Label>Value</Label>
                                <Input
                                    value={formData.value}
                                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                                    required
                                />
                            </div>
                        )}
                        {type === 'Vendor' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Contact Person</Label>
                                        <Input value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                </div>
                            </>
                        )}
                        {type === 'Plan' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Vendor</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                            value={formData.vendorId}
                                            onChange={e => setFormData({ ...formData, vendorId: parseInt(e.target.value) })}
                                            required
                                        >
                                            <option value="">Select Vendor...</option>
                                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Product Family</Label>
                                        <Input value={formData.productFamily} onChange={e => setFormData({ ...formData, productFamily: e.target.value })} placeholder="e.g. Office 365" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>License Category</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="">Select Category...</option>
                                            {lookups['LICENSE_CATEGORY']?.map(l => <option key={l.id} value={l.value}>{l.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>License Type</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            <option value="">Select Type...</option>
                                            {lookups['LICENSE_TYPE']?.map(l => <option key={l.id} value={l.value}>{l.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                        {type === 'Lookup' ? (
                            <div className="space-y-2">
                                <Label>Sort Order</Label>
                                <Input type="number" value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })} />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Description / Notes</Label>
                                <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MasterManagement;
