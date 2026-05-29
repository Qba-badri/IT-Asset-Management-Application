import React, { useEffect, useState } from 'react';
import {
    Plus, Search, Edit, Trash2, History, User, Monitor,
    KeyRound, Check, Loader2, Cloud, Eye
} from 'lucide-react';
import { userService, User as UserType } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { rbacService, Role } from '../../services/rbacService';
import ActionDropdown from '../../components/Common/ActionDropdown';
import { PageHeader } from '../../components/shared/PageHeader';
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
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Pagination } from '../../components/shared/Pagination';
import UserProfileView from './UserProfileView';

const UserManagement: React.FC = () => {
    const { showToast } = useToast();
    const [users, setUsers] = useState<UserType[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
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
        roleId: ''
    }, {
        email: { required: true, email: true },
        firstName: { required: true, minLength: 2 },
        lastName: { required: true, minLength: 2 },
        password: { required: !isEditing, minLength: 6 },
        roleId: { required: true }
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try { setLoading(true); const [u, r] = await Promise.all([userService.getUsers(), rbacService.getRoles()]); setUsers(u); setRoles(r); }
        catch { } finally { setLoading(false); }
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

    const handleViewProfile = (user: UserType) => {
        setViewingProfileId(user.id);
        setShowProfileModal(true);
    };

    const handleOpenAddModal = () => {
        setIsEditing(false);
        resetForm({ email: '', firstName: '', lastName: '', password: '', roleId: roles[0]?.id.toString() || '' });
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
            roleId: user.role?.id.toString() || ''
        });
        setFormError('');
        setShowUserModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setSubmitting(true); setFormError('');
        try {
            if (isEditing && selectedUser) await userService.updateUser(selectedUser.id, formData);
            else await userService.createUser(formData);
            setShowUserModal(false); loadData();
        } catch (error: any) { setFormError(error.response?.data?.message || error.message || 'Action failed'); }
        finally { setSubmitting(false); }
    };

    const handleDeleteUser = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try { await userService.deleteUser(id); loadData(); } catch { }
    };

    const getRoleBadgeVariant = (roleName: string): any => {
        const map: Record<string, string> = { 'Admin': 'destructive', 'Manager': 'info', 'IT Staff': 'success', 'User': 'muted' };
        return map[roleName] || 'secondary';
    };

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const paginatedUsers = React.useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredUsers.slice(start, start + itemsPerPage);
    }, [filteredUsers, currentPage, itemsPerPage]);

    // Reset page to 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

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
                            <div className="p-4 border-b flex items-center gap-3">
                                <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                                <div className="ml-auto flex gap-2">
                                    <Button variant="outline" onClick={handleSyncAzure} disabled={syncing}>
                                        {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Cloud className="h-4 w-4 mr-2" />}
                                        Sync Azure AD
                                    </Button>
                                    <Button onClick={handleOpenAddModal}><Plus className="h-4 w-4 mr-2" />Add User</Button>
                                </div>
                            </div>
                            <Table>
                                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Details</TableHead><TableHead>Status</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {paginatedUsers.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-primary/10 text-primary">{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback></Avatar><span className="font-medium">{user.firstName} {user.lastName}</span></div></TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                                            <TableCell><Badge variant={getRoleBadgeVariant(user.role?.name || 'User')}>{user.role?.name || 'User'}</Badge></TableCell>
                                            <TableCell><Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5 gap-1.5" onClick={() => handleViewProfile(user)}><Eye className="h-4 w-4" />View Profile</Button></TableCell>
                                            <TableCell>
                                                <Badge variant={user.isActive ? "success" : "destructive"}>
                                                    {user.isActive ? "Active" : "Inactive"}
                                                </Badge>
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
                                    {paginatedUsers.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(filteredUsers.length / itemsPerPage)}
                                onPageChange={setCurrentPage}
                                totalItems={filteredUsers.length}
                                pageSize={itemsPerPage}
                            />
                        </>
                    )}

                    {activeTab === 'activity' && (
                        <div className="p-8 text-center text-muted-foreground">Activity logging implementation in progress...</div>
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
                                {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                            </select>
                        </FormField>

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
        </div>
    );
};

export default UserManagement;
