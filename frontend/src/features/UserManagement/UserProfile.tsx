import React, { useEffect, useState } from 'react';
import {
    User, Mail, Shield, Calendar, MapPin,
    Camera, Check, Loader2, Monitor, KeyRound, Package
} from 'lucide-react';
import { authService } from '../../services/authService';
import { userService, User as UserType } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/shared/PageHeader';
import {
    Button,
    Card, CardContent, CardHeader, CardTitle,
    Input,
    Label,
    Avatar, AvatarFallback,
    Badge,
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../components/ui';
import { FormField } from '../../components/shared/FormField';
import { useForm } from '../../hooks/useForm';

const UserProfile: React.FC = () => {
    const [profile, setProfile] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [inventory, setInventory] = useState<UserType | null>(null);
    const [loadingInventory, setLoadingInventory] = useState(false);
    const { showToast } = useToast();

    const {
        values: formData,
        errors,
        handleChange,
        handleBlur,
        validateForm,
        setValues: setFormData
    } = useForm({
        firstName: '',
        lastName: '',
        email: '',
        location: '',
        phoneNumber: ''
    }, {
        firstName: { required: true },
        lastName: { required: true },
        email: { required: true, email: true },
        phoneNumber: { phone: true }
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await authService.getProfile();
            setProfile(data);
            setFormData({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: data.email || '',
                location: data.location || '',
                phoneNumber: data.phoneNumber || ''
            });
            loadInventory();
        } catch (error) {
            showToast('Failed to load profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadInventory = async () => {
        try {
            setLoadingInventory(true);
            // Self-service endpoint — works for every role, including Standard User.
            const data = await userService.getMyInventory();
            setInventory(data);
        } catch (error) {
            console.error('Failed to load user inventory', error);
        } finally {
            setLoadingInventory(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            setSaving(true);
            await authService.updateProfile(formData);
            showToast('Profile updated successfully', 'success');
            loadProfile();
        } catch (error: any) {
            showToast(error.message || 'Failed to update profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Profile"
                description="Manage your personal information and view your assigned assets"
            />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Profile Information */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateProfile} autoComplete="off" className="space-y-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                <div className="relative">
                                    <Avatar className="h-24 w-24">
                                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                            {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon-sm"
                                        className="absolute -bottom-1 -right-1 rounded-full bg-background shadow-sm"
                                    >
                                        <Camera className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold">{profile?.firstName} {profile?.lastName}</h3>
                                    <p className="text-sm text-muted-foreground">{profile?.role?.name || 'Administrator'}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <Badge variant="outline" className="gap-1.5">
                                            <Calendar className="h-3 w-3" />
                                            Joined {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : 'Recently'}
                                        </Badge>
                                        <Badge variant="success" className="gap-1.5">
                                            <Shield className="h-3 w-3" />
                                            Active Account
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <hr className="my-6" />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    id="firstName"
                                    label="First Name"
                                    required
                                    error={errors.firstName}
                                >
                                    <Input
                                        id="firstName"
                                        value={formData.firstName}
                                        onChange={(e) => handleChange('firstName', e.target.value)}
                                        onBlur={() => handleBlur('firstName')}
                                        placeholder="John"
                                    />
                                </FormField>
                                <FormField
                                    id="lastName"
                                    label="Last Name"
                                    required
                                    error={errors.lastName}
                                >
                                    <Input
                                        id="lastName"
                                        value={formData.lastName}
                                        onChange={(e) => handleChange('lastName', e.target.value)}
                                        onBlur={() => handleBlur('lastName')}
                                        placeholder="Doe"
                                    />
                                </FormField>
                                <div className="sm:col-span-2">
                                    <FormField
                                        id="email"
                                        label="Email Address"
                                        required
                                        error={errors.email}
                                        hint="Used for notifications and account security"
                                    >
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                className="pl-9"
                                                value={formData.email}
                                                onChange={(e) => handleChange('email', e.target.value)}
                                                onBlur={() => handleBlur('email')}
                                                placeholder="john.doe@company.com"
                                            />
                                        </div>
                                    </FormField>
                                </div>
                                <FormField
                                    id="location"
                                    label="Primary Location"
                                    error={errors.location}
                                >
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="location"
                                            className="pl-9"
                                            value={formData.location}
                                            onChange={(e) => handleChange('location', e.target.value)}
                                            onBlur={() => handleBlur('location')}
                                            placeholder="e.g. Headquarters, London"
                                        />
                                    </div>
                                </FormField>
                                <FormField
                                    id="phoneNumber"
                                    label="Phone Number"
                                    error={errors.phoneNumber}
                                >
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">+</span>
                                        <Input
                                            id="phoneNumber"
                                            className="pl-7"
                                            value={formData.phoneNumber}
                                            onChange={(e) => handleChange('phoneNumber', e.target.value)}
                                            onBlur={() => handleBlur('phoneNumber')}
                                            placeholder="1 234 567 890"
                                        />
                                    </div>
                                </FormField>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={saving}>
                                    {saving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Account Summary & Stats */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Portfolio Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1 p-3 rounded-lg bg-blue-50 border border-blue-100">
                                    <Monitor className="h-5 w-5 text-blue-600 mb-1" />
                                    <p className="text-2xl font-bold text-blue-700">{inventory?.assignedAssets?.length || 0}</p>
                                    <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">Assets</p>
                                </div>
                                <div className="space-y-1 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                                    <KeyRound className="h-5 w-5 text-emerald-600 mb-1" />
                                    <p className="text-2xl font-bold text-emerald-700">{inventory?.licenseAssignments?.length || 0}</p>
                                    <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider">Licenses</p>
                                </div>
                                <div className="space-y-1 p-3 rounded-lg bg-amber-50 border border-amber-100">
                                    <Package className="h-5 w-5 text-amber-600 mb-1" />
                                    <p className="text-2xl font-bold text-amber-700">{inventory?.inventoryAssignments?.length || 0}</p>
                                    <p className="text-xs text-amber-600 font-medium uppercase tracking-wider">Inventory</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                                        <MapPin className="h-4 w-4 text-slate-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Primary Location</p>
                                        <p className="text-xs text-muted-foreground">{profile?.location || 'Not Specified'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                                        <Shield className="h-4 w-4 text-slate-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Security Access</p>
                                        <p className="text-xs text-muted-foreground">{profile?.role?.name || 'Standard User'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-indigo-50 to-white overflow-hidden border-indigo-100">
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <h4 className="font-bold text-indigo-900">Need Help?</h4>
                                <p className="text-sm text-indigo-700">
                                    If you're having issues with your assigned equipment or need to request new software, contact IT Support.
                                </p>
                                <Button variant="outline" className="w-full bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                    Contact Support
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Assets Table */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Monitor className="h-5 w-5" />
                            My Assigned Assets
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loadingInventory ? (
                            <div className="flex h-[200px] items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Asset Tag</TableHead>
                                        <TableHead>Model</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Serial Number</TableHead>
                                        <TableHead>Assigned Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(inventory?.assignedAssets || []).length > 0 ? (
                                        inventory?.assignedAssets?.map((asset: any) => (
                                            <TableRow key={asset.id}>
                                                <TableCell className="font-mono font-bold text-primary">{asset.assetTag}</TableCell>
                                                <TableCell className="font-medium">{asset.model || asset.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{asset.category}</Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{asset.serialNumber || '-'}</TableCell>
                                                <TableCell className="text-sm">
                                                    {asset.deploymentDate ? new Date(asset.deploymentDate).toLocaleDateString() : 'N/A'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                                No assets are currently assigned to you.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Licenses Table */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <KeyRound className="h-5 w-5" />
                            My Licenses
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loadingInventory ? (
                            <div className="flex h-[160px] items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Software</TableHead>
                                        <TableHead>Product Key</TableHead>
                                        <TableHead>Expiry Date</TableHead>
                                        <TableHead>Assigned Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(inventory?.licenseAssignments || []).length > 0 ? (
                                        inventory?.licenseAssignments?.map((la: any) => (
                                            <TableRow key={la.id}>
                                                <TableCell className="font-medium">
                                                    {la.license?.softwareName || la.license?.planName || '-'}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm text-muted-foreground">
                                                    {la.license?.productKey || '-'}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {la.license?.expiryDate ? new Date(la.license.expiryDate).toLocaleDateString() : 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {la.assignedAt ? new Date(la.assignedAt).toLocaleDateString() : 'N/A'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                                No licenses are currently assigned to you.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Inventory Table */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            My Inventory
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loadingInventory ? (
                            <div className="flex h-[160px] items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Assigned Date</TableHead>
                                        <TableHead>Expected Return</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(inventory?.inventoryAssignments || []).length > 0 ? (
                                        inventory?.inventoryAssignments?.map((ia: any) => (
                                            <TableRow key={ia.id}>
                                                <TableCell className="font-medium">
                                                    {ia.item?.name || ia.item?.itemName || '-'}
                                                </TableCell>
                                                <TableCell className="text-sm">{ia.quantity}</TableCell>
                                                <TableCell className="text-sm">
                                                    {ia.assignmentDate ? new Date(ia.assignmentDate).toLocaleDateString() : 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {ia.expectedReturnDate ? new Date(ia.expectedReturnDate).toLocaleDateString() : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                                No inventory items are currently assigned to you.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default UserProfile;
