import React, { useEffect, useState, useRef } from 'react';
import {
    Plus, Edit, Trash2, Search, Eye,
    KeyRound, Users, CalendarClock, AlertTriangle, ArrowUpDown,
    Loader2, Download, ShieldCheck, RefreshCw, Filter, X, Settings2,
    Upload, FileSpreadsheet, Check, FileText as FileIcon
} from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '../../components/ui/dropdown-menu';
import { licenseService, License, LicenseType, LicenseCategory } from '../../services/licenseService';
import { authService } from '../../services/authService';
import { masterService, Lookup } from '../../services/masterService';
import { userService, User } from '../../services/userService'; // Might need for assignment logic if lifted up
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/Common/ConfirmModal';
import ActionDropdown, { ActionItem } from '../../components/Common/ActionDropdown';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatCard } from '../../components/shared/StatCard';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useCurrency } from '../../context/CurrencyContext';
import LicenseForm from './LicenseForm';
import LicenseDetails from './LicenseDetails';
import { Pagination } from '../../components/shared/Pagination';

const LicenseManagement: React.FC = () => {
    const [licenses, setLicenses] = useState<License[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<User[]>([]); 
    const [lookups, setLookups] = useState<Record<string, Lookup[]>>({});
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Filters
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('softwareName');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const { showToast } = useToast();
    const { formatCost } = useCurrency();

    // Modals
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showUnassignModal, setShowUnassignModal] = useState(false);
    const [showAdjustSeatsModal, setShowAdjustSeatsModal] = useState(false);
    const [showImportPreviewModal, setShowImportPreviewModal] = useState(false);
    const [importPreviewData, setImportPreviewData] = useState<any[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const importInputRef = useRef<HTMLInputElement>(null);

    // Selected Items
    const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
    const [confirmState, setConfirmState] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void; type?: 'danger' | 'warning' | 'primary' }>({ show: false, title: '', message: '', onConfirm: () => { } });

    // Action Form States
    const [renewData, setRenewData] = useState({ newExpiryDate: '', costChange: 0, remarks: '' });
    const [assignData, setAssignData] = useState({ userId: 0, notes: '' });
    const [unassignData, setUnassignData] = useState({ assignmentId: 0, reason: '' });
    const [adjustSeatsData, setAdjustSeatsData] = useState({ seats: 0, usedSeats: 0, reason: '' });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const init = async () => {
            try {
                const user = await authService.getProfile();
                setCurrentUser(user);
                await loadData();
            } catch (error) {
                console.error('Initialization failed:', error);
            }
        };
        init();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [licensesData, statsData, usersData, lData] = await Promise.all([
                licenseService.getLicenses(),
                licenseService.getStatistics(),
                userService.getUsers(),
                masterService.getLookups()
            ]);
            setLicenses(licensesData);
            setStats(statsData);
            setUsers(usersData);

            // Group Lookups by Type
            const groupedLookups: Record<string, Lookup[]> = {};
            lData.forEach(l => {
                if (!groupedLookups[l.type]) groupedLookups[l.type] = [];
                groupedLookups[l.type].push(l);
            });
            setLookups(groupedLookups);
        } catch (error: any) {
            console.error('Failed to load licenses:', error);
            showToast('Failed to load licenses', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedLicense(null);
        setShowFormModal(true);
    };

    const handleEdit = (license: License) => {
        setSelectedLicense(license);
        setShowFormModal(true);
    };

    const handleFormSubmit = async (data: Partial<License>) => {
        try {
            setSubmitting(true);
            if (selectedLicense) {
                await licenseService.updateLicense(selectedLicense.id, data);
                showToast('License updated successfully', 'success');
            } else {
                await licenseService.createLicense(data);
                showToast('License created successfully', 'success');
            }
            setShowFormModal(false);
            loadData();
        } catch (error: any) {
            console.error('Failed to save license:', error);
            showToast(error.response?.data?.message || 'Failed to save license', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id: number) => {
        setConfirmState({
            show: true, title: 'Delete License', message: 'Are you sure you want to delete this license? This action cannot be undone.', type: 'danger',
            onConfirm: async () => {
                try {
                    await licenseService.deleteLicense(id);
                    showToast('License deleted', 'success');
                    loadData();
                } catch (error: any) {
                    showToast(error?.response?.data?.message || 'Failed to delete', 'error');
                }
                setConfirmState(prev => ({ ...prev, show: false }));
            }
        });
    };

    const handleViewDetails = async (id: number) => {
        try {
            const license = await licenseService.getLicense(id);
            setSelectedLicense(license);
            setShowDetailsModal(true);
        } catch {
            showToast('Failed to load details', 'error');
        }
    };

    // Renewal Actions
    const openRenewModal = (license: License) => {
        setSelectedLicense(license);
        setRenewData({
            newExpiryDate: license.expiryDate ? new Date(license.expiryDate).toISOString().split('T')[0] : '',
            costChange: 0,
            remarks: ''
        });
        setShowRenewModal(true);
    };

    const openAdjustSeatsModal = (license: License) => {
        setSelectedLicense(license);
        setAdjustSeatsData({
            seats: license.totalSeats,
            usedSeats: license.usedSeats,
            reason: ''
        });
        setShowAdjustSeatsModal(true);
    };

    const submitRenewal = async () => {
        if (!selectedLicense) return;
        try {
            setSubmitting(true);
            await licenseService.renewLicense(selectedLicense.id, renewData);
            showToast('License renewed successfully', 'success');
            setShowRenewModal(false);
            if (showDetailsModal) handleViewDetails(selectedLicense.id); // Refresh details if open
            loadData();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to renew license', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const submitSeatAdjustment = async () => {
        if (!selectedLicense) return;
        try {
            setSubmitting(true);
            await licenseService.adjustSeats(selectedLicense.id, adjustSeatsData);
            showToast('Seats adjusted successfully', 'success');
            setShowAdjustSeatsModal(false);
            if (showDetailsModal) handleViewDetails(selectedLicense.id);
            loadData();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to adjust seats', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Assignment Handlers (Passed to Details)
    const handleUnassign = (assignmentId: number) => {
        setUnassignData({ assignmentId, reason: '' });
        setShowUnassignModal(true);
    };

    const submitUnassign = async () => {
        if (!unassignData.assignmentId) return;
        try {
            await licenseService.unassignLicense(unassignData.assignmentId, unassignData.reason);
            showToast('Unassigned successfully', 'success');
            setShowUnassignModal(false);
            if (selectedLicense) handleViewDetails(selectedLicense.id);
            loadData();
        } catch {
            showToast('Failed to unassign', 'error');
        }
    };

    const handleAssign = () => {
        if (selectedLicense) {
            setAssignData({ userId: 0, notes: '' });
            setShowAssignModal(true);
        }
    };

    const submitAssign = async () => {
        if (!selectedLicense || !assignData.userId) {
            showToast('Please select a user', 'error');
            return;
        }
        try {
            await licenseService.assignLicense(selectedLicense.id, assignData.userId, assignData.notes);
            showToast('License assigned successfully', 'success');
            setShowAssignModal(false);
            if (showDetailsModal) handleViewDetails(selectedLicense.id);
            loadData();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to assign license', 'error');
        }
    };

    const handleExportCSV = () => {
        if (licenses.length === 0) {
            showToast('No data to export', 'warning');
            return;
        }

        const headers = ['Software Name', 'Vendor', 'Category', 'Type', 'Total Seats', 'Used Seats', 'Expiry Date', 'Total Cost'];
        const rows = filteredLicenses.map(l => [
            l.softwareName,
            l.vendorObj?.name || l.vendor || '',
            l.category,
            l.type,
            l.totalSeats,
            l.usedSeats,
            l.expiryDate || 'Perpetual',
            l.totalCost || (l.unitPrice || 0) * l.totalSeats
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `licenses_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Licenses exported successfully', 'success');
    };

    const handleDownloadPDF = () => {
        window.print();
        showToast('Generating report view...', 'success');
    };

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            showToast('Please upload a CSV file', 'error');
            return;
        }

        try {
            setLoading(true);
            const result = await licenseService.validateImport(file);
            setImportPreviewData(result.data);
            setShowImportPreviewModal(true);
        } catch (error: any) {
            showToast('Validation failed: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setLoading(false);
            if (importInputRef.current) importInputRef.current.value = '';
        }
    };

    const handleConfirmImport = async () => {
        try {
            setIsImporting(true);
            const validLicenses = importPreviewData.filter(a => a._isValid);
            if (validLicenses.length === 0) {
                showToast('No valid licenses to import', 'error');
                return;
            }

            const result = await licenseService.confirmImport(validLicenses);
            
            if (result.success > 0) {
                showToast(`Successfully imported ${result.success} licenses`, 'success');
            }
            if (result.failed > 0) {
                showToast(`Failed to import ${result.failed} licenses.`, 'warning');
                console.error('Import Errors:', result.errors);
            }
            
            setShowImportPreviewModal(false);
            loadData();
        } catch (error: any) {
            showToast('Import failed: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            setIsImporting(false);
        }
    };

    // Filtering & Sorting
    const isExpiringSoon = (d?: string) => { if (!d) return false; const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000); return diff > 0 && diff <= 30; };
    const isExpired = (d?: string) => d ? new Date(d) < new Date() : false;

    const filteredLicenses = React.useMemo(() => {
        return licenses
            .filter(l => {
                const s = searchTerm.toLowerCase();
                const matchesSearch = !searchTerm ||
                    l.softwareName.toLowerCase().includes(s) ||
                    l.vendor?.toLowerCase().includes(s) ||
                    l.productKey?.toLowerCase().includes(s);

                if (!matchesSearch) return false;
                if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;

                if (statusFilter === 'active' && isExpired(l.expiryDate)) return false;
                if (statusFilter === 'expired' && !isExpired(l.expiryDate)) return false;
                if (statusFilter === 'expiring' && !isExpiringSoon(l.expiryDate)) return false;

                return true;
            })
            .sort((a, b) => {
                let c = 0;
                switch (sortBy) {
                    case 'softwareName': c = a.softwareName.localeCompare(b.softwareName); break;
                    case 'vendor': c = (a.vendor || '').localeCompare(b.vendor || ''); break;
                    case 'expiryDate': c = (a.expiryDate ? new Date(a.expiryDate).getTime() : 0) - (b.expiryDate ? new Date(b.expiryDate).getTime() : 0); break;
                    case 'seats': c = (a.usedSeats / a.totalSeats) - (b.usedSeats / b.totalSeats); break;
                    case 'cost': c = (a.unitPrice || 0) - (b.unitPrice || 0); break;
                }
                return sortOrder === 'asc' ? c : -c;
            });
    }, [licenses, searchTerm, categoryFilter, statusFilter, sortBy, sortOrder]);

    const paginatedLicenses = React.useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredLicenses.slice(start, start + itemsPerPage);
    }, [filteredLicenses, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, categoryFilter, statusFilter]);

    const handleDownloadSample = () => {
        const link = document.createElement('a');
        link.href = '/licenses_import_sample.csv';
        link.download = 'licenses_import_sample.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSort = (key: string) => {
        if (sortBy === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        else { setSortBy(key); setSortOrder('asc'); }
    };

    const getStatusBadge = (license: License) => {
        if (isExpired(license.expiryDate)) return <Badge variant="destructive">Expired</Badge>;
        if (isExpiringSoon(license.expiryDate)) return <Badge variant="warning">Expiring Soon</Badge>;
        return <Badge variant="success">Active</Badge>;
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    const tabs = [
        { key: 'all', label: 'All Licenses', icon: <KeyRound className="h-4 w-4" />, count: licenses.length },
        { key: 'active', label: 'Active', icon: <Check className="h-4 w-4" />, count: licenses.filter(l => !isExpired(l.expiryDate)).length },
        { key: 'expiring', label: 'Expiring Soon', icon: <CalendarClock className="h-4 w-4" />, count: licenses.filter(l => isExpiringSoon(l.expiryDate)).length },
        { key: 'expired', label: 'Expired', icon: <AlertTriangle className="h-4 w-4" />, count: licenses.filter(l => isExpired(l.expiryDate)).length },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="License Management" description="Track software licenses, subscriptions, and renewals.">
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Settings2 className="h-4 w-4" /> Manage Data
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={handleExportCSV} className="gap-2">
                                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                Export to Excel (.csv)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDownloadPDF} className="gap-2">
                                <FileIcon className="h-4 w-4 text-primary" />
                                Download PDF Report
                            </DropdownMenuItem>
                            {currentUser?.role?.name === 'Admin' && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleDownloadSample} className="gap-2">
                                        <Download className="h-4 w-4 text-blue-600" />
                                        Download Import Sample
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleImportClick} className="gap-2">
                                        <Upload className="h-4 w-4 text-purple-600" />
                                        Import Data
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {currentUser?.role?.name === 'Admin' && (
                        <>
                            <input
                                type="file"
                                ref={importInputRef}
                                className="hidden"
                                accept=".csv"
                                onChange={handleFileImport}
                            />
                            <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-2" />Add License</Button>
                        </>
                    )}
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Licenses" value={stats?.total || 0} subtitle="Unique Software" icon={KeyRound} iconColor="bg-blue-100 text-blue-600" />
                <StatCard title="Seats Utilization" value={stats?.usedSeats || 0} subtitle={`of ${stats?.totalSeats || 0} Total Seats`} icon={Users} iconColor="bg-purple-100 text-purple-600" />
                <StatCard title="Expiring Soon" value={licenses.filter(l => isExpiringSoon(l.expiryDate)).length} subtitle="Next 30 Days" icon={CalendarClock} iconColor="bg-amber-100 text-amber-600" />
                <StatCard title="Expired" value={licenses.filter(l => isExpired(l.expiryDate)).length} subtitle="Action Required" icon={AlertTriangle} iconColor="bg-destructive/10 text-destructive" />
            </div>

            <Card>
                <div className="border-b px-6 flex items-center justify-between bg-card/50 overflow-x-auto">
                    <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                        <TabsList className="bg-transparent h-auto p-0 gap-8 border-none flex justify-start">
                            {tabs.map((tab) => (
                                <TabsTrigger
                                    key={tab.key}
                                    value={tab.key}
                                    className="group relative data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-0 pb-3 pt-4 bg-transparent whitespace-nowrap gap-2 text-muted-foreground hover:text-foreground transition-all border-none"
                                >
                                    <div className="flex items-center gap-1.5">
                                        {tab.icon}
                                        <span className="font-semibold text-sm tracking-tight">{tab.label}</span>
                                        <span className="ml-0.5 px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold group-data-[state=active]:bg-primary/10 group-data-[state=active]:text-primary transition-colors">
                                            {tab.count}
                                        </span>
                                    </div>
                                    {statusFilter === tab.key && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in slide-in-from-bottom-1" />
                                    )}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>

                    <div className="pb-3 md:pb-0 flex items-center gap-3">
                        <select
                            className="flex h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            <option value={LicenseCategory.SAAS_SUB}>SaaS (Subscription)</option>
                            <option value={LicenseCategory.SAAS_USAGE}>SaaS (Usage)</option>
                            <option value={LicenseCategory.ON_PREM_SUB}>On-Prem Subscription</option>
                            <option value={LicenseCategory.ON_PREM_PERPETUAL}>On-Prem Perpetual</option>
                        </select>
                        <div className="relative w-[250px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                className="pl-9 h-9" 
                                placeholder="Search software, vendor..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                            />
                        </div>
                        {(categoryFilter !== 'all' || statusFilter !== 'all' || searchTerm) && (
                            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => { setCategoryFilter('all'); setStatusFilter('all'); setSearchTerm(''); }}>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead onClick={() => handleSort('softwareName')} className="cursor-pointer">Software / Plan <ArrowUpDown className="inline h-3 w-3" /></TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Licensing Model</TableHead>
                                <TableHead>Seats</TableHead>
                                <TableHead onClick={() => handleSort('expiryDate')} className="cursor-pointer">Expiry <ArrowUpDown className="inline h-3 w-3" /></TableHead>
                                <TableHead onClick={() => handleSort('cost')} className="cursor-pointer">Cost <ArrowUpDown className="inline h-3 w-3" /></TableHead>
                                <TableHead>Status</TableHead>
                                {currentUser?.role?.name === 'Admin' && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedLicenses.length === 0 ? (
                                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No licenses found.</TableCell></TableRow>
                            ) : (
                                paginatedLicenses.map(license => (
                                    <TableRow key={license.id}>
                                        <TableCell>
                                            <div className="font-semibold text-primary">{license.licensePlan?.name || license.planName}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                {license.softwareName}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{license.vendorObj?.name || license.vendor}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-normal">
                                                {lookups['LICENSE_CATEGORY']?.find(l => l.value === license.category)?.label || license.category?.replace(/_/g, ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {lookups['LICENSE_TYPE']?.find(l => l.value === license.type)?.label || license.type?.replace(/_/g, ' ')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm py-1">
                                                <div className="flex justify-between text-[11px] mb-1">
                                                    <span>{license.usedSeats} / {license.totalSeats}</span>
                                                    <span className="text-muted-foreground">{Math.round((license.usedSeats / license.totalSeats) * 100)}%</span>
                                                </div>
                                                <Progress value={(license.usedSeats / license.totalSeats) * 100} className="h-1.5 w-24" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">
                                            {license.expiryDate ? new Date(license.expiryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : <span className="text-muted-foreground">Perpetual</span>}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium">
                                                {new Intl.NumberFormat('en-US', {
                                                    style: 'currency',
                                                    currency: license.currency || 'USD'
                                                }).format(license.totalCost || (license.unitPrice || 0) * (license.totalSeats || 1))}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground uppercase">
                                                {license.unitPrice ? `${new Intl.NumberFormat('en-US', { style: 'currency', currency: license.currency || 'USD', maximumFractionDigits: 2 }).format(license.unitPrice)}/seat • ` : ''}
                                                {lookups['BILLING_FREQUENCY']?.find(l => l.value === license.billingFrequency)?.label || license.billingFrequency}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(license)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                <Button variant="ghost" size="icon-sm" onClick={() => handleViewDetails(license.id)} title="View Details">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {currentUser?.role?.name === 'Admin' && (
                                                    <ActionDropdown
                                                        actions={[
                                                            { label: 'Edit', icon: <Edit className="h-4 w-4" />, onClick: () => handleEdit(license), variant: 'default' as const },
                                                            { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, onClick: () => handleDelete(license.id), variant: 'danger' as const, disabled: ((license.assignments && license.assignments.length > 0) || (license.usedSeats && license.usedSeats > 0)) },
                                                        ] as ActionItem[]}
                                                    />
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredLicenses.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        totalItems={filteredLicenses.length}
                        pageSize={itemsPerPage}
                    />
                </CardContent>
            </Card>

            {/* Create / Edit Modal */}
            <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedLicense ? 'Edit License' : 'New License'}</DialogTitle>
                    </DialogHeader>
                    <LicenseForm
                        initialData={selectedLicense || {}}
                        onSubmit={handleFormSubmit}
                        onCancel={() => setShowFormModal(false)}
                        isSubmitting={submitting}
                    />
                </DialogContent>
            </Dialog>

            {/* Details Modal */}
            <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    {selectedLicense && (
                        <LicenseDetails
                            license={selectedLicense}
                            onClose={() => setShowDetailsModal(false)}
                            onAssign={handleAssign}
                            onRenew={() => openRenewModal(selectedLicense)}
                            onUnassign={handleUnassign}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Renew Modal */}
            <Dialog open={showRenewModal} onOpenChange={setShowRenewModal}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Renew License</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>New Expiry Date</Label>
                            <Input type="date" value={renewData.newExpiryDate} onChange={e => setRenewData({ ...renewData, newExpiryDate: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Cost Change (+/-)</Label>
                            <Input type="number" step="0.01" value={renewData.costChange} onChange={e => setRenewData({ ...renewData, costChange: parseFloat(e.target.value) || 0 })} />
                            <p className="text-xs text-muted-foreground">Enter difference in cost from previous term (e.g. +100 or -50).</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Remarks</Label>
                            <Input value={renewData.remarks} onChange={e => setRenewData({ ...renewData, remarks: e.target.value })} placeholder="Renewal notes..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRenewModal(false)}>Cancel</Button>
                        <Button onClick={submitRenewal}>Confirm Renewal</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Adjust Seats Modal */}
            <Dialog open={showAdjustSeatsModal} onOpenChange={setShowAdjustSeatsModal}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Adjust License Seats</DialogTitle></DialogHeader>
                    {selectedLicense && (
                        <div className="space-y-4">
                            <div className="bg-muted/50 p-3 rounded-md text-sm">
                                <p className="font-semibold text-primary">{selectedLicense.softwareName}</p>
                                <div className="flex justify-between mt-1 text-xs">
                                    <span>Current Total: <b>{selectedLicense.totalSeats}</b></span>
                                    <span>Currently Used: <b>{selectedLicense.usedSeats}</b></span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>New Total Seat Count</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={adjustSeatsData.seats}
                                    onChange={e => setAdjustSeatsData({ ...adjustSeatsData, seats: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>New Used Seat Count</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max={adjustSeatsData.seats}
                                    value={adjustSeatsData.usedSeats}
                                    onChange={e => setAdjustSeatsData({ ...adjustSeatsData, usedSeats: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="bg-primary/5 p-2 rounded border border-primary/10 text-xs flex justify-between items-center">
                                <span className="text-muted-foreground font-medium uppercase tracking-wider">Available After Adjustment</span>
                                <span className="text-lg font-bold text-primary">
                                    {Math.max(0, adjustSeatsData.seats - adjustSeatsData.usedSeats)}
                                </span>
                            </div>
                            <div className="space-y-2">
                                <Label>Adjustment Reason</Label>
                                <Input
                                    value={adjustSeatsData.reason}
                                    onChange={e => setAdjustSeatsData({ ...adjustSeatsData, reason: e.target.value })}
                                    placeholder="e.g. Scaling team, Contract update..."
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAdjustSeatsModal(false)}>Cancel</Button>
                        <Button
                            onClick={submitSeatAdjustment}
                            disabled={submitting || (adjustSeatsData.usedSeats > adjustSeatsData.seats)}
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Update Seats
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Modal */}
            <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Assign License</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Select User</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                value={assignData.userId}
                                onChange={e => setAssignData({ ...assignData, userId: parseInt(e.target.value) })}
                            >
                                <option value={0}>-- Select User --</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input value={assignData.notes} onChange={e => setAssignData({ ...assignData, notes: e.target.value })} placeholder="Assignment notes..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAssignModal(false)}>Cancel</Button>
                        <Button onClick={submitAssign}>Assign</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Unassign Reason Modal */}
            <Dialog open={showUnassignModal} onOpenChange={setShowUnassignModal}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Unassign License</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Are you sure you want to remove this license assignment? Please provide a reason for tracking.</p>
                        <div className="space-y-2">
                            <Label>Reason for Removal</Label>
                            <Input
                                value={unassignData.reason}
                                onChange={e => setUnassignData({ ...unassignData, reason: e.target.value })}
                                placeholder="e.g. Employee left company, License no longer needed..."
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowUnassignModal(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={submitUnassign} disabled={!unassignData.reason}>Unassign</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmModal show={confirmState.show} title={confirmState.title} message={confirmState.message} type={confirmState.type} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(prev => ({ ...prev, show: false }))} />

            {/* Import Preview Modal */}
            <Dialog open={showImportPreviewModal} onOpenChange={setShowImportPreviewModal}>
                <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 text-primary" />
                            Review License Import Data
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-auto my-4 border rounded-md">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 sticky top-0">
                                <tr>
                                    <th className="p-2 text-left border-b">Software Name</th>
                                    <th className="p-2 text-left border-b">Vendor</th>
                                    <th className="p-2 text-left border-b">Seats</th>
                                    <th className="p-2 text-left border-b">Expiry</th>
                                    <th className="p-2 text-left border-b">Validation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {importPreviewData.map((row, idx) => (
                                    <tr key={idx} className={row._isValid ? 'hover:bg-muted/30' : 'bg-red-50 hover:bg-red-100/50'}>
                                        <td className={`p-2 border-b ${!row.softwareName ? 'text-red-600 font-medium' : ''}`}>{row.softwareName || 'MISSING'}</td>
                                        <td className="p-2 border-b">{row.vendor || '-'}</td>
                                        <td className="p-2 border-b">{row.totalSeats || 1}</td>
                                        <td className="p-2 border-b">{row.expiryDate || 'Perpetual'}</td>
                                        <td className="p-2 border-b">
                                            {row._isValid ? (
                                                <span className="text-emerald-600 flex items-center gap-1 font-medium">
                                                    <Check className="h-3 w-3" /> Ready
                                                </span>
                                            ) : (
                                                <div className="text-red-600 flex flex-col gap-0.5">
                                                    {row._errors.map((err: string, i: number) => (
                                                        <span key={i} className="flex items-center gap-1">
                                                            <X className="h-3 w-3" /> {err}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="text-sm text-muted-foreground">
                            {importPreviewData.filter(a => a._isValid).length} of {importPreviewData.length} licenses are valid and ready to import.
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowImportPreviewModal(false)}>Cancel</Button>
                            <Button 
                                type="button" 
                                variant="default" 
                                onClick={handleConfirmImport} 
                                disabled={isImporting || importPreviewData.filter(a => a._isValid).length === 0}
                            >
                                {isImporting ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <><Upload className="h-4 w-4 mr-2" /> Confirm Import</>
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LicenseManagement;
