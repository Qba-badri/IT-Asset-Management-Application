import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Loader2, Package } from 'lucide-react';
import { inventoryService, InventoryCategory } from '../../services/consumableInventoryService';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/Common/ConfirmModal';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { FormField } from '../../components/shared/FormField';
import { StatusToggle } from '../../components/shared/StatusToggle';
import { useForm } from '../../hooks/useForm';
import { useAuth } from '../../hooks/useAuth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Pagination } from '../../components/shared/Pagination';
import { useTableSearchSort, useResetPageOnChange, SortableHead, TableSearch } from '../../components/shared/useTableSearchSort';

const CategoryManagement: React.FC = () => {
    const [categories, setCategories] = useState<InventoryCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
    const [togglingStatusFor, setTogglingStatusFor] = useState<number | null>(null);
    const { showToast } = useToast();
    const { hasPermission } = useAuth();
    const canManage = hasPermission('inventory-mgmt.manage');

    const {
        values: formData,
        errors,
        handleChange,
        handleBlur,
        validateForm,
        resetForm,
    } = useForm({ name: '', description: '' }, {
        name: { label: 'Category name', required: true },
    });

    const [confirmState, setConfirmState] = useState<{
        show: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'danger' | 'warning' | 'primary'
    }>({
        show: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    // Search / sort. Inventory categories carry no status, so there is nothing
    // meaningful to filter by beyond the search term.
    const { searchTerm, setSearchTerm, sortBy, sortOrder, handleSort, result: visibleCategories, resetKey } =
        useTableSearchSort(categories, {
            searchIn: (c) => [c.name, c.description],
            sortValue: (c, column) => {
                switch (column) {
                    case 'description': return c.description;
                    case 'items': return c.items?.length ?? 0;
                    default: return c.name;
                }
            },
            initialSort: 'name',
        });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    useResetPageOnChange(resetKey, setCurrentPage);

    const paginatedCategories = React.useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return visibleCategories.slice(start, start + itemsPerPage);
    }, [visibleCategories, currentPage, itemsPerPage]);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await inventoryService.getCategories();
            setCategories(data || []);
        } catch (error: any) {
            console.error('Failed to load categories:', error);
            showToast('Failed to load categories', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleOpenForm = (category?: InventoryCategory) => {
        if (category) {
            setEditingCategory(category);
            resetForm({
                name: category.name,
                description: category.description || ''
            });
        } else {
            setEditingCategory(null);
            resetForm({ name: '', description: '' });
        }
        setShowFormModal(true);
    };

    const handleCloseForm = () => {
        setShowFormModal(false);
        setEditingCategory(null);
        resetForm({ name: '', description: '' });
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setSubmitting(true);
            if (editingCategory) {
                await inventoryService.updateCategory(editingCategory.id, formData);
                showToast('Category updated successfully', 'success');
            } else {
                await inventoryService.createCategory(formData);
                showToast('Category created successfully', 'success');
            }
            handleCloseForm();
            loadCategories();
        } catch (error: any) {
            console.error('Failed to save category:', error);
            const message = error.response?.data?.message || error.message || 'Failed to save category';
            showToast(Array.isArray(message) ? message.join(', ') : message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const applyCategoryStatus = async (category: InventoryCategory, next: boolean) => {
        setTogglingStatusFor(category.id);
        setCategories(prev => prev.map(c => (c.id === category.id ? { ...c, isActive: next } : c)));
        try {
            await inventoryService.updateCategory(category.id, {
                name: category.name,
                description: category.description,
                isActive: next,
            });
            showToast(`Category ${next ? 'activated' : 'deactivated'}`, 'success');
        } catch (error: any) {
            setCategories(prev => prev.map(c => (c.id === category.id ? { ...c, isActive: category.isActive } : c)));
            showToast(error.response?.data?.message || 'Failed to update category status', 'error');
        } finally {
            setTogglingStatusFor(null);
        }
    };

    const handleToggleStatus = (category: InventoryCategory, next: boolean) => {
        if (next) {
            applyCategoryStatus(category, next);
            return;
        }
        const itemCount = category.items?.length ?? 0;
        setConfirmState({
            show: true,
            title: 'Deactivate Category',
            type: 'warning',
            message: `Deactivate "${category.name}"? ${itemCount} item(s) keep this category, but it will no longer be offered when creating or editing inventory items. Reactivate at any time.`,
            onConfirm: () => {
                setConfirmState(prev => ({ ...prev, show: false }));
                applyCategoryStatus(category, next);
            },
        });
    };

    const handleDeleteClick = (category: InventoryCategory) => {
        setConfirmState({
            show: true,
            title: 'Delete Category',
            message: `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
            type: 'danger',
            onConfirm: () => handleDeleteConfirm(category.id)
        });
    };

    const handleDeleteConfirm = async (id: number) => {
        try {
            setSubmitting(true);
            await inventoryService.deleteCategory(id);
            showToast('Category deleted successfully', 'success');
            setConfirmState(prev => ({ ...prev, show: false }));
            loadCategories();
        } catch (error: any) {
            console.error('Failed to delete category:', error);
            const message = error.response?.data?.message || error.message || 'Failed to delete category';
            showToast(Array.isArray(message) ? message.join(', ') : message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Category Management"
                description="Manage inventory item categories"
            >
                <Button onClick={() => handleOpenForm()}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Category
                </Button>
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
                        <span className="text-xs text-muted-foreground ml-auto">
                            {visibleCategories.length} of {categories.length}
                        </span>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <SortableHead column="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Category Name</SortableHead>
                                <SortableHead column="description" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Description</SortableHead>
                                <SortableHead column="items" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Items Count</SortableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedCategories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        {categories.length === 0
                                            ? 'No categories found. Create your first category to get started.'
                                            : 'No categories match your search'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedCategories.map(category => (
                                    <TableRow key={category.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{category.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {category.description || '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {category.items?.length || 0} items
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <StatusToggle
                                                checked={category.isActive !== false}
                                                onToggle={canManage ? (next) => handleToggleStatus(category, next) : undefined}
                                                loading={togglingStatusFor === category.id}
                                                ariaLabel={`Toggle status for ${category.name}`}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => handleOpenForm(category)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => handleDeleteClick(category)}
                                                >
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
                        totalPages={Math.ceil(visibleCategories.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        totalItems={visibleCategories.length}
                        pageSize={itemsPerPage}
                        onPageSizeChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
                    />
                </CardContent>
            </Card>

            {/* Form Modal */}
            <Dialog open={showFormModal} onOpenChange={handleCloseForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory ? 'Edit Category' : 'New Category'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <FormField id="inventory-category-name" label="Category Name" required error={errors.name}>
                            <Input
                                value={formData.name}
                                onChange={e => handleChange('name', e.target.value)}
                                onBlur={() => handleBlur('name')}
                                placeholder="e.g., Office Supplies"
                            />
                        </FormField>
                        <FormField id="inventory-category-description" label="Description">
                            <Input
                                value={formData.description}
                                onChange={e => handleChange('description', e.target.value)}
                                placeholder="Optional description"
                            />
                        </FormField>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseForm}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {editingCategory ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
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

export default CategoryManagement;
