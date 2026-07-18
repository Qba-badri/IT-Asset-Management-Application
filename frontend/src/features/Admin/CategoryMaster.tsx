import React, { useEffect, useState } from 'react';
import { Edit, Trash2, Plus, FolderOpen, Loader2 } from 'lucide-react';
import { categoryService, Category } from '../../services/categoryService';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/Common/ConfirmModal';
import ActionDropdown from '../../components/Common/ActionDropdown';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Pagination } from '../../components/shared/Pagination';
import { useTableSearchSort, useResetPageOnChange, SortableHead, TableSearch } from '../../components/shared/useTableSearchSort';
import { FormField } from '../../components/shared/FormField';
import { StatusToggle } from '../../components/shared/StatusToggle';
import { useForm } from '../../hooks/useForm';
import { useAuth } from '../../hooks/useAuth';

const CategoryMaster: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingStatusFor, setTogglingStatusFor] = useState<number | null>(null);
    const { showToast } = useToast();
    const { hasPermission } = useAuth();
    const canManage = hasPermission('categories.manage');

    const [confirmState, setConfirmState] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void; type?: 'danger' | 'warning' | 'primary' }>({ show: false, title: '', message: '', onConfirm: () => { } });
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const {
        values: formData,
        errors,
        handleChange,
        handleBlur,
        validateForm,
        resetForm,
        setValues: setFormValues,
    } = useForm({ name: '', description: '', isActive: true, allowedTargetTypes: ['PERSON'] as string[] }, {
        name: {
            label: 'Category name',
            required: true,
            custom: (value) => {
                const trimmed = String(value).trim();
                const existing = categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
                if (existing && (!editMode || existing.id !== selectedCategoryId)) {
                    return `Category "${trimmed}" already exists.`;
                }
                return null;
            },
        },
    });

    // Search / filter / sort
    const [statusFilter, setStatusFilter] = useState('all');
    const listFilters = React.useMemo(
        () => [(c: Category) => statusFilter === 'all' || (statusFilter === 'active' ? c.isActive : !c.isActive)],
        [statusFilter]
    );
    const { searchTerm, setSearchTerm, sortBy, sortOrder, handleSort, result: visibleCategories, resetKey } =
        useTableSearchSort(categories, {
            searchIn: (c) => [c.name, c.description, ...(c.allowedTargetTypes || [])],
            sortValue: (c, column) => {
                switch (column) {
                    case 'id': return c.id;
                    case 'description': return c.description;
                    case 'status': return c.isActive ? 'Active' : 'Inactive';
                    case 'created': return (c as any).createdAt ?? '';
                    default: return c.name;
                }
            },
            initialSort: 'name',
            filters: listFilters,
        });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    useResetPageOnChange(`${resetKey}|${statusFilter}`, setCurrentPage);

    const paginatedCategories = React.useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return visibleCategories.slice(start, start + itemsPerPage);
    }, [visibleCategories, currentPage, itemsPerPage]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { loadCategories(); }, []);

    const loadCategories = async () => { try { setLoading(true); setCategories(await categoryService.getCategories()); } catch { showToast('Failed to load categories', 'error'); } finally { setLoading(false); } };

    const handleOpenCreate = () => { setEditMode(false); resetForm({ name: '', description: '', isActive: true, allowedTargetTypes: ['PERSON'] }); setShowModal(true); };

    const handleOpenEdit = (category: Category) => {
        setEditMode(true); setSelectedCategoryId(category.id);
        resetForm({ name: category.name, description: category.description, isActive: category.isActive, allowedTargetTypes: category.allowedTargetTypes || ['PERSON'] });
        setShowModal(true);
    };

    const handleDelete = (id: number) => {
        setConfirmState({
            show: true, title: 'Delete Category', message: 'Are you sure? This action cannot be undone.', type: 'danger',
            onConfirm: async () => { try { await categoryService.deleteCategory(id); showToast('Category deleted', 'success'); loadCategories(); } catch (error: any) { showToast(error.response?.data?.message || 'Failed to delete', 'error'); } setConfirmState(prev => ({ ...prev, show: false })); }
        });
    };

    const applyCategoryStatus = async (category: Category, next: boolean) => {
        setTogglingStatusFor(category.id);
        setCategories(prev => prev.map(c => (c.id === category.id ? { ...c, isActive: next } : c)));
        try {
            await categoryService.updateCategory(category.id, {
                name: category.name,
                description: category.description,
                isActive: next,
                allowedTargetTypes: category.allowedTargetTypes,
            });
            showToast(`Category ${next ? 'activated' : 'deactivated'}`, 'success');
        } catch (error: any) {
            setCategories(prev => prev.map(c => (c.id === category.id ? { ...c, isActive: category.isActive } : c)));
            showToast(error.response?.data?.message || 'Failed to update category status', 'error');
        } finally {
            setTogglingStatusFor(null);
        }
    };

    const handleToggleStatus = (category: Category, next: boolean) => {
        if (next) {
            applyCategoryStatus(category, next);
            return;
        }
        setConfirmState({
            show: true,
            title: 'Deactivate Category',
            type: 'warning',
            message: `Deactivate "${category.name}"? Existing assets keep this category, but it will no longer be offered when creating or editing assets. Reactivate at any time.`,
            onConfirm: () => {
                setConfirmState(prev => ({ ...prev, show: false }));
                applyCategoryStatus(category, next);
            },
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        const nameTrimmed = formData.name.trim();
        try {
            if (editMode && selectedCategoryId) await categoryService.updateCategory(selectedCategoryId, { ...formData, name: nameTrimmed });
            else await categoryService.createCategory({ ...formData, name: nameTrimmed });
            setShowModal(false); loadCategories(); showToast(`Category ${editMode ? 'updated' : 'created'}`, 'success');
        } catch (error: any) { showToast(error.response?.data?.message || 'Failed to save', 'error'); }
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <PageHeader title="Asset Categories" description="Admin">
                <Button onClick={handleOpenCreate}><Plus className="h-4 w-4 mr-2" />Create New Category</Button>
            </PageHeader>

            <Card>
                <CardContent className="p-0">
                    <div className="flex flex-wrap items-center gap-3 p-4">
                        <TableSearch
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search categories..."
                            label="Search categories"
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
                            {visibleCategories.length} of {categories.length}
                        </span>
                    </div>
                    <Table>
                        <TableHeader><TableRow>
                            <SortableHead column="id" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="w-16">ID</SortableHead>
                            <SortableHead column="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Category Name</SortableHead>
                            <SortableHead column="description" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Description</SortableHead>
                            <TableHead>Target Policies</TableHead>
                            <SortableHead column="status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Status</SortableHead>
                            <SortableHead column="created" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Created</SortableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                            {paginatedCategories.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-12">
                                    <FolderOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                                    {categories.length === 0 ? (
                                        <>
                                            <p className="text-muted-foreground">No categories found</p>
                                            <p className="text-xs text-muted-foreground">Create your first category to get started</p>
                                        </>
                                    ) : (
                                        <p className="text-muted-foreground">No categories match your search</p>
                                    )}
                                </TableCell></TableRow>
                            ) : paginatedCategories.map(category => (
                                <TableRow key={category.id}>
                                    <TableCell className="text-muted-foreground">{category.id}</TableCell>
                                    <TableCell><div className="flex items-center gap-2"><FolderOpen className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{category.name}</span></div></TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{category.description || '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {category.allowedTargetTypes?.map(type => (
                                                <Badge key={type} variant="outline" className="text-[10px] uppercase font-bold">{type}</Badge>
                                            )) || <Badge variant="outline" className="text-[10px] uppercase font-bold">PERSON</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <StatusToggle
                                            checked={category.isActive}
                                            onToggle={canManage ? (next) => handleToggleStatus(category, next) : undefined}
                                            loading={togglingStatusFor === category.id}
                                            ariaLabel={`Toggle status for ${category.name}`}
                                        />
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{new Date(category.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <ActionDropdown actions={[
                                            { label: 'Edit', icon: <Edit className="h-4 w-4" />, onClick: () => handleOpenEdit(category), variant: 'default' },
                                            { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, onClick: () => handleDelete(category.id), variant: 'danger' },
                                        ]} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(visibleCategories.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        totalItems={visibleCategories.length}
                        pageSize={itemsPerPage}
                        onPageSizeChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
                    />
                </CardContent>
            </Card>

            <Dialog open={showModal} onOpenChange={(open) => { if (!open) setShowModal(false); }}>
                <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{editMode ? 'Edit Category' : 'Create New Category'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                        <FormField id="category-name" label="Category Name" required error={errors.name}>
                            <Input value={formData.name} onChange={(e) => handleChange('name', e.target.value)} onBlur={() => handleBlur('name')} placeholder="Enter category name" />
                        </FormField>
                        <FormField id="category-description" label="Description">
                            <Textarea rows={3} value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Enter category description" />
                        </FormField>
                        <div className="space-y-2">
                            <Label>Allowed Target Types</Label>
                            <div className="flex flex-wrap gap-4 pt-1">
                                {['PERSON', 'LOCATION'].map(type => (
                                    <div key={type} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`target-${type}`}
                                            className="h-4 w-4 rounded border-input"
                                            checked={formData.allowedTargetTypes.includes(type)}
                                            onChange={(e) => {
                                                const newTypes = e.target.checked
                                                    ? [...formData.allowedTargetTypes, type]
                                                    : formData.allowedTargetTypes.filter(t => t !== type);
                                                setFormValues(prev => ({ ...prev, allowedTargetTypes: newTypes }));
                                            }}
                                        />
                                        <Label htmlFor={`target-${type}`} className="cursor-pointer text-sm font-normal">{type}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="isActive" className="h-4 w-4 rounded border-input" checked={formData.isActive} onChange={(e) => setFormValues(prev => ({ ...prev, isActive: e.target.checked }))} />
                            <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
                        </div>
                        <DialogFooter><Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">{editMode ? 'Update' : 'Create'} Category</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmModal show={confirmState.show} title={confirmState.title} message={confirmState.message} type={confirmState.type} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(prev => ({ ...prev, show: false }))} />
        </div>
    );
};

export default CategoryMaster;
