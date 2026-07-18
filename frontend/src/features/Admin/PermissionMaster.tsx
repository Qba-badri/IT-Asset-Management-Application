import React, { useEffect, useState } from 'react';
import { Edit, Trash2, Plus, Lock, Loader2 } from 'lucide-react';
import { rbacService, Permission, CatalogPermission } from '../../services/rbacService';
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
import { useTableSearchSort, useResetPageOnChange, SortableHead, TableSearch } from '../../components/shared/useTableSearchSort';
import { FormField } from '../../components/shared/FormField';
import { StatusToggle } from '../../components/shared/StatusToggle';
import { useForm } from '../../hooks/useForm';
import { useAuth } from '../../hooks/useAuth';

const PermissionMaster: React.FC = () => {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [catalog, setCatalog] = useState<CatalogPermission[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingStatusFor, setTogglingStatusFor] = useState<number | null>(null);
    const { showToast } = useToast();
    const { hasPermission } = useAuth();
    const canManage = hasPermission('roles.manage');

    const [confirmState, setConfirmState] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void; type?: 'danger' | 'warning' | 'primary' }>({ show: false, title: '', message: '', onConfirm: () => { } });
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedPermissionId, setSelectedPermissionId] = useState<number | null>(null);
    const {
        values: formData,
        errors,
        handleChange,
        handleBlur,
        validateForm,
        resetForm,
        setValues: setFormValues,
    } = useForm({ slug: '', module: '', description: '' }, {
        module: { label: 'Module', required: true },
        slug: {
            label: 'Permission slug',
            required: true,
            custom: (value) => {
                const v = String(value).trim();
                if (!editMode && permissions.some((p) => p.slug === v)) {
                    return 'A permission with this slug already exists.';
                }
                if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(v)) {
                    return 'Use lowercase words separated by dots, e.g. assets.create. A slug in any other shape can never match a permission check.';
                }
                return null;
            },
        },
        description: { label: 'Description', required: true },
    });

    // Both pickers come from the catalog the backend serves, so they list every
    // module the system really has and can never offer a slug no code checks.
    const availableModules = React.useMemo(
        () => [...new Set(catalog.map((c) => c.module))].sort(),
        [catalog]
    );

    /** Catalog entries for the chosen module, still free to be created. */
    const slugsForModule = React.useMemo(
        () => catalog.filter((c) => c.module === formData.module && !c.exists),
        [catalog, formData.module]
    );

    /**
     * A slug the backend has no check for grants nothing until a developer adds
     * one. That is allowed — you may register a permission ahead of its code —
     * but it must be visible, because the failure is otherwise silent.
     */
    const slugIsUncheckedByCode = React.useMemo(
        () => formData.slug.trim() !== '' && !catalog.some((c) => c.slug === formData.slug.trim()),
        [catalog, formData.slug]
    );
    const slugIsMalformed = React.useMemo(
        () => formData.slug.trim() !== '' && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(formData.slug.trim()),
        [formData.slug]
    );
    const slugAlreadyExists = React.useMemo(
        () => permissions.some((p) => p.slug === formData.slug.trim()) && !editMode,
        [permissions, formData.slug, editMode]
    );

    // Search / filter / sort
    const [moduleFilter, setModuleFilter] = useState('all');
    const listFilters = React.useMemo(
        () => [(p: Permission) => moduleFilter === 'all' || p.module === moduleFilter],
        [moduleFilter]
    );
    const { searchTerm, setSearchTerm, sortBy, sortOrder, handleSort, result: visiblePermissions, resetKey } =
        useTableSearchSort(permissions, {
            searchIn: (p) => [p.slug, p.module, p.description],
            sortValue: (p, column) =>
                column === 'id' ? p.id : column === 'module' ? p.module : column === 'description' ? p.description : p.slug,
            initialSort: 'module',
            filters: listFilters,
        });

    /** Modules present on existing permissions — what the list can be filtered to. */
    const filterableModules = React.useMemo(
        () => [...new Set(permissions.map((p) => p.module))].sort(),
        [permissions]
    );

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    useResetPageOnChange(`${resetKey}|${moduleFilter}`, setCurrentPage);

    const paginatedPermissions = React.useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return visiblePermissions.slice(start, start + itemsPerPage);
    }, [visiblePermissions, currentPage, itemsPerPage]);

    useEffect(() => { loadPermissions(); }, []);

    const loadPermissions = async () => {
        try {
            setLoading(true);
            // allSettled: the catalog is only needed by the create dialog, so a
            // failure there must not blank the list of existing permissions.
            const [perms, cat] = await Promise.allSettled([
                rbacService.getPermissions(),
                rbacService.getPermissionCatalog(),
            ]);
            if (perms.status === 'fulfilled') setPermissions(perms.value);
            if (cat.status === 'fulfilled') setCatalog(cat.value);
        } finally { setLoading(false); }
    };

    const handleOpenCreate = () => { setEditMode(false); resetForm({ slug: '', module: '', description: '' }); setShowModal(true); };

    const handleOpenEdit = (permission: Permission) => {
        setEditMode(true); setSelectedPermissionId(permission.id);
        resetForm({ slug: permission.slug, module: permission.module, description: permission.description });
        setShowModal(true);
    };

    const handleDelete = (id: number) => {
        setConfirmState({
            show: true, title: 'Delete Permission', message: 'This will revoke this capability from all roles that possess it.', type: 'danger',
            onConfirm: async () => { try { await rbacService.deletePermission(id); showToast('Permission deleted', 'success'); loadPermissions(); } catch (error: any) { showToast(error.response?.data?.message || 'Failed to delete', 'error'); } setConfirmState(prev => ({ ...prev, show: false })); }
        });
    };

    const applyPermissionStatus = async (permission: Permission, next: boolean) => {
        setTogglingStatusFor(permission.id);
        setPermissions(prev => prev.map(p => (p.id === permission.id ? { ...p, isActive: next } : p)));
        try {
            await rbacService.setPermissionStatus(permission.id, next);
            showToast(`Permission "${permission.slug}" ${next ? 'activated' : 'deactivated'}`, 'success');
        } catch (error: any) {
            setPermissions(prev => prev.map(p => (p.id === permission.id ? { ...p, isActive: permission.isActive } : p)));
            showToast(error.response?.data?.message || 'Failed to update permission status', 'error');
        } finally {
            setTogglingStatusFor(null);
        }
    };

    const handleToggleStatus = async (permission: Permission, next: boolean) => {
        if (next) {
            applyPermissionStatus(permission, next);
            return;
        }
        setTogglingStatusFor(permission.id);
        try {
            const impact = await rbacService.getPermissionImpact(permission.id);
            const names = impact.affectedNames?.length
                ? ` (${impact.affectedNames.join(', ')})`
                : '';
            setConfirmState({
                show: true,
                title: 'Deactivate Permission',
                type: 'warning',
                message:
                    `"${permission.slug}" is held by ${impact.activeAssignedCount} active role(s)${names} — users with these roles, ` +
                    `including administrators, lose this access immediately. All ${impact.totalAssignedCount} role mapping(s) are ` +
                    `preserved and restored on reactivation. The permission cannot be newly assigned while inactive.`,
                onConfirm: () => {
                    setConfirmState(prev => ({ ...prev, show: false }));
                    applyPermissionStatus(permission, next);
                },
            });
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to load permission impact', 'error');
        } finally {
            setTogglingStatusFor(prev => (prev === permission.id ? null : prev));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            if (editMode && selectedPermissionId) await rbacService.updatePermission(selectedPermissionId, formData);
            else await rbacService.createPermission(formData);
            setShowModal(false); loadPermissions(); showToast(`Permission ${editMode ? 'updated' : 'created'}`, 'success');
        } catch (error: any) {
            // The API explains *why* it refused (unknown slug, duplicate); saying
            // only "Failed to save" is what let bad slugs stay mysterious.
            showToast(error.response?.data?.message || 'Failed to save permission', 'error');
        }
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
                    <div className="flex flex-wrap items-center gap-3 px-6 pb-4">
                        <TableSearch
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search slug, module or description..."
                            label="Search permissions"
                        />
                        <select
                            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                            value={moduleFilter}
                            onChange={(e) => setModuleFilter(e.target.value)}
                            aria-label="Filter by module"
                        >
                            <option value="all">All modules</option>
                            {filterableModules.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <span className="text-xs text-muted-foreground ml-auto">
                            {visiblePermissions.length} of {permissions.length}
                        </span>
                    </div>
                    <Table>
                        <TableHeader><TableRow>
                            <SortableHead column="id" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="w-16">ID</SortableHead>
                            <SortableHead column="module" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Module</SortableHead>
                            <SortableHead column="slug" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Slug</SortableHead>
                            <SortableHead column="description" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Description</SortableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                            {paginatedPermissions.map(perm => (
                                <TableRow key={perm.id}>
                                    <TableCell className="text-muted-foreground">{perm.id}</TableCell>
                                    <TableCell><Badge variant="info">{perm.module}</Badge></TableCell>
                                    <TableCell><div className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-muted-foreground" /><code className="text-sm">{perm.slug}</code></div></TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{perm.description}</TableCell>
                                    <TableCell>
                                        <StatusToggle
                                            checked={perm.isActive !== false}
                                            onToggle={canManage ? (next) => handleToggleStatus(perm, next) : undefined}
                                            loading={togglingStatusFor === perm.id}
                                            ariaLabel={`Toggle status for ${perm.slug}`}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <ActionDropdown actions={[
                                            { label: 'Edit', icon: <Edit className="h-4 w-4" />, onClick: () => handleOpenEdit(perm), variant: 'default' },
                                            { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, onClick: () => handleDelete(perm.id), variant: 'danger' },
                                        ]} />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {visiblePermissions.length === 0 && (
                                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    {permissions.length === 0 ? 'No permissions found' : 'No permissions match your search'}
                                </TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(visiblePermissions.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        totalItems={visiblePermissions.length}
                        pageSize={itemsPerPage}
                        onPageSizeChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
                    />
                </CardContent>
            </Card>

            <Dialog open={showModal} onOpenChange={(open) => { if (!open) setShowModal(false); }}>
                <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editMode ? 'Edit Permission' : 'New Permission'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                        <FormField id="permission-module" label="Module" required error={errors.module} hint="The feature area this permission belongs to">
                            <select
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.module}
                                // Changing module invalidates the chosen slug, which belongs to the old one.
                                onChange={(e) => { handleChange('module', e.target.value); setFormValues(prev => ({ ...prev, slug: '', description: '' })); }}
                                onBlur={() => handleBlur('module')}
                                disabled={editMode}
                            >
                                <option value="">Select a module...</option>
                                {availableModules.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </FormField>

                        <div className="space-y-2"><Label htmlFor="permission-slug">Permission Slug{!editMode && <span className="ml-1 text-destructive font-bold">*</span>}</Label>
                            {editMode ? (
                                // Renaming a live slug would silently strip the capability from
                                // every role holding it, so it is fixed once created.
                                <>
                                    <div className="flex h-9 items-center gap-1.5 rounded-md border border-input bg-muted px-3 text-sm">
                                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                        <code>{formData.slug}</code>
                                    </div>
                                    <p className="text-xs text-muted-foreground">A permission's slug cannot be changed after it is created</p>
                                </>
                            ) : (
                                <>
                                    {/* A datalist, not a select: it suggests the slugs this build
                                        enforces while still accepting a custom one typed by hand. */}
                                    <FormField id="permission-slug" label="Permission Slug" hideLabel required error={errors.slug}>
                                        <Input
                                            list="permission-slug-options"
                                            value={formData.slug}
                                            onChange={(e) => {
                                                const picked = catalog.find(c => c.slug === e.target.value);
                                                // Picking a suggestion prefills its wording; typing leaves it alone.
                                                handleChange('slug', e.target.value);
                                                if (picked) setFormValues(prev => ({ ...prev, description: picked.description }));
                                            }}
                                            onBlur={() => handleBlur('slug')}
                                            autoComplete="off"
                                            placeholder={formData.module ? 'Select or type a slug...' : 'Select a module first...'}
                                            disabled={!formData.module}
                                        />
                                    </FormField>
                                    <datalist id="permission-slug-options">
                                        {slugsForModule.map(c => <option key={c.slug} value={c.slug}>{c.description}</option>)}
                                    </datalist>

                                    {slugAlreadyExists || slugIsMalformed ? null : slugIsUncheckedByCode ? (
                                        <p className="text-xs font-medium text-amber-600 dark:text-amber-500">
                                            No code in this build checks <code>{formData.slug.trim()}</code> yet — it will grant nothing
                                            until a developer adds the check. Create it only if that code is coming.
                                        </p>
                                    ) : slugsForModule.length === 0 && formData.module ? (
                                        <p className="text-xs text-muted-foreground">
                                            Every permission this build defines for {formData.module} already exists — type a slug to
                                            register a new one ahead of its code.
                                        </p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">Pick a suggested permission, or type a custom slug (lowercase, use dots)</p>
                                    )}
                                </>
                            )}
                        </div>
                        <FormField id="permission-description" label="Description" required error={errors.description}>
                            <Textarea rows={2} value={formData.description} onChange={(e) => handleChange('description', e.target.value)} onBlur={() => handleBlur('description')} placeholder="Describe what this permission allows" />
                        </FormField>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button type="submit" disabled={slugIsMalformed || slugAlreadyExists}>{editMode ? 'Update' : 'Create'} Permission</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmModal show={confirmState.show} title={confirmState.title} message={confirmState.message} type={confirmState.type} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(prev => ({ ...prev, show: false }))} />
        </div>
    );
};

export default PermissionMaster;
