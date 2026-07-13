import React, { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Role, Permission, rbacService } from '../../services/rbacService';
import { useToast } from '../../context/ToastContext';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { ScrollArea } from '../../components/ui/scroll-area';

interface RolePermissionMatrixProps {
    roles: Role[];
    permissions: Permission[];
    onUpdate: () => void;
}

const RolePermissionMatrix: React.FC<RolePermissionMatrixProps> = ({ roles, permissions, onUpdate }) => {
    const { showToast } = useToast();
    const [updatingRole, setUpdatingRole] = useState<number | null>(null);

    // Group permissions by module
    const groupedPermissions = permissions.reduce((acc, perm) => {
        if (!acc[perm.module]) acc[perm.module] = [];
        acc[perm.module].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    const handleToggle = async (role: Role, permissionId: number) => {
        const currentPermIds = role.permissions?.map(p => p.id) || [];
        const hasPerm = currentPermIds.includes(permissionId);
        
        let newPermIds: number[];
        if (hasPerm) {
            newPermIds = currentPermIds.filter(id => id !== permissionId);
        } else {
            newPermIds = [...currentPermIds, permissionId];
        }

        try {
            setUpdatingRole(role.id);
            await rbacService.updateRole(role.id, {
                name: role.name,
                description: role.description || '',
                permissionIds: newPermIds
            });
            onUpdate(); // Reload data optimistically
            showToast(`Updated permissions for ${role.name}`, 'success');
        } catch (error) {
            showToast(`Failed to update permissions for ${role.name}`, 'error');
        } finally {
            setUpdatingRole(null);
        }
    };

    return (
        <Card className="border shadow-sm">
            <ScrollArea className="h-[600px] rounded-md">
                <Table>
                    <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                        <TableRow>
                            <TableHead className="w-[250px] font-bold bg-muted/50 border-r">Permissions \ Roles</TableHead>
                            {roles.map(role => (
                                <TableHead key={role.id} className="text-center font-bold min-w-[120px] bg-muted/50">
                                    <div className="flex flex-col items-center justify-center gap-1">
                                        <span>{role.name}</span>
                                        {updatingRole === role.id && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.entries(groupedPermissions).map(([module, perms]) => (
                            <React.Fragment key={module}>
                                {/* Module Header Row */}
                                <TableRow className="bg-muted/30">
                                    <TableCell colSpan={roles.length + 1} className="font-semibold uppercase tracking-wider text-xs text-muted-foreground py-2">
                                        {module}
                                    </TableCell>
                                </TableRow>
                                {/* Permission Rows */}
                                {perms.map(perm => (
                                    <TableRow key={perm.id} className="hover:bg-accent/10">
                                        <TableCell className="border-r">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{perm.description}</span>
                                                <code className="text-[10px] text-muted-foreground">{perm.slug}</code>
                                            </div>
                                        </TableCell>
                                        {roles.map(role => {
                                            const hasPerm = role.permissions?.some(p => p.id === perm.id);
                                            return (
                                                <TableCell key={`${role.id}-${perm.id}`} className="text-center p-0">
                                                    <label className="flex items-center justify-center w-full h-full p-3 cursor-pointer hover:bg-accent/20 transition-colors">
                                                        <input 
                                                            type="checkbox" 
                                                            className="h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer disabled:opacity-50"
                                                            checked={hasPerm || false}
                                                            onChange={() => handleToggle(role, perm.id)}
                                                            disabled={updatingRole === role.id}
                                                        />
                                                    </label>
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
        </Card>
    );
};

export default RolePermissionMatrix;
