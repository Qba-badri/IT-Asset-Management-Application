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
import { PageHeader } from '../../components/shared/PageHeader';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Pagination } from '../../components/shared/Pagination';
import { useTableSearchSort, useResetPageOnChange, SortableHead, TableSearch } from '../../components/shared/useTableSearchSort';
import { FormField } from '../../components/shared/FormField';
import { StatusToggle } from '../../components/shared/StatusToggle';
import ConfirmModal from '../../components/Common/ConfirmModal';
import { useForm, FormConfig } from '../../hooks/useForm';
import { useAuth } from '../../hooks/useAuth';

interface MasterManagementProps {
    type: 'Brand' | 'Vendor' | 'Lookup' | 'Plan';
    title: string;
    description: string;
    lookupType?: string;
}

// The permission slug guarding mutations for each master type (mirrors backend).
const MANAGE_SLUGS: Record<MasterManagementProps['type'], string> = {
    Brand: 'brands.manage',
    Vendor: 'vendors.manage',
    Lookup: 'settings.manage',
    Plan: 'licenses.manage',
};

const MasterManagement: React.FC<MasterManagementProps> = ({ type, title, description, lookupType }) => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);
    const [togglingStatusFor, setTogglingStatusFor] = useState<number | null>(null);
    const [confirmState, setConfirmState] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void; type?: 'danger' | 'warning' | 'primary' }>({ show: false, title: '', message: '', onConfirm: () => { } });
    const { showToast } = useToast();
    const { hasPermission } = useAuth();
    const canManage = hasPermission(MANAGE_SLUGS[type]);

    // The mandatory set follows the master type this route serves.
    const validationConfig = React.useMemo<FormConfig<any>>(() => {
        if (type === 'Lookup') {
            return {
                label: { label: 'Label', required: true },
                value: { label: 'Value', required: true },
            };
        }
        if (type === 'Plan') {
            return {
                name: { label: 'Name', required: true },
                vendorId: { label: 'Vendor', required: true },
            };
        }
        if (type === 'Vendor') {
            return {
                name: { label: 'Name', required: true },
                email: { label: 'Email', email: true },
            };
        }
        return { name: { label: 'Name', required: true } };
    }, [type]);

    const {
        values: formData,
        errors,
        handleChange,
        handleBlur,
        validateForm,
        resetForm,
    } = useForm<any>({}, validationConfig);
    const [vendors, setVendors] = useState<any[]>([]);
    const [lookups, setLookups] = useState<Record<string, any[]>>({});

    // Search / filter / sort. The visible columns vary by `type`, so the search
    // and sort fields follow the same shape the table actually renders.
    const [statusFilter, setStatusFilter] = useState('all');
    const listFilters = React.useMemo(
        () => [(i: any) => statusFilter === 'all' || (statusFilter === 'active' ? !!i.isActive : !i.isActive)],
        [statusFilter]
    );
    const primaryLabel = (i: any) => (type === 'Lookup' ? i.label : i.name);
    const { searchTerm, setSearchTerm, sortBy, sortOrder, handleSort, result: visibleItems, resetKey } =
        useTableSearchSort<any>(items, {
            searchIn: (i) => [
                primaryLabel(i), i.description, i.value, i.type,
                i.contactPerson, i.email, i.vendor?.name, i.productFamily, i.category,
            ],
            sortValue: (i, column) => {
                switch (column) {
                    case 'value': return i.value;
                    case 'contact': return i.contactPerson || i.email;
                    case 'vendor': return i.vendor?.name;
                    case 'family': return i.productFamily;
                    case 'category': return i.category;
                    case 'type': return i.type;
                    case 'status': return i.isActive ? 'Active' : 'Inactive';
                    default: return primaryLabel(i);
                }
            },
            initialSort: 'name',
            filters: listFilters,
        });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const paginatedItems = React.useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return visibleItems.slice(start, start + itemsPerPage);
    }, [visibleItems, currentPage, itemsPerPage]);

    // Reset pagination when the visible set changes, and when the page switches
    // to a different master type (the same component serves six routes).
    useResetPageOnChange(`${type}|${lookupType}|${resetKey}|${statusFilter}`, setCurrentPage);

    // A stale search from the previous master type would silently hide rows.
    useEffect(() => {
        setSearchTerm('');
        setStatusFilter('all');
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (type === 'Lookup') resetForm({ type: lookupType, label: '', value: '', sortOrder: 0 });
        else if (type === 'Plan') resetForm({ name: '', productFamily: '', type: 'user', vendorId: '', isActive: true });
        else resetForm({ name: '', description: '', isActive: true });
        setShowModal(true);
    };

    const handleOpenEdit = (item: any) => {
        setEditItem(item);
        resetForm({ ...item });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
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

    const applyStatus = async (item: any, next: boolean) => {
        setTogglingStatusFor(item.id);
        setItems(prev => prev.map(i => (i.id === item.id ? { ...i, isActive: next } : i)));
        try {
            const payload = { isActive: next };
            if (type === 'Brand') await masterService.updateBrand(item.id, payload);
            else if (type === 'Vendor') await masterService.updateVendor(item.id, payload);
            else if (type === 'Lookup') await masterService.updateLookup(item.id, payload);
            else if (type === 'Plan') await masterService.updatePlan(item.id, payload);
            showToast(`${title} ${next ? 'activated' : 'deactivated'}`, 'success');
        } catch (error: any) {
            setItems(prev => prev.map(i => (i.id === item.id ? { ...i, isActive: item.isActive } : i)));
            showToast(error.response?.data?.message || `Failed to update ${title} status`, 'error');
        } finally {
            setTogglingStatusFor(null);
        }
    };

    const handleToggleStatus = (item: any, next: boolean) => {
        if (next) {
            applyStatus(item, next);
            return;
        }
        const itemName = type === 'Lookup' ? item.label : item.name;
        setConfirmState({
            show: true,
            title: `Deactivate ${title}`,
            type: 'warning',
            message: `Deactivate "${itemName}"? Existing records that reference it are preserved and keep displaying it, but it will no longer be offered when creating or editing records. Reactivate at any time.`,
            onConfirm: () => {
                setConfirmState(prev => ({ ...prev, show: false }));
                applyStatus(item, next);
            },
        });
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
                    <div className="flex flex-wrap items-center gap-3 p-4">
                        <TableSearch
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder={`Search ${title.toLowerCase()}...`}
                            label={`Search ${title}`}
                        />
                        <select
                            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            aria-label="Filter by status"
                        >
                            <option value="all">All statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <span className="text-xs text-muted-foreground ml-auto">
                            {visibleItems.length} of {items.length}
                        </span>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <SortableHead column="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>{type === 'Lookup' ? 'Label' : 'Name'}</SortableHead>
                                {type === 'Lookup' && <SortableHead column="value" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Value</SortableHead>}
                                {type === 'Vendor' && <SortableHead column="contact" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Contact</SortableHead>}
                                {type === 'Plan' && (
                                    <>
                                        <SortableHead column="vendor" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Vendor</SortableHead>
                                        <SortableHead column="family" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Family</SortableHead>
                                        <SortableHead column="category" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Category</SortableHead>
                                        <SortableHead column="type" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Type</SortableHead>
                                    </>
                                )}
                                <SortableHead column="status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Status</SortableHead>
                                <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                        {items.length === 0 ? 'No records found' : 'No records match your search'}
                                    </TableCell>
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
                                            <StatusToggle
                                                checked={item.isActive !== false}
                                                onToggle={canManage ? (next) => handleToggleStatus(item, next) : undefined}
                                                loading={togglingStatusFor === item.id}
                                                ariaLabel={`Toggle status for ${type === 'Lookup' ? item.label : item.name}`}
                                            />
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
                        totalPages={Math.ceil(visibleItems.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        totalItems={visibleItems.length}
                        pageSize={itemsPerPage}
                        onPageSizeChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
                    />
                </CardContent>
            </Card>

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editItem ? 'Edit' : 'New'} {title}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                        <FormField
                            id={type === 'Lookup' ? 'label' : 'name'}
                            label={type === 'Lookup' ? 'Label' : 'Name'}
                            required
                            error={type === 'Lookup' ? errors.label : errors.name}
                        >
                            <Input
                                value={(type === 'Lookup' ? formData.label : formData.name) ?? ''}
                                onChange={e => handleChange(type === 'Lookup' ? 'label' : 'name', e.target.value)}
                                onBlur={() => handleBlur(type === 'Lookup' ? 'label' : 'name')}
                            />
                        </FormField>
                        {type === 'Lookup' && (
                            <FormField id="value" label="Value" required error={errors.value}>
                                <Input
                                    value={formData.value ?? ''}
                                    onChange={e => handleChange('value', e.target.value)}
                                    onBlur={() => handleBlur('value')}
                                />
                            </FormField>
                        )}
                        {type === 'Vendor' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField id="contactPerson" label="Contact Person">
                                        <Input value={formData.contactPerson ?? ''} onChange={e => handleChange('contactPerson', e.target.value)} />
                                    </FormField>
                                    <FormField id="email" label="Email" error={errors.email}>
                                        <Input type="email" value={formData.email ?? ''} onChange={e => handleChange('email', e.target.value)} onBlur={() => handleBlur('email')} />
                                    </FormField>
                                </div>
                            </>
                        )}
                        {type === 'Plan' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField id="vendorId" label="Vendor" required error={errors.vendorId}>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                            value={formData.vendorId ?? ''}
                                            onChange={e => handleChange('vendorId', e.target.value ? parseInt(e.target.value) : '')}
                                            onBlur={() => handleBlur('vendorId')}
                                        >
                                            <option value="">Select Vendor...</option>
                                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                        </select>
                                    </FormField>
                                    <FormField id="productFamily" label="Product Family">
                                        <Input value={formData.productFamily ?? ''} onChange={e => handleChange('productFamily', e.target.value)} placeholder="e.g. Office 365" />
                                    </FormField>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField id="category" label="License Category">
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                            value={formData.category ?? ''}
                                            onChange={e => handleChange('category', e.target.value)}
                                        >
                                            <option value="">Select Category...</option>
                                            {lookups['LICENSE_CATEGORY']?.map(l => <option key={l.id} value={l.value}>{l.label}</option>)}
                                        </select>
                                    </FormField>
                                    <FormField id="plan-type" label="License Type">
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                            value={formData.type ?? ''}
                                            onChange={e => handleChange('type', e.target.value)}
                                        >
                                            <option value="">Select Type...</option>
                                            {lookups['LICENSE_TYPE']?.map(l => <option key={l.id} value={l.value}>{l.label}</option>)}
                                        </select>
                                    </FormField>
                                </div>
                            </div>
                        )}
                        {type === 'Lookup' ? (
                            <FormField id="sortOrder" label="Sort Order">
                                <Input type="number" value={formData.sortOrder ?? 0} onChange={e => handleChange('sortOrder', parseInt(e.target.value))} />
                            </FormField>
                        ) : (
                            <FormField id="master-description" label="Description / Notes">
                                <Input value={formData.description ?? ''} onChange={e => handleChange('description', e.target.value)} />
                            </FormField>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmModal
                show={confirmState.show}
                title={confirmState.title}
                message={confirmState.message}
                type={confirmState.type}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState(prev => ({ ...prev, show: false }))}
            />
        </div>
    );
};

export default MasterManagement;
