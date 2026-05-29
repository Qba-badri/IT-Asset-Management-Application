import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Loader2, Package } from 'lucide-react';
import { inventoryService, InventoryCategory } from '../../services/consumableInventoryService';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/Common/ConfirmModal';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Pagination } from '../../components/shared/Pagination';

const CategoryManagement: React.FC = () => {
    const [categories, setCategories] = useState<InventoryCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        name: '',
        description: ''
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

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const paginatedCategories = React.useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return categories.slice(start, start + itemsPerPage);
    }, [categories, currentPage, itemsPerPage]);

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
            setFormData({
                name: category.name,
                description: category.description || ''
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', description: '' });
        }
        setShowFormModal(true);
    };

    const handleCloseForm = () => {
        setShowFormModal(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '' });
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            showToast('Category name is required', 'error');
            return;
        }

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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Category Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Items Count</TableHead>
                                <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedCategories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No categories found. Create your first category to get started.
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
                        totalPages={Math.ceil(categories.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        totalItems={categories.length}
                        pageSize={itemsPerPage}
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
                        <div className="space-y-2">
                            <Label>Category Name *</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Office Supplies"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Optional description"
                            />
                        </div>
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
