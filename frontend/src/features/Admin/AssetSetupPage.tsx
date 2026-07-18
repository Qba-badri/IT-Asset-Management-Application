import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tag, Factory, Building2, ClipboardList, Activity, Archive } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { useAuth } from '../../hooks/useAuth';
import CategoryMaster from './CategoryMaster';
import { BrandMaster, VendorMaster, ConditionMaster, StatusMaster, DisposalMethodMaster } from './MasterPages';

type TabKey = 'categories' | 'brands' | 'vendors' | 'conditions' | 'statuses' | 'disposal-methods';

const TABS: { key: TabKey; label: string; icon: React.ElementType; permission: string; Component: React.FC }[] = [
    { key: 'categories', label: 'Categories', icon: Tag, permission: 'categories.manage', Component: CategoryMaster },
    { key: 'brands', label: 'Brands', icon: Factory, permission: 'brands.manage', Component: BrandMaster },
    { key: 'vendors', label: 'Vendors', icon: Building2, permission: 'vendors.manage', Component: VendorMaster },
    { key: 'conditions', label: 'Conditions', icon: ClipboardList, permission: 'assets.manage', Component: ConditionMaster },
    { key: 'statuses', label: 'Statuses', icon: Activity, permission: 'assets.manage', Component: StatusMaster },
    { key: 'disposal-methods', label: 'Disposal Methods', icon: Archive, permission: 'assets.manage', Component: DisposalMethodMaster },
];

const AssetSetupPage: React.FC = () => {
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
                <h1 className="text-2xl font-bold tracking-tight">Asset Setup</h1>
                <p className="text-sm text-muted-foreground">Manage asset categories, brands, vendors, and lookup lists</p>
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

export default AssetSetupPage;
