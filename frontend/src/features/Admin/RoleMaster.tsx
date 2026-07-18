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
import { useTableSearchSort, useResetPageOnChange, SortableHead, TableSearch } from '../../components/shared/useTableSearchSort';
import { FormField } from '../../components/shared/FormField';
import { StatusToggle } from '../../components/shared/StatusToggle';
import { useForm } from '../../hooks/useForm';
import { useAuth } from '../../hooks/useAuth';
import RolePermissionMatrix from './RolePermissionMatrix';

const RoleMaster: React.FC = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'list' | 'matrix'>('list');
    const [togglingStatusFor, setTogglingStatusFor] = useState<number | null>(null);
    const { showToast } = useToast();
    const { hasPermission } = useAuth();
    const canManage = hasPermission('roles.manage');

    const [confirmState, setConfirmState] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void; type?: 'danger' | 'warning' | 'primary' }>({ show: false, title: '', message: '', onConfirm: () => { } });
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
    const {
        values: formData,
        errors,
        handleChange,
        handleBlur,
        validateForm,
        resetForm,
        setValues: setFormValues,
    } = useForm({ name: '', description: '', permissionIds: [] as number[] }, {
        name: { label: 'Role name', required: true },
        description: { label: 'Description', required: true },
    });

    // Search / sort. Roles carry no status of their own, so there is nothing
    // meaningful to filter by beyond the search term.
    const { searchTerm, setSearchTerm, sortBy, sortOrder, handleSort, result: visibleRoles, resetKey } =
        useTableSearchSort(roles, {
            searchIn: (r) => [r.name, r.description, ...(r.permissions || []).map((p) => p.slug)],
            sortValue: (r, column) => {
                switch (column) {
                    case 'id': return r.id;
                    case 'description': return r.description;
                    case 'permissions': return r.permissions?.length ?? 0;
                    default: return r.name;
                }
            },
            initialSort: 'name',
        });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    useResetPageOnChange(resetKey, setCurrentPage);

    const paginatedRoles = React.useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return visibleRoles.slice(start, start + itemsPerPage);
    }, [visibleRoles, currentPage, itemsPerPage]);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try { setLoading(true); const [r, p] = await Promise.all([rbacService.getRoles(), rbacService.getPermissions()]); setRoles(r); setPermissions(p); }
        catch { } finally { setLoading(false); }
    };

    const handleOpenCreate = () => { setEditMode(false); resetForm({ name: '', description: '', permissionIds: [] }); setShowModal(true); };

    const handleOpenEdit = (role: Role) => {
        setEditMode(true); setSelectedRoleId(role.id);
        resetForm({ name: role.name, description: role.description, permissionIds: role.permissions?.map(p => p.id) || [] });
        setShowModal(true);
    };

    const handleDelete = (id: number) => {
        setConfirmState({
            show: true, title: 'Delete Role', message: 'Are you sure? Users with this role will need reassignment.', type: 'danger',
            onConfirm: async () => { try { await rbacService.deleteRole(id); showToast('Role deleted', 'success'); loadData(); } catch (error: any) { showToast(error.response?.data?.message || 'Failed to delete role', 'error'); } setConfirmState(prev => ({ ...prev, show: false })); }
        });
    };

    const applyRoleStatus = async (role: Role, next: boolean) => {
        setTogglingStatusFor(role.id);
        // Optimistic update with rollback on failure
        setRoles(prev => prev.map(r => (r.id === role.id ? { ...r, isActive: next } : r)));
        try {
            await rbacService.setRoleStatus(role.id, next);
            showToast(`Role "${role.name}" ${next ? 'activated' : 'deactivated'}`, 'success');
        } catch (error: any) {
            setRoles(prev => prev.map(r => (r.id === role.id ? { ...r, isActive: role.isActive } : r)));
            showToast(error.response?.data?.message || 'Failed to update role status', 'error');
        } finally {
            setTogglingStatusFor(null);
        }
    };

    const handleToggleStatus = async (role: Role, next: boolean) => {
        if (next) {
            // Reactivation restores the role's preserved permissions and holders.
            applyRoleStatus(role, next);
            return;
        }
        setTogglingStatusFor(role.id);
        try {
            const impact = await rbacService.getRoleImpact(role.id);
            setConfirmState({
                show: true,
                title: 'Deactivate Role',
                type: 'warning',
                message:
                    `${impact.activeAssignedCount} active user(s) hold "${role.name}" and will immediately lose its permissions. ` +
                    `All ${impact.totalAssignedCount} assignment(s) are preserved and will be restored if the role is reactivated. ` +
                    `The role can no longer be assigned to users while inactive.`,
                onConfirm: () => {
                    setConfirmState(prev => ({ ...prev, show: false }));
                    applyRoleStatus(role, next);
                },
            });
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to load role impact', 'error');
        } finally {
            setTogglingStatusFor(prev => (prev === role.id ? null : prev));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            const payload = { name: formData.name, description: formData.description, permissionIds: formData.permissionIds };
            if (editMode && selectedRoleId) await rbacService.updateRole(selectedRoleId, payload);
            else await rbacService.createRole(payload);
            setShowModal(false); loadData(); showToast(`Role ${editMode ? 'updated' : 'created'}`, 'success');
        } catch { showToast('Failed to save role', 'error'); }
    };

    const handlePermissionToggle = (permissionId: number) => {
        setFormValues(prev => ({ ...prev, permissionIds: prev.permissionIds.includes(permissionId) ? prev.permissionIds.filter(id => id !== permissionId) : [...prev.permissionIds, permissionId] }));
    };

    const groupedPermissions = permissions.reduce((acc, perm) => { if (!acc[perm.module]) acc[perm.module] = []; acc[perm.module].push(perm); return acc; }, {} as Record<string, Permission[]>);

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <PageHeader title="Role Master" description="Admin">
                <Button onClick={handleOpenCreate}><Plus className="h-4 w-4 mr-2" />Create New Role</Button>
            </PageHeader>

            <div className="flex bg-muted/50 p-1 rounded-lg w-fit">
                <Button 
                    variant={activeTab === 'list' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="w-28"
                    onClick={() => setActiveTab('list')}
                >
                    List View
                </Button>
                <Button 
                    variant={activeTab === 'matrix' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="w-28"
                    onClick={() => setActiveTab('matrix')}
                >
                    Matrix View
                </Button>
            </div>

            {activeTab === 'list' ? (
                <Card>
                    <CardContent className="p-0">
                        <div className="flex flex-wrap items-center gap-3 p-4">
                            <TableSearch
                                value={searchTerm}
                                onChange={setSearchTerm}
                                placeholder="Search roles or permissions..."
                                label="Search roles"
                            />
                            <span className="text-xs text-muted-foreground ml-auto">
                                {visibleRoles.length} of {roles.length}
                            </span>
                        </div>
                        <Table>
                            <TableHeader><TableRow>
                                <SortableHead column="id" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="w-16">ID</SortableHead>
                                <SortableHead column="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Role Name</SortableHead>
                                <SortableHead column="description" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Description</SortableHead>
                                <SortableHead column="permissions" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Permissions</SortableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                                {visibleRoles.length === 0 && (
                                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        {roles.length === 0 ? 'No roles found' : 'No roles match your search'}
                                    </TableCell></TableRow>
                                )}
                                {paginatedRoles.map(role => (
                                    <TableRow key={role.id}>
                                        <TableCell className="text-muted-foreground">{role.id}</TableCell>
                                        <TableCell className="font-medium">{role.name}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{role.description}</TableCell>
                                        <TableCell><div className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{role.permissions?.length || 0} Permissions</span></div></TableCell>
                                        <TableCell>
                                            <StatusToggle
                                                checked={role.isActive !== false}
                                                onToggle={canManage ? (next) => handleToggleStatus(role, next) : undefined}
                                                loading={togglingStatusFor === role.id}
                                                disabled={role.isSystem}
                                                disabledReason="Protected system role — cannot be deactivated"
                                                ariaLabel={`Toggle status for ${role.name}`}
                                            />
                                        </TableCell>
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
                            totalPages={Math.ceil(visibleRoles.length / itemsPerPage)}
                            onPageChange={setCurrentPage}
                            totalItems={visibleRoles.length}
                            pageSize={itemsPerPage}
                        onPageSizeChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
                        />
                    </CardContent>
                </Card>
            ) : (
                <RolePermissionMatrix 
                    roles={roles} 
                    permissions={permissions} 
                    onUpdate={loadData} 
                />
            )}

            <Dialog open={showModal} onOpenChange={(open) => { if (!open) setShowModal(false); }}>
                <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{editMode ? 'Edit Role' : 'New Role'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                        <FormField id="name" label="Role Name" required error={errors.name}>
                            <Input value={formData.name} onChange={(e) => handleChange('name', e.target.value)} onBlur={() => handleBlur('name')} placeholder="e.g., IT Manager, Finance Viewer" />
                        </FormField>
                        <FormField id="description" label="Description" required error={errors.description}>
                            <Textarea rows={2} value={formData.description} onChange={(e) => handleChange('description', e.target.value)} onBlur={() => handleBlur('description')} placeholder="Describe the role's responsibilities" />
                        </FormField>
                        <div className="space-y-2">
                            <Label>Permissions</Label>
                            <Card><ScrollArea className="h-[300px]"><CardContent className="pt-4">
                                {Object.entries(groupedPermissions).map(([module, perms]) => (
                                    <div key={module} className="mb-4">
                                        <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{module}</h4>
                                        <div className="space-y-1.5">
                                            {perms.map(perm => {
                                                const isChecked = formData.permissionIds.includes(perm.id);
                                                const inactive = perm.isActive === false;
                                                // An inactive permission cannot be newly assigned; one the role
                                                // already holds stays listed (preserved mapping) and may be removed.
                                                const locked = inactive && !isChecked;
                                                return (
                                                    <label key={perm.id} className={`flex items-start gap-2 rounded px-2 py-1.5 -mx-2 ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-accent/50'}`} title={locked ? 'Inactive permission — reactivate it before assigning' : undefined}>
                                                        <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-input" checked={isChecked} disabled={locked} onChange={() => handlePermissionToggle(perm.id)} />
                                                        <div>
                                                            <code className="text-xs text-muted-foreground">{perm.slug}</code>
                                                            {inactive && <span className="text-[10px] font-bold uppercase text-destructive ml-1.5">(Inactive)</span>}
                                                            <span className="text-xs text-muted-foreground ml-2">{perm.description}</span>
                                                        </div>
                                                    </label>
                                                );
                                            })}
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
