import React, { useEffect, useState } from 'react';
import {
    User, Mail, Shield, Calendar, MapPin,
    Loader2, Monitor, KeyRound, Phone,
    Info, History, CheckCircle2, AlertCircle
} from 'lucide-react';
import { userService, User as UserType } from '../../services/userService';
import {
    Button,
    Card, CardContent, CardHeader, CardTitle,
    Avatar, AvatarFallback,
    Badge,
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    Tabs, TabsContent, TabsList, TabsTrigger
} from '../../components/ui';

interface UserProfileViewProps {
    userId: number;
    onClose?: () => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ userId, onClose }) => {
    const [user, setUser] = useState<UserType | null>(null);
    const [inventory, setInventory] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // Fetch basic user details and inventory
                const [userData, inventoryData] = await Promise.all([
                    userService.getUser(userId),
                    userService.getUserInventory(userId)
                ]);
                setUser(userData);
                setInventory(inventoryData);
            } catch (error) {
                console.error("Failed to load user profile", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [userId]);

    if (loading) {
        return (
            <div className="flex h-[450px] items-center justify-center p-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <div>
                    <h3 className="text-xl font-bold">User Not Found</h3>
                    <p className="text-muted-foreground">The requested user profile could not be loaded.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-xl border bg-card shadow-sm">
                <div className="h-24 bg-gradient-to-r from-primary/10 via-primary/5 to-background" />
                <div className="px-6 pb-6">
                    <div className="flex flex-col sm:flex-row items-end gap-4 -mt-10 mb-4">
                        <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                            <AvatarFallback className="text-2xl bg-primary text-primary-foreground font-bold">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 pb-1">
                            <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
                            <p className="text-muted-foreground flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5" />
                                {user.email}
                            </p>
                        </div>
                        <div className="flex gap-2 pb-1">
                            {user.isActive ? (
                                <Badge variant="success" className="h-7 px-3 gap-1">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Active
                                </Badge>
                            ) : (
                                <Badge variant="destructive" className="h-7 px-3 gap-1">
                                    <AlertCircle className="h-3.5 w-3.5" /> Inactive
                                </Badge>
                            )}
                            <Badge variant="outline" className="h-7 px-3 border-primary/20 bg-primary/5 text-primary">
                                <Shield className="h-3.5 w-3.5 mr-1" /> {user.role?.name || 'User'}
                            </Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <Monitor className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Assigned Assets</p>
                                <p className="text-lg font-bold">{inventory?.assignedAssets?.length || 0}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                <KeyRound className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Licenses</p>
                                <p className="text-lg font-bold">{inventory?.licenseAssignments?.length || 0}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Last Login</p>
                                <p className="text-sm font-bold">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="assets">Assets</TabsTrigger>
                    <TabsTrigger value="licenses">Licenses</TabsTrigger>
                    <TabsTrigger value="activity">History</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase">
                                    <User className="h-4 w-4" /> Basic Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5">Full Name</p>
                                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5">Email Address</p>
                                        <p className="font-medium">{user.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5">System Role</p>
                                        <p className="font-medium">{user.role?.name || 'Standard User'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5">Account Status</p>
                                        <p className="font-medium">{user.isActive ? 'Active' : 'Inactive'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase">
                                    <MapPin className="h-4 w-4" /> Workplace & Contact
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5">Location</p>
                                        <p className="font-medium">{user.location || 'Not Specified'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5">Phone Number</p>
                                        <p className="font-medium">{user.phoneNumber || 'Not Provided'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-muted-foreground mb-0.5">Department</p>
                                        <p className="font-medium">Information Technology</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase">
                                <Info className="h-4 w-4" /> Account Identification
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-3 border rounded bg-muted/20">
                                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Internal Database ID</p>
                                    <p className="font-mono text-sm">USER-{user.id.toString().padStart(4, '0')}</p>
                                </div>
                                <div className="p-3 border rounded bg-muted/20">
                                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Creation Date</p>
                                    <p className="text-sm font-medium">{new Date(user.createdAt || '').toLocaleDateString()}</p>
                                </div>
                                <div className="p-3 border rounded bg-muted/20">
                                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Source Interface</p>
                                    <Badge variant="outline" className="font-normal border-dashed">Web Administration</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="assets" className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead>Asset Tag</TableHead>
                                        <TableHead>Model/Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Serial Number</TableHead>
                                        <TableHead>Deployment Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(inventory?.assignedAssets || []).length > 0 ? (
                                        inventory?.assignedAssets?.map((asset: any) => (
                                            <TableRow key={asset.id} className="hover:bg-muted/20 transition-colors">
                                                <TableCell className="font-bold text-primary">{asset.assetTag}</TableCell>
                                                <TableCell className="font-medium">{asset.model || asset.name}</TableCell>
                                                <TableCell><Badge variant="outline">{asset.category}</Badge></TableCell>
                                                <TableCell className="text-sm font-mono text-muted-foreground">{asset.serialNumber || 'N/A'}</TableCell>
                                                <TableCell className="text-sm">
                                                    {asset.deploymentDate ? new Date(asset.deploymentDate).toLocaleDateString() : '—'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                                No hardware assets currently assigned to this user.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="licenses" className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead>Software License</TableHead>
                                        <TableHead>Vendor</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Assigned At</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(inventory?.licenseAssignments || []).length > 0 ? (
                                        inventory?.licenseAssignments?.map((la: any) => (
                                            <TableRow key={la.id} className="hover:bg-muted/20 transition-colors">
                                                <TableCell className="font-semibold">{la.license?.softwareName}</TableCell>
                                                <TableCell className="text-sm">{la.license?.vendor}</TableCell>
                                                <TableCell><Badge variant="outline" className="capitalize">{la.license?.type}</Badge></TableCell>
                                                <TableCell className="text-sm">
                                                    {new Date(la.assignedAt).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                                No software licenses currently assigned to this user.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activity" className="mt-4">
                    <Card>
                        <CardContent className="p-8 text-center flex flex-col items-center justify-center gap-3">
                            <History className="h-10 w-10 text-muted-foreground opacity-20" />
                            <div>
                                <h4 className="font-medium">No Activity History</h4>
                                <p className="text-sm text-muted-foreground">Audit logs for this specific user profile are currently being indexed.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {onClose && (
                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button variant="outline" onClick={onClose}>Close Profile</Button>
                </div>
            )}
        </div>
    );
};

export default UserProfileView;
