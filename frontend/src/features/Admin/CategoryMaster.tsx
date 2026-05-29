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

const CategoryMaster: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const [confirmState, setConfirmState] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void; type?: 'danger' | 'warning' | 'primary' }>({ show: false, title: '', message: '', onConfirm: () => { } });
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', isActive: true, allowedTargetTypes: ['PERSON'] as string[] });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const paginatedCategories = React.useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return categories.slice(start, start + itemsPerPage);
    }, [categories, currentPage, itemsPerPage]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { loadCategories(); }, []);

    const loadCategories = async () => { try { setLoading(true); setCategories(await categoryService.getCategories()); } catch { showToast('Failed to load categories', 'error'); } finally { setLoading(false); } };

    const handleOpenCreate = () => { setEditMode(false); setFormData({ name: '', description: '', isActive: true, allowedTargetTypes: ['PERSON'] }); setShowModal(true); };

    const handleOpenEdit = (category: Category) => {
        setEditMode(true); setSelectedCategoryId(category.id);
        setFormData({ name: category.name, description: category.description, isActive: category.isActive, allowedTargetTypes: category.allowedTargetTypes || ['PERSON'] });
        setShowModal(true);
    };

    const handleDelete = (id: number) => {
        setConfirmState({
            show: true, title: 'Delete Category', message: 'Are you sure? This action cannot be undone.', type: 'danger',
            onConfirm: async () => { try { await categoryService.deleteCategory(id); showToast('Category deleted', 'success'); loadCategories(); } catch (error: any) { showToast(error.response?.data?.message || 'Failed to delete', 'error'); } setConfirmState(prev => ({ ...prev, show: false })); }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const nameTrimmed = formData.name.trim();
        const existingCategory = categories.find(c => c.name.toLowerCase() === nameTrimmed.toLowerCase());
        
        if (existingCategory && (!editMode || existingCategory.id !== selectedCategoryId)) {
            showToast(`Cannot save: Category "${nameTrimmed}" is already available in the system.`, 'error');
            return;
        }

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
                    <Table>
                        <TableHeader><TableRow><TableHead className="w-16">ID</TableHead><TableHead>Category Name</TableHead><TableHead>Description</TableHead><TableHead>Target Policies</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
                        <TableBody>
                            {paginatedCategories.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-12"><FolderOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" /><p className="text-muted-foreground">No categories found</p><p className="text-xs text-muted-foreground">Create your first category to get started</p></TableCell></TableRow>
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
                                    <TableCell>{category.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="destructive">Inactive</Badge>}</TableCell>
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
                        totalPages={Math.ceil(categories.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        totalItems={categories.length}
                        pageSize={itemsPerPage}
                    />
                </CardContent>
            </Card>

            <Dialog open={showModal} onOpenChange={(open) => { if (!open) setShowModal(false); }}>
                <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{editMode ? 'Edit Category' : 'Create New Category'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2"><Label>Category Name <span className="text-destructive">*</span></Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Enter category name" /></div>
                        <div className="space-y-2"><Label>Description</Label><Textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Enter category description" /></div>
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
                                                setFormData({ ...formData, allowedTargetTypes: newTypes });
                                            }}
                                        />
                                        <Label htmlFor={`target-${type}`} className="cursor-pointer text-sm font-normal">{type}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="isActive" className="h-4 w-4 rounded border-input" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
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
