import React, { useEffect, useState } from 'react';
import { Edit, Trash2, Plus, ShieldCheck, Loader2 } from 'lucide-react';
import { rbacService, Role, Permission } from '../../services/rbacService';
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
import { ScrollArea } from '../../components/ui/scroll-area';
import { Pagination } from '../../components/shared/Pagination';

const RoleMaster: React.FC = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const [confirmState, setConfirmState] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void; type?: 'danger' | 'warning' | 'primary' }>({ show: false, title: '', message: '', onConfirm: () => { } });
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', permissionIds: [] as number[] });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const paginatedRoles = React.useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return roles.slice(start, start + itemsPerPage);
    }, [roles, currentPage, itemsPerPage]);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try { setLoading(true); const [r, p] = await Promise.all([rbacService.getRoles(), rbacService.getPermissions()]); setRoles(r); setPermissions(p); }
        catch { } finally { setLoading(false); }
    };

    const handleOpenCreate = () => { setEditMode(false); setFormData({ name: '', description: '', permissionIds: [] }); setShowModal(true); };

    const handleOpenEdit = (role: Role) => {
        setEditMode(true); setSelectedRoleId(role.id);
        setFormData({ name: role.name, description: role.description, permissionIds: role.permissions?.map(p => p.id) || [] });
        setShowModal(true);
    };

    const handleDelete = (id: number) => {
        setConfirmState({
            show: true, title: 'Delete Role', message: 'Are you sure? Users with this role will need reassignment.', type: 'danger',
            onConfirm: async () => { try { await rbacService.deleteRole(id); showToast('Role deleted', 'success'); loadData(); } catch (error: any) { showToast(error.response?.data?.message || 'Failed to delete role', 'error'); } setConfirmState(prev => ({ ...prev, show: false })); }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { name: formData.name, description: formData.description, permissionIds: formData.permissionIds };
            if (editMode && selectedRoleId) await rbacService.updateRole(selectedRoleId, payload);
            else await rbacService.createRole(payload);
            setShowModal(false); loadData(); showToast(`Role ${editMode ? 'updated' : 'created'}`, 'success');
        } catch { showToast('Failed to save role', 'error'); }
    };

    const handlePermissionToggle = (permissionId: number) => {
        setFormData(prev => ({ ...prev, permissionIds: prev.permissionIds.includes(permissionId) ? prev.permissionIds.filter(id => id !== permissionId) : [...prev.permissionIds, permissionId] }));
    };

    const groupedPermissions = permissions.reduce((acc, perm) => { if (!acc[perm.module]) acc[perm.module] = []; acc[perm.module].push(perm); return acc; }, {} as Record<string, Permission[]>);

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <PageHeader title="Role Master" description="Admin">
                <Button onClick={handleOpenCreate}><Plus className="h-4 w-4 mr-2" />Create New Role</Button>
            </PageHeader>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader><TableRow><TableHead className="w-16">ID</TableHead><TableHead>Role Name</TableHead><TableHead>Description</TableHead><TableHead>Permissions</TableHead><TableHead>Status</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
                        <TableBody>
                            {paginatedRoles.map(role => (
                                <TableRow key={role.id}>
                                    <TableCell className="text-muted-foreground">{role.id}</TableCell>
                                    <TableCell className="font-medium">{role.name}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{role.description}</TableCell>
                                    <TableCell><div className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{role.permissions?.length || 0} Permissions</span></div></TableCell>
                                    <TableCell><Badge variant="success">Active</Badge></TableCell>
                                    <TableCell>
                                        <ActionDropdown actions={[
                                            { label: 'Edit', icon: <Edit className="h-4 w-4" />, onClick: () => handleOpenEdit(role), variant: 'default' },
                                            { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, onClick: () => handleDelete(role.id), variant: 'danger' },
                                        ]} />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {roles.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No roles found</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(roles.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        totalItems={roles.length}
                        pageSize={itemsPerPage}
                    />
                </CardContent>
            </Card>

            <Dialog open={showModal} onOpenChange={(open) => { if (!open) setShowModal(false); }}>
                <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{editMode ? 'Edit Role' : 'New Role'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2"><Label>Role Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g., IT Manager, Finance Viewer" /></div>
                        <div className="space-y-2"><Label>Description</Label><Textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required placeholder="Describe the role's responsibilities" /></div>
                        <div className="space-y-2">
                            <Label>Permissions</Label>
                            <Card><ScrollArea className="h-[300px]"><CardContent className="pt-4">
                                {Object.entries(groupedPermissions).map(([module, perms]) => (
                                    <div key={module} className="mb-4">
                                        <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{module}</h4>
                                        <div className="space-y-1.5">
                                            {perms.map(perm => (
                                                <label key={perm.id} className="flex items-start gap-2 cursor-pointer hover:bg-accent/50 rounded px-2 py-1.5 -mx-2">
                                                    <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-input" checked={formData.permissionIds.includes(perm.id)} onChange={() => handlePermissionToggle(perm.id)} />
                                                    <div><code className="text-xs text-muted-foreground">{perm.slug}</code><span className="text-xs text-muted-foreground ml-2">{perm.description}</span></div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </CardContent></ScrollArea></Card>
                        </div>
                        <DialogFooter><Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">{editMode ? 'Update' : 'Create'} Role</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmModal show={confirmState.show} title={confirmState.title} message={confirmState.message} type={confirmState.type} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(prev => ({ ...prev, show: false }))} />
        </div>
    );
};

export default RoleMaster;
