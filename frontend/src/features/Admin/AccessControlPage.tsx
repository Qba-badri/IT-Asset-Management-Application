import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { useAuth } from '../../hooks/useAuth';
import RoleMaster from './RoleMaster';
import PermissionMaster from './PermissionMaster';

type TabKey = 'roles' | 'permissions';

const TABS: { key: TabKey; label: string; icon: React.ElementType; permission: string; Component: React.FC }[] = [
    { key: 'roles', label: 'Roles', icon: Shield, permission: 'roles.view', Component: RoleMaster },
    { key: 'permissions', label: 'Permissions', icon: Lock, permission: 'roles.view', Component: PermissionMaster },
];

const AccessControlPage: React.FC = () => {
    const { hasPermission } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const visibleTabs = useMemo(() => TABS.filter((t) => hasPermission(t.permission)), [hasPermission]);

    const requestedTab = searchParams.get('tab') as TabKey | null;
    const activeTab = visibleTabs.some((t) => t.key === requestedTab) ? (requestedTab as TabKey) : visibleTabs[0]?.key;

    const handleTabChange = (value: string) => {
        setSearchParams({ tab: value });
    };

    if (!activeTab) {
        return null;
    }

    return (
        <div className="p-6 space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Access Control</h1>
                <p className="text-sm text-muted-foreground">Manage roles and their permissions</p>
            </div>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="flex-wrap h-auto">
                    {visibleTabs.map((tab) => (
                        <TabsTrigger key={tab.key} value={tab.key} className="gap-2">
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {visibleTabs.map((tab) => (
                    <TabsContent key={tab.key} value={tab.key}>
                        <tab.Component />
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
};

export default AccessControlPage;
