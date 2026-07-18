import React, { useEffect, useState } from 'react';
import {
    Plus, Search, Edit, Trash2, History, User, Monitor,
    KeyRound, Check, Loader2, Cloud, Eye, ArrowUpDown
} from 'lucide-react';
import { userService, User as UserType, UserSource } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { rbacService, Role } from '../../services/rbacService';
import { departmentsService, Department } from '../../services/lookupService';
import ActionDropdown from '../../components/Common/ActionDropdown';
import ConfirmModal from '../../components/Common/ConfirmModal';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusToggle } from '../../components/shared/StatusToggle';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { FormField } from '../../components/shared/FormField';
import { useForm } from '../../hooks/useForm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Switch } from '../../components/ui/switch';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Pagination } from '../../components/shared/Pagination';
import UserProfileView from './UserProfileView';
import ActivityLogsTab from './ActivityLogsTab';

const UserManagement: React.FC = () => {
    const { showToast } = useToast();
    const [users, setUsers] = useState<UserType[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [syncingQPeople, setSyncingQPeople] = useState(false);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'users' | 'activity'>('users');
    const [showUserModal, setShowUserModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [viewingProfileId, setViewingProfileId] = useState<number | null>(null);
    const [userInventory, setUserInventory] = useState<any>(null);
    // Tracks which user row is currently having its role updated
    const [updatingRoleFor, setUpdatingRoleFor] = useState<number | null>(null);
    // Tracks which user row is having its active status toggled
    const [togglingActiveFor, setTogglingActiveFor] = useState<number | null>(null);
    // Bulk selection for batch activate/deactivate/delete
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [bulkWorking, setBulkWorking] = useState(false);

    // Derive current user's role/id from localStorage to gate the inline controls
    const { currentUserRole, currentUserId } = React.useMemo(() => {
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const parsed = JSON.parse(stored);
                return {
                    currentUserRole: parsed?.role?.name || '',
                    currentUserId: parsed?.id ?? null,
                };
            }
        } catch {
            // ignore parse errors
        }
        return { currentUserRole: '', currentUserId: null };
    }, []);

    const [confirmState, setConfirmState] = useState<{
        show: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'danger' | 'warning' | 'primary';
    }>({ show: false, title: '', message: '', onConfirm: () => { } });

    const {
        values: formData,
        errors,
        handleChange,
        handleBlur,
        validateForm,
        resetForm,
        setValues: setFormData
    } = useForm({
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        roleId: '',
        departmentId: '',
        designation: ''
    }, {
        email: { required: true, email: true },
        firstName: { required: true, minLength: 2 },
        lastName: { required: true, minLength: 2 },
        password: { required: !isEditing, minLength: 6 },
        roleId: { required: true }
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const u = await userService.getUsers();
            setUsers(u);
        } catch (error) {
            console.error('Failed to load users:', error);
            showToast('Failed to load users', 'error');
        }
        
        try {
            const r = await rbacService.getRoles();
            setRoles(r);
        } catch (error) {
            console.error('Failed to load roles:', error);
            // Non-critical, just log it. We might not have 'roles.view' permission.
        } finally {
            setLoading(false);
        }

        try {
            const d = await departmentsService.getAll();
            setDepartments(d.filter(dep => dep.isActive));
        } catch (error) {
            console.error('Failed to load departments:', error);
            // Non-critical; the department dropdown will just be empty.
        }
    };

    const handleSyncAzure = async () => {
        try {
            setSyncing(true);
            const result = await userService.syncAzureUsers();
            showToast(`Sync successful. Users created: ${result.createdCount}, updated: ${result.updatedCount}`, 'success');
            loadData();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Sync failed', 'error');
        } finally {
            setSyncing(false);
        }
    };

    const handleSyncQPeople = async () => {
        try {
            setSyncingQPeople(true);
            const result = await userService.syncQPeopleUsers();
            showToast(`QPeople sync successful. Users created: ${result.createdCount}, updated: ${result.updatedCount}`, 'success');
            loadData();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'QPeople sync failed', 'error');
        } finally {
            setSyncingQPeople(false);
        }
    };

    const handleViewProfile = (user: UserType) => {
        setViewingProfileId(user.id);
        setShowProfileModal(true);
    };

    const handleOpenAddModal = () => {
        setIsEditing(false);
        resetForm({ email: '', firstName: '', lastName: '', password: '', roleId: roles[0]?.id.toString() || '', departmentId: '', designation: '' });
        setFormError('');
        setShowUserModal(true);
    };

    const handleOpenEditModal = (user: UserType) => {
        setIsEditing(true);
        setSelectedUser(user);
        resetForm({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            password: '',
            roleId: user.role?.id.toString() || '',
            departmentId: user.departmentId?.toString() || user.department?.id?.toString() || '',
            designation: user.designation || ''
        });
        setFormError('');
        setShowUserModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setSubmitting(true); setFormError('');
        try {
            const payload: any = {
                ...formData,
                roleId: formData.roleId ? Number(formData.roleId) : undefined,
                departmentId: formData.departmentId ? Number(formData.departmentId) : null,
                designation: formData.designation || null,
            };
            if (!payload.password) delete payload.password;
            if (isEditing && selectedUser) await userService.updateUser(selectedUser.id, payload);
            else await userService.createUser(payload);
            setShowUserModal(false); loadData();
        } catch (error: any) { setFormError(error.response?.data?.message || error.message || 'Action failed'); }
        finally { setSubmitting(false); }
    };

    const handleDeleteUser = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try { await userService.deleteUser(id); loadData(); } catch { }
    };

    /** Inline role change — no password required, admin-only action */
    const handleRoleChange = async (userId: number, newRoleId: string) => {
        setUpdatingRoleFor(userId);
        try {
            await userService.updateUser(userId, { roleId: Number(newRoleId) });
            showToast('Role updated successfully', 'success');
            // Update local state immediately for snappy UI
            setUsers(prev => prev.map(u =>
                u.id === userId
                    ? { ...u, role: roles.find(r => r.id === Number(newRoleId)) || u.role }
                    : u
            ));
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to update role', 'error');
        } finally {
            setUpdatingRoleFor(null);
        }
    };

    const applyToggleActive = async (user: UserType, next: boolean) => {
        setTogglingActiveFor(user.id);
        try {
            await userService.updateUser(user.id, { isActive: next });
            setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, isActive: next } : u)));
            showToast(`User ${next ? 'activated' : 'deactivated'}`, 'success');
        } catch (error: any) {
            // 400 self-deactivation / 409 last-active-admin surface here verbatim
            showToast(error.response?.data?.message || 'Failed to update status', 'error');
        } finally {
            setTogglingActiveFor(null);
        }
    };

    /** Inline activate/deactivate toggle — admin-only action */
    const handleToggleActive = (user: UserType) => {
        const next = !user.isActive;
        if (next) {
            applyToggleActive(user, next);
            return;
        }
        setConfirmState({
            show: true,
            title: 'Deactivate User',
            type: 'warning',
            message: `Deactivate ${user.firstName} ${user.lastName}? Their active sessions will be signed out immediately. The account and its history are preserved and can be reactivated at any time.`,
            onConfirm: () => {
                setConfirmState(prev => ({ ...prev, show: false }));
                applyToggleActive(user, next);
            },
        });
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectPage = (pageUsers: UserType[]) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            const allSelected = pageUsers.every(u => next.has(u.id));
            pageUsers.forEach(u => allSelected ? next.delete(u.id) : next.add(u.id));
            return next;
        });
    };

    const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        const labels = { activate: 'activate', deactivate: 'deactivate', delete: 'delete' };
        setConfirmState({
            show: true,
            title: `Bulk ${labels[action]}`,
            type: action === 'activate' ? 'primary' : action === 'deactivate' ? 'warning' : 'danger',
            message: action === 'deactivate'
                ? `Deactivate ${ids.length} selected user(s)? Their sessions are signed out immediately; accounts and history are preserved and can be reactivated. Your own account is always skipped.`
                : `Are you sure you want to ${labels[action]} ${ids.length} selected user(s)?`,
            onConfirm: () => {
                setConfirmState(prev => ({ ...prev, show: false }));
                runBulkAction(action, ids);
            },
        });
    };

    const runBulkAction = async (action: 'activate' | 'deactivate' | 'delete', ids: number[]) => {
        const labels = { activate: 'activate', deactivate: 'deactivate', delete: 'delete' };
        setBulkWorking(true);
        try {
            const result = action === 'delete'
                ? await userService.bulkDelete(ids)
                : await userService.bulkSetActive(ids, action === 'activate');
            const selfNote = result.skippedSelf ? ' (your own account was skipped)' : '';
            showToast(`Bulk ${labels[action]}: ${result.affected} user(s) affected${selfNote}`, 'success');
            setSelectedIds(new Set());
            loadData();
        } catch (error: any) {
            showToast(error.response?.data?.message || `Bulk ${labels[action]} failed`, 'error');
        } finally {
            setBulkWorking(false);
        }
    };

    const getSourceLabel = (source?: UserSource): string => {
        const map: Record<string, string> = { AZURE_AD: 'Azure AD', QPEOPLE: 'QPeople', MANUAL: 'Manual' };
        return map[source || 'MANUAL'] || 'Manual';
    };

    const getSourceBadgeVariant = (source?: UserSource): any => {
        const map: Record<string, string> = { AZURE_AD: 'info', QPEOPLE: 'success', MANUAL: 'secondary' };
        return map[source || 'MANUAL'] || 'secondary';
    };

    const getRoleBadgeVariant = (roleName: string): any => {
        const map: Record<string, string> = { 'Admin': 'destructive', 'Manager': 'info', 'IT Staff': 'success', 'User': 'muted' };
        return map[roleName] || 'secondary';
    };

    // Filters & sorting
    const [roleFilter, setRoleFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [sortBy, setSortBy] = useState<string>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    const filteredUsers = React.useMemo(() => {
        const term = searchTerm.toLowerCase();
        const sortValue = (u: UserType): string => {
            switch (sortBy) {
                case 'email': return u.email || '';
                case 'role': return u.role?.name || '';
                case 'department': return u.department?.name || '';
                case 'designation': return u.designation || '';
                case 'source': return u.source || 'MANUAL';
                case 'lastLogin': return u.lastLogin || '';
                default: return `${u.firstName || ''} ${u.lastName || ''}`;
            }
        };
        return users
            .filter(user =>
                (user.email?.toLowerCase().includes(term) ||
                    user.firstName?.toLowerCase().includes(term) ||
                    user.lastName?.toLowerCase().includes(term)) &&
                (roleFilter === 'all' || user.role?.id === Number(roleFilter)) &&
                (sourceFilter === 'all' || (user.source || 'MANUAL') === sourceFilter) &&
                (statusFilter === 'all' || (statusFilter === 'active' ? user.isActive : !user.isActive)) &&
                (departmentFilter === 'all' ||
                    (departmentFilter === 'none' ? !user.department : user.department?.id === Number(departmentFilter)))
            )
            .sort((a, b) => {
                const cmp = sortValue(a).localeCompare(sortValue(b), undefined, { sensitivity: 'base' });
                return sortOrder === 'asc' ? cmp : -cmp;
            });
    }, [users, searchTerm, roleFilter, sourceFilter, statusFilter, departmentFilter, sortBy, sortOrder]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const paginatedUsers = React.useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredUsers.slice(start, start + itemsPerPage);
    }, [filteredUsers, currentPage, itemsPerPage]);

    // Reset page to 1 when search or filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, roleFilter, sourceFilter, statusFilter, departmentFilter]);

    /** Clickable sortable column header */
    const SortableHead: React.FC<{ column: string; children: React.ReactNode }> = ({ column, children }) => (
        <TableHead>
            <button
                type="button"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                onClick={() => handleSort(column)}
            >
                {children}
                <ArrowUpDown className={`h-3 w-3 ${sortBy === column ? 'text-primary' : 'text-muted-foreground/50'}`} />
                {sortBy === column && <span className="sr-only">{sortOrder === 'asc' ? 'ascending' : 'descending'}</span>}
            </button>
        </TableHead>
    );

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <PageHeader title="User Management" description="People & Access" />

            <Card>
                <CardContent className="p-0">
                    <div className="border-b px-4 pt-3">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                            <TabsList className="bg-transparent h-auto p-0 gap-4">
                                <TabsTrigger value="users" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-1 pb-3 pt-2 bg-transparent gap-1.5"><User className="h-4 w-4" />Users</TabsTrigger>
                                <TabsTrigger value="activity" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-1 pb-3 pt-2 bg-transparent gap-1.5"><History className="h-4 w-4" />Activity Logs</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {activeTab === 'users' && (
                        <>
                            <div className="p-4 border-b flex flex-wrap items-center gap-3">
                                <div className="relative flex-1 max-w-sm min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                                <select className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm cursor-pointer" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} aria-label="Filter by role">
                                    <option value="all">All Roles</option>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                                <select className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm cursor-pointer" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} aria-label="Filter by department">
                                    <option value="all">All Departments</option>
                                    <option value="none">No Department</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                                <select className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm cursor-pointer" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} aria-label="Filter by source">
                                    <option value="all">All Sources</option>
                                    <option value="MANUAL">Manual</option>
                                    <option value="AZURE_AD">Azure AD</option>
                                    <option value="QPEOPLE">QPeople</option>
                                </select>
                                <select className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm cursor-pointer" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by status">
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                {(roleFilter !== 'all' || sourceFilter !== 'all' || statusFilter !== 'all' || departmentFilter !== 'all') && (
                                    <Button variant="ghost" size="sm" onClick={() => { setRoleFilter('all'); setSourceFilter('all'); setStatusFilter('all'); setDepartmentFilter('all'); }}>Clear filters</Button>
                                )}
                                <div className="ml-auto flex gap-2">
                                    <Button variant="outline" onClick={handleSyncAzure} disabled={syncing}>
                                        {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Cloud className="h-4 w-4 mr-2" />}
                                        Sync Azure AD
                                    </Button>
                                    <Button variant="outline" onClick={handleSyncQPeople} disabled={syncingQPeople}>
                                        {syncingQPeople ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Cloud className="h-4 w-4 mr-2" />}
                                        Sync QPeople
                                    </Button>
                                    <Button onClick={handleOpenAddModal}><Plus className="h-4 w-4 mr-2" />Add User</Button>
                                </div>
                            </div>
                            {selectedIds.size > 0 && (
                                <div className="px-4 py-2 border-b bg-primary/5 flex items-center gap-3 text-sm">
                                    <span className="font-medium">{selectedIds.size} selected</span>
                                    <Button size="sm" variant="outline" disabled={bulkWorking} onClick={() => handleBulkAction('activate')}>Activate</Button>
                                    <Button size="sm" variant="outline" disabled={bulkWorking} onClick={() => handleBulkAction('deactivate')}>Deactivate</Button>
                                    <Button size="sm" variant="outline" className="text-destructive border-destructive/40 hover:bg-destructive/10" disabled={bulkWorking} onClick={() => handleBulkAction('delete')}>Delete</Button>
                                    {bulkWorking && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                                    <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelectedIds(new Set())}>Clear</Button>
                                </div>
                            )}
                            <Table>
                                <TableHeader><TableRow><TableHead className="w-[36px]"><input type="checkbox" className="h-4 w-4 accent-primary cursor-pointer" aria-label="Select all on page" checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedIds.has(u.id))} onChange={() => toggleSelectPage(paginatedUsers)} /></TableHead><SortableHead column="name">User</SortableHead><SortableHead column="role">Role</SortableHead><SortableHead column="department">Department</SortableHead><SortableHead column="designation">Designation</SortableHead><SortableHead column="source">Source</SortableHead><SortableHead column="lastLogin">Last Login</SortableHead><TableHead>Details</TableHead><TableHead>Status</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {paginatedUsers.map(user => (
                                        <TableRow key={user.id} data-state={selectedIds.has(user.id) ? 'selected' : undefined}>
                                            <TableCell><input type="checkbox" className="h-4 w-4 accent-primary cursor-pointer" aria-label={`Select ${user.firstName} ${user.lastName}`} checked={selectedIds.has(user.id)} onChange={() => toggleSelect(user.id)} /></TableCell>
                                            <TableCell><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-primary/10 text-primary">{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback></Avatar><div className="min-w-0"><div className="font-medium">{user.firstName} {user.lastName}</div><div className="text-xs text-muted-foreground truncate">{user.email}</div></div></div></TableCell>
                                            <TableCell>
                                                {currentUserRole === 'Admin' ? (
                                                    <div className="relative inline-flex items-center gap-1.5">
                                                        {updatingRoleFor === user.id && (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary absolute -left-5" />
                                                        )}
                                                        <select
                                                            id={`role-select-${user.id}`}
                                                            className="h-7 rounded-md border border-input bg-background px-2 py-0 text-xs font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                            value={user.role?.id?.toString() || ''}
                                                            disabled={updatingRoleFor === user.id}
                                                            onChange={e => handleRoleChange(user.id, e.target.value)}
                                                        >
                                                            {roles.length === 0 && (
                                                                <option value={user.role?.id?.toString() || ''}>
                                                                    {user.role?.name || 'Unknown'}
                                                                </option>
                                                            )}
                                                            {/* Inactive roles cannot be newly assigned; the user's current role stays listed even if inactive. */}
                                                            {roles
                                                                .filter(role => role.isActive !== false || role.id === user.role?.id)
                                                                .map(role => (
                                                                    <option key={role.id} value={role.id}>
                                                                        {role.isActive === false ? `${role.name} (Inactive)` : role.name}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    </div>
                                                ) : (
                                                    <Badge variant={getRoleBadgeVariant(user.role?.name || 'User')}>
                                                        {user.role?.name || 'User'}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{user.department?.name || '—'}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{user.designation || '—'}</TableCell>
                                            <TableCell>
                                                <Badge variant={getSourceBadgeVariant(user.source)}>
                                                    {getSourceLabel(user.source)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                            </TableCell>
                                            <TableCell><Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5 gap-1.5" onClick={() => handleViewProfile(user)}><Eye className="h-4 w-4" />View Profile</Button></TableCell>
                                            <TableCell>
                                                <StatusToggle
                                                    checked={user.isActive}
                                                    onToggle={currentUserRole === 'Admin' ? () => handleToggleActive(user) : undefined}
                                                    loading={togglingActiveFor === user.id}
                                                    disabled={user.id === currentUserId}
                                                    disabledReason="You cannot deactivate your own account"
                                                    ariaLabel={`Toggle status for ${user.firstName} ${user.lastName}`}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <ActionDropdown actions={[
                                                    { label: 'View Profile', icon: <Eye className="h-4 w-4" />, onClick: () => handleViewProfile(user) },
                                                    { label: 'Edit', icon: <Edit className="h-4 w-4" />, onClick: () => handleOpenEditModal(user), variant: 'default' },
                                                    { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, onClick: () => handleDeleteUser(user.id), variant: 'danger' },
                                                ]} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {paginatedUsers.length === 0 && <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(filteredUsers.length / itemsPerPage)}
                                onPageChange={setCurrentPage}
                                totalItems={filteredUsers.length}
                                pageSize={itemsPerPage}
                                onPageSizeChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
                            />
                        </>
                    )}

                    {activeTab === 'activity' && (
                        <ActivityLogsTab />
                    )}
                </CardContent>
            </Card>

            {/* User Profile Dialog */}
            <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
                    {viewingProfileId && (
                        <div className="p-6 pt-10">
                            <UserProfileView
                                userId={viewingProfileId}
                                onClose={() => setShowProfileModal(false)}
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Add/Edit User Dialog */}
            <Dialog open={showUserModal} onOpenChange={(open) => { if (!open) setShowUserModal(false); }}>
                <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        {formError && <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">{formError}</div>}

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                id="firstName"
                                label="First Name"
                                required
                                error={errors.firstName}
                                hint="Legal first name"
                            >
                                <Input
                                    value={formData.firstName}
                                    onChange={e => handleChange('firstName', e.target.value)}
                                    onBlur={() => handleBlur('firstName')}
                                    placeholder="John"
                                />
                            </FormField>

                            <FormField
                                id="lastName"
                                label="Last Name"
                                required
                                error={errors.lastName}
                                hint="Legal last name"
                            >
                                <Input
                                    value={formData.lastName}
                                    onChange={e => handleChange('lastName', e.target.value)}
                                    onBlur={() => handleBlur('lastName')}
                                    placeholder="Doe"
                                />
                            </FormField>
                        </div>

                        <FormField
                            id="email"
                            label="Email Address"
                            required
                            error={errors.email}
                            hint="User's work email address"
                        >
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={e => handleChange('email', e.target.value)}
                                onBlur={() => handleBlur('email')}
                                placeholder="john.doe@example.com"
                            />
                        </FormField>

                        <FormField
                            id="password"
                            label={isEditing ? 'New Password (Optional)' : 'Password'}
                            required={!isEditing}
                            error={errors.password}
                            hint="At least 8 characters"
                        >
                            <Input
                                type="password"
                                value={formData.password}
                                onChange={e => handleChange('password', e.target.value)}
                                onBlur={() => handleBlur('password')}
                                placeholder="••••••••"
                            />
                        </FormField>

                        <FormField
                            id="roleId"
                            label="System Role"
                            required
                            error={errors.roleId}
                            hint="Assign system permissions level"
                        >
                            <select
                                id="roleId"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={formData.roleId}
                                onChange={e => handleChange('roleId', e.target.value)}
                                onBlur={() => handleBlur('roleId')}
                            >
                                <option value="">Select a role...</option>
                                {/* Inactive roles are not offered; a currently-assigned inactive role stays visible. */}
                                {roles
                                    .filter(role => role.isActive !== false || role.id.toString() === formData.roleId)
                                    .map(role => (
                                        <option key={role.id} value={role.id}>
                                            {role.isActive === false ? `${role.name} (Inactive)` : role.name}
                                        </option>
                                    ))}
                            </select>
                        </FormField>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                id="departmentId"
                                label="Department"
                                error={errors.departmentId}
                                hint="Organizational department"
                            >
                                <select
                                    id="departmentId"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={formData.departmentId}
                                    onChange={e => handleChange('departmentId', e.target.value)}
                                >
                                    <option value="">No department</option>
                                    {departments.map(dep => <option key={dep.id} value={dep.id}>{dep.name}</option>)}
                                </select>
                            </FormField>

                            <FormField
                                id="designation"
                                label="Designation"
                                error={errors.designation}
                                hint="Job title"
                            >
                                <Input
                                    value={formData.designation}
                                    onChange={e => handleChange('designation', e.target.value)}
                                    placeholder="Software Engineer"
                                />
                            </FormField>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowUserModal(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                                {isEditing ? 'Update User' : 'Save User'}
                            </Button>
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

export default UserManagement;
