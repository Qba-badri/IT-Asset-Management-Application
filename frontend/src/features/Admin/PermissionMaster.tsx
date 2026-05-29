import React, { useEffect, useState } from 'react';
import { Edit, Trash2, Plus, Lock, Loader2 } from 'lucide-react';
import { rbacService, Permission } from '../../services/rbacService';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/Common/ConfirmModal';
import ActionDropdown from '../../components/Common/ActionDropdown';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Pagination } from '../../components/shared/Pagination';

const PermissionMaster: React.FC = () => {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const [confirmState, setConfirmState] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void; type?: 'danger' | 'warning' | 'primary' }>({ show: false, title: '', message: '', onConfirm: () => { } });
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedPermissionId, setSelectedPermissionId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ slug: '', module: '', description: '' });
    const availableModules = ['Users', 'Assets', 'Licenses', 'Roles', 'Reports', 'Settings'];

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const paginatedPermissions = React.useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return permissions.slice(start, start + itemsPerPage);
    }, [permissions, currentPage, itemsPerPage]);

    useEffect(() => { loadPermissions(); }, []);

    const loadPermissions = async () => { try { setLoading(true); setPermissions(await rbacService.getPermissions()); } catch { } finally { setLoading(false); } };

    const handleOpenCreate = () => { setEditMode(false); setFormData({ slug: '', module: '', description: '' }); setShowModal(true); };

    const handleOpenEdit = (permission: Permission) => {
        setEditMode(true); setSelectedPermissionId(permission.id);
        setFormData({ slug: permission.slug, module: permission.module, description: permission.description });
        setShowModal(true);
    };

    const handleDelete = (id: number) => {
        setConfirmState({
            show: true, title: 'Delete Permission', message: 'This will revoke this capability from all roles that possess it.', type: 'danger',
            onConfirm: async () => { try { await rbacService.deletePermission(id); showToast('Permission deleted', 'success'); loadPermissions(); } catch (error: any) { showToast(error.response?.data?.message || 'Failed to delete', 'error'); } setConfirmState(prev => ({ ...prev, show: false })); }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editMode && selectedPermissionId) await rbacService.updatePermission(selectedPermissionId, formData);
            else await rbacService.createPermission(formData);
            setShowModal(false); loadPermissions(); showToast(`Permission ${editMode ? 'updated' : 'created'}`, 'success');
        } catch { showToast('Failed to save permission', 'error'); }
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <PageHeader title="Permission Master" description="Admin">
                <Button onClick={handleOpenCreate}><Plus className="h-4 w-4 mr-2" />Add Permission</Button>
            </PageHeader>

            <Card>
                <CardHeader><CardTitle>System Permissions</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader><TableRow><TableHead className="w-16">ID</TableHead><TableHead>Module</TableHead><TableHead>Slug</TableHead><TableHead>Description</TableHead><TableHead>Status</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
                        <TableBody>
                            {paginatedPermissions.map(perm => (
                                <TableRow key={perm.id}>
                                    <TableCell className="text-muted-foreground">{perm.id}</TableCell>
                                    <TableCell><Badge variant="info">{perm.module}</Badge></TableCell>
                                    <TableCell><div className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-muted-foreground" /><code className="text-sm">{perm.slug}</code></div></TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{perm.description}</TableCell>
                                    <TableCell><Badge variant="success">Active</Badge></TableCell>
                                    <TableCell>
                                        <ActionDropdown actions={[
                                            { label: 'Edit', icon: <Edit className="h-4 w-4" />, onClick: () => handleOpenEdit(perm), variant: 'default' },
                                            { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, onClick: () => handleDelete(perm.id), variant: 'danger' },
                                        ]} />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {permissions.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No permissions found</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(permissions.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        totalItems={permissions.length}
                        pageSize={itemsPerPage}
                    />
                </CardContent>
            </Card>

            <Dialog open={showModal} onOpenChange={(open) => { if (!open) setShowModal(false); }}>
                <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editMode ? 'Edit Permission' : 'New Permission'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2"><Label>Module</Label>
                            <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" value={formData.module} onChange={(e) => setFormData({ ...formData, module: e.target.value })} required>
                                <option value="">Select a module...</option>
                                {availableModules.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <p className="text-xs text-muted-foreground">The feature area this permission belongs to</p>
                        </div>
                        <div className="space-y-2"><Label>Permission Slug</Label><Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required placeholder="e.g., assets.create, users.delete" /><p className="text-xs text-muted-foreground">Unique identifier (lowercase, use dots)</p></div>
                        <div className="space-y-2"><Label>Description</Label><Textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required placeholder="Describe what this permission allows" /></div>
                        <DialogFooter><Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">{editMode ? 'Update' : 'Create'} Permission</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmModal show={confirmState.show} title={confirmState.title} message={confirmState.message} type={confirmState.type} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(prev => ({ ...prev, show: false }))} />
        </div>
    );
};

export default PermissionMaster;
