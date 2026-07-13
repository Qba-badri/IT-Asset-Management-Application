import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Plus, Eye, Edit, Trash2, User, Wrench, Recycle,
    Check, Monitor, ImageIcon, Loader2, Upload, X,
    Search, ArrowUpDown, Download, FileSpreadsheet, FileText as FileIcon, Settings2
} from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '../../components/ui/dropdown-menu';
import { assetService, Asset } from '../../services/assetService';
import { userService, User as UserType } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';
import { useCurrency, CURRENCY_OPTIONS } from '../../context/CurrencyContext';
import ConfirmModal from '../../components/Common/ConfirmModal';
import ActionDropdown, { ActionItem } from '../../components/Common/ActionDropdown';
import { PageHeader } from '../../components/shared/PageHeader';
import { masterService, Brand, Vendor, Lookup } from '../../services/masterService';
import { categoryService } from '../../services/categoryService';
import { StatCard } from '../../components/shared/StatCard';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '../../components/ui/dialog';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { Pagination } from '../../components/shared/Pagination';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { FormField } from '../../components/shared/FormField';
import { useForm } from '../../hooks/useForm';

type TabKey = 'all' | 'available' | 'deployed' | 'maintenance' | 'disposed';

const AssetManagement: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [users, setUsers] = useState<UserType[]>([]);
    const [assetPhotos, setAssetPhotos] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabKey>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Asset | 'assignedTo'; direction: 'asc' | 'desc' } | null>(null);
    const [currentUser, setCurrentUser] = useState<UserType | null>(null);
    const { showToast } = useToast();
    const { formatCost, currencySymbol } = useCurrency();

    // Modal States
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [showDeployModal, setShowDeployModal] = useState(false);
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [showMaintenanceCompleteModal, setShowMaintenanceCompleteModal] = useState(false);
    const [showDisposalModal, setShowDisposalModal] = useState(false);
    interface ImportAsset extends Asset {
        _isValid?: boolean;
        _errors?: string[];
    }
    const [showImportPreviewModal, setShowImportPreviewModal] = useState(false);
    const [importPreviewData, setImportPreviewData] = useState<ImportAsset[]>([]);
    const [isImporting, setIsImporting] = useState(false);

    const [editMode, setEditMode] = useState(false);
    const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);

    // Master Data States
    interface Category { id: number; name: string; allowedTargetTypes?: string[]; }
    const [masterCategories, setMasterCategories] = useState<Category[]>([]);
    const [masterBrands, setMasterBrands] = useState<Brand[]>([]);
    const [masterVendors, setMasterVendors] = useState<Vendor[]>([]);
    const [masterConditions, setMasterConditions] = useState<Lookup[]>([]);
    const [masterStatuses, setMasterStatuses] = useState<Lookup[]>([]);
    const [masterDisposalMethods, setMasterDisposalMethods] = useState<Lookup[]>([]);
    const [allowedTargetTypes, setAllowedTargetTypes] = useState<string[]>(['PERSON']);

    // Confirm Modal
    const [confirmState, setConfirmState] = useState<{
        show: boolean; title: string; message: string;
        onConfirm: () => void; type?: 'danger' | 'warning' | 'primary';
    }>({ show: false, title: '', message: '', onConfirm: () => { } });

    // Form Data
    const categories = ['laptop', 'desktop', 'mobile', 'tablet', 'printer', 'monitor', 'network', 'server', 'other'];
    const conditions = ['new', 'good', 'fair', 'poor', 'damaged'];

    const {
        values: assetFormData,
        errors: assetErrors,
        handleChange: handleAssetChange,
        handleBlur: handleAssetBlur,
        validateForm: validateAssetForm,
        resetForm: resetAssetForm,
        setValues: setAssetValues
    } = useForm({
        assetTag: '', name: '', category: '', condition: 'new', status: 'available', acquisitionType: 'purchased',
        brand: '', model: '', serialNumber: '', purchaseDate: '', purchaseCost: '', currency: 'INR', vendor: '',
        receivedFromVendorDate: '', vendorMonthlyRent: '', warrantyExpiry: '', usefulLifeYears: '5',
        salvageValue: '', location: '', notes: '',
        hostname: '', poNumber: '', invoiceNumber: '', costCenter: '', businessOwnerId: '',
        warrantyType: '', warrantyStart: '', maintenanceCycleDays: '',
    }, {
        assetTag: { required: true, minLength: 3 },
        name: { required: true, minLength: 3 },
        category: { required: true },
        condition: { required: true },
        status: { required: true },
        purchaseCost: { min: 0 },
        usefulLifeYears: { min: 1 }
    });

    const {
        values: deployFormData,
        errors: deployErrors,
        handleChange: handleDeployChange,
        handleBlur: handleDeployBlur,
        validateForm: validateDeployForm,
        resetForm: resetDeployForm,
        setValues: setDeployValues
    } = useForm({
        targetType: 'PERSON',
        userId: '',
        location: '',
        site: '',
        building: '',
        floor: '',
        roomDesk: '',
        deploymentDate: ''
    }, {
        targetType: { required: true },
        userId: { custom: (val, all) => (all.targetType === 'PERSON' && !val) ? 'User is required for PERSON assignment.' : null },
        deploymentDate: { required: true }
    });

    const {
        values: maintenanceFormData,
        errors: maintenanceErrors,
        handleChange: handleMaintenanceChange,
        handleBlur: handleMaintenanceBlur,
        validateForm: validateMaintenanceForm,
        resetForm: resetMaintenanceForm
    } = useForm({
        lastMaintenanceDate: '', nextMaintenanceDate: '', maintenanceNotes: '',
    }, {
        lastMaintenanceDate: { required: true },
        nextMaintenanceDate: { required: true },
    });

    const {
        values: disposalFormData,
        errors: disposalErrors,
        handleChange: handleDisposalChange,
        handleBlur: handleDisposalBlur,
        validateForm: validateDisposalForm,
        resetForm: resetDisposalForm
    } = useForm({
        disposalDate: '', disposalMethod: '', disposalReason: '', disposalNotes: '',
    }, {
        disposalDate: { required: true },
        disposalMethod: { required: true },
        disposalReason: { required: true, minLength: 5 }
    });

    const {
        values: maintenanceCompleteFormData,
        errors: maintenanceCompleteErrors,
        handleChange: handleMaintenanceCompleteChange,
        handleBlur: handleMaintenanceCompleteBlur,
        validateForm: validateMaintenanceCompleteForm,
        resetForm: resetMaintenanceCompleteForm
    } = useForm({
        maintenanceCompletedDate: '', workPerformed: '', completionNotes: '', nextMaintenanceDate: '',
    }, {
        maintenanceCompletedDate: { required: true },
        workPerformed: { required: true, minLength: 5 }
    });

    const [submittingAsset, setSubmittingAsset] = useState(false);
    const [submittingAction, setSubmittingAction] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Image upload state
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    useEffect(() => {
        const state = location.state as { editAsset?: Asset };
        if (state?.editAsset) {
            handleOpenEdit(state.editAsset);
            // Clear the state so it doesn't re-open on back navigation
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);

    // Auto-generate asset tag when category changes in create mode
    useEffect(() => {
        if (!editMode && assetFormData.category) {
            assetService.generateNextTag(assetFormData.category)
                .then(res => {
                    handleAssetChange('assetTag', res.assetTag);
                })
                .catch(err => console.error('Failed to generate tag', err));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assetFormData.category, editMode]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [assetsData, usersData] = await Promise.all([
                assetService.getAssets(),
                userService.getUsers()
            ]);
            setAssets(assetsData);
            setUsers(usersData.filter((u: UserType) => u.isActive));

            // Load Master Data separately to avoid blocking
            categoryService.getCategories().then(setMasterCategories).catch(e => console.error('Cats fail', e));
            masterService.getBrands().then(setMasterBrands).catch(e => console.error('Brands fail', e));
            masterService.getVendors().then(setMasterVendors).catch(e => console.error('Vendors fail', e));
            masterService.getLookups('ASSET_CONDITION').then(setMasterConditions).catch(e => console.error('Conds fail', e));
            masterService.getLookups('ASSET_STATUS').then(setMasterStatuses).catch(e => console.error('Statuses fail', e));
            masterService.getLookups('DISPOSAL_METHOD').then(setMasterDisposalMethods).catch(e => console.error('Disposal fail', e));

            const photoMap: Record<number, number> = {};
            assetsData.forEach(asset => {
                photoMap[asset.id] = asset.photos?.length || 0;
            });
            setAssetPhotos(photoMap);
        } catch (error: unknown) {
            console.error('Critical load failure', error);
            const err = error as { response?: { data?: { message?: string } }, message?: string };
            const msg = err.response?.data?.message || err.message || 'Unknown error';
            showToast(`Failed to load core asset data: ${msg}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditMode(false);
        resetAssetForm({
            assetTag: '', name: '', category: '', condition: 'new', status: 'available', acquisitionType: 'purchased',
            brand: '', model: '', serialNumber: '', purchaseDate: '', purchaseCost: '', currency: 'INR', vendor: '',
            receivedFromVendorDate: '', vendorMonthlyRent: '', warrantyExpiry: '', usefulLifeYears: '5',
            salvageValue: '', location: '', notes: '',
            hostname: '', poNumber: '', invoiceNumber: '', costCenter: '', businessOwnerId: '',
            warrantyType: '', warrantyStart: '', maintenanceCycleDays: '',
        });
        setSelectedImages([]);
        setImagePreviewUrls([]);
        setShowAssetModal(true);
    };

    const handleOpenEdit = (asset: Asset) => {
        setEditMode(true);
        setSelectedAssetId(asset.id);
        resetAssetForm({
            assetTag: asset.assetTag, name: asset.name, category: asset.category, condition: asset.condition,
            status: asset.status, acquisitionType: asset.acquisitionType || 'purchased',
            brand: asset.brand || '', model: asset.model || '', serialNumber: asset.serialNumber || '',
            purchaseDate: asset.purchaseDate?.split('T')[0] || '', purchaseCost: asset.purchaseCost?.toString() || '',
            currency: asset.currency || 'INR',
            vendor: asset.vendor || '', receivedFromVendorDate: asset.receivedFromVendorDate?.split('T')[0] || '',
            vendorMonthlyRent: asset.vendorMonthlyRent?.toString() || '',
            warrantyExpiry: asset.warrantyExpiry?.split('T')[0] || '',
            usefulLifeYears: asset.usefulLifeYears?.toString() || '5', salvageValue: asset.salvageValue?.toString() || '',
            location: asset.location || '', notes: asset.notes || '',
            hostname: asset.hostname || '', poNumber: asset.poNumber || '',
            invoiceNumber: asset.invoiceNumber || '', costCenter: asset.costCenter || '',
            businessOwnerId: asset.businessOwnerId?.toString() || '',
            warrantyType: asset.warrantyType || '',
            warrantyStart: asset.warrantyStart?.split('T')[0] || '',
            maintenanceCycleDays: asset.maintenanceCycleDays?.toString() || '',
        });
        setSelectedImages([]);
        setImagePreviewUrls([]);
        setShowAssetModal(true);
    };

    const handleViewDetails = (id: number) => {
        navigate(`/dashboard/assets/${id}`);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (newFiles.length === 0) return;
        setSelectedImages(prev => [...prev, ...newFiles]);
        const newUrls = newFiles.map(f => URL.createObjectURL(f));
        setImagePreviewUrls(prev => [...prev, ...newUrls]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeSelectedImage = (index: number) => {
        URL.revokeObjectURL(imagePreviewUrls[index]);
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmitAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateAssetForm()) return;

        try {
            setSubmittingAsset(true);
            const isRented = assetFormData.acquisitionType === 'rented';
            const isPurchased = assetFormData.acquisitionType === 'purchased';

            const payload = {
                ...assetFormData,
                // Shared fields cleanup
                brand: assetFormData.brand || null,
                model: assetFormData.model || null,
                serialNumber: assetFormData.serialNumber || null,
                vendor: assetFormData.vendor || null,
                location: assetFormData.location || null,
                notes: assetFormData.notes || null,
                warrantyExpiry: assetFormData.warrantyExpiry || null,
                performedBy: currentUser?.id ? Number(currentUser.id) : undefined,

                // New fields
                hostname: assetFormData.hostname || null,
                poNumber: assetFormData.poNumber || null,
                invoiceNumber: assetFormData.invoiceNumber || null,
                costCenter: assetFormData.costCenter || null,
                businessOwnerId: assetFormData.businessOwnerId ? parseInt(assetFormData.businessOwnerId) : null,
                warrantyType: assetFormData.warrantyType || null,
                warrantyStart: assetFormData.warrantyStart || null,
                maintenanceCycleDays: assetFormData.maintenanceCycleDays ? parseInt(assetFormData.maintenanceCycleDays) : null,

                // Purchase-only fields (clear if rented)
                purchaseDate: isPurchased ? (assetFormData.purchaseDate || null) : null,
                purchaseCost: isPurchased ? (assetFormData.purchaseCost ? parseFloat(assetFormData.purchaseCost) : null) : null,
                currency: assetFormData.currency || 'INR',
                usefulLifeYears: isPurchased ? (assetFormData.usefulLifeYears ? parseInt(assetFormData.usefulLifeYears) : 3) : 3,
                salvageValue: isPurchased ? (assetFormData.salvageValue ? parseFloat(assetFormData.salvageValue) : null) : null,

                // Rental-only fields (clear if purchased)
                vendorMonthlyRent: isRented ? (assetFormData.vendorMonthlyRent ? parseFloat(assetFormData.vendorMonthlyRent) : null) : null,
                receivedFromVendorDate: assetFormData.receivedFromVendorDate || null,
            };
            if (editMode && selectedAssetId) {
                await assetService.updateAsset(selectedAssetId, payload);
                if (selectedImages.length > 0) {
                    const formData = new FormData();
                    selectedImages.forEach(f => formData.append('photos', f));
                    await assetService.uploadAssetPhotos(selectedAssetId, formData);
                }
                showToast('Asset updated successfully', 'success');
            } else {
                const created = await assetService.createAsset(payload);
                if (selectedImages.length > 0) {
                    const formData = new FormData();
                    selectedImages.forEach(f => formData.append('photos', f));
                    await assetService.uploadAssetPhotos(created.id, formData);
                }
                showToast('Asset created successfully', 'success');
            }
            setSelectedImages([]);
            setImagePreviewUrls([]);
            setShowAssetModal(false);
            loadData();
        } catch { showToast('Failed to save asset', 'error'); }
        finally { setSubmittingAsset(false); }
    };

    const handleDelete = (id: number) => {
        setConfirmState({
            show: true, title: 'Delete Asset',
            message: 'Are you sure you want to permanently delete this asset? This action cannot be undone.',
            type: 'danger',
            onConfirm: async () => {
                try { await assetService.deleteAsset(id); showToast('Asset deleted', 'success'); loadData(); }
                catch { showToast('Failed to delete asset', 'error'); }
                setConfirmState(prev => ({ ...prev, show: false }));
            },
        });
    };

    const handleOpenDeploy = (id: number) => {
        setSelectedAssetId(id);
        const asset = assets.find(a => a.id === id);
        const category = masterCategories.find(c => c.name.toLowerCase() === asset?.category?.toLowerCase());
        const allowedTargets = category?.allowedTargetTypes && category.allowedTargetTypes.length > 0
            ? category.allowedTargetTypes
            : ['PERSON'];
        setAllowedTargetTypes(allowedTargets);

        resetDeployForm({
            targetType: allowedTargets[0] || 'PERSON',
            userId: '',
            location: asset?.location || '',
            site: asset?.site || '',
            building: asset?.building || '',
            floor: asset?.floor || '',
            roomDesk: asset?.roomDesk || '',
            deploymentDate: new Date().toISOString().split('T')[0]
        });
        setShowDeployModal(true);
    };

    const handleDeploy = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAssetId || !validateDeployForm()) return;
        try {
            setSubmittingAction(true);
            const payload = {
                ...deployFormData,
                userId: deployFormData.userId ? parseInt(deployFormData.userId) : undefined,
                performedBy: currentUser?.id ? Number(currentUser.id) : undefined
            };
            await assetService.deployAsset(selectedAssetId, payload);
            showToast('Asset deployed successfully', 'success');
            setShowDeployModal(false); loadData();
        } catch { showToast('Failed to deploy asset', 'error'); }
        finally { setSubmittingAction(false); }
    };

    const handleUndeploy = async (id: number) => {
        try { await assetService.undeployAsset(id, currentUser?.id ? Number(currentUser.id) : undefined); showToast('Asset undeployed', 'success'); loadData(); }
        catch { showToast('Failed to undeploy', 'error'); }
    };

    const handleOpenMaintenance = (id: number) => {
        setSelectedAssetId(id);
        resetMaintenanceForm({ lastMaintenanceDate: '', nextMaintenanceDate: '', maintenanceNotes: '' });
        setShowMaintenanceModal(true);
    };

    const handleScheduleMaintenance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAssetId || !validateMaintenanceForm()) return;
        try {
            setSubmittingAction(true);
            await assetService.scheduleMaintenance(selectedAssetId, maintenanceFormData, currentUser?.id ? Number(currentUser.id) : undefined);
            showToast('Maintenance scheduled', 'success');
            setShowMaintenanceModal(false); loadData();
        } catch { showToast('Failed to schedule maintenance', 'error'); }
        finally { setSubmittingAction(false); }
    };

    const handleOpenCompleteMaintenance = (id: number) => {
        setSelectedAssetId(id);
        resetMaintenanceCompleteForm({
            maintenanceCompletedDate: new Date().toISOString().split('T')[0],
            workPerformed: '', completionNotes: '', nextMaintenanceDate: '',
        });
        setShowMaintenanceCompleteModal(true);
    };

    const handleSubmitMaintenanceComplete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAssetId || !validateMaintenanceCompleteForm()) return;
        try {
            setSubmittingAction(true);
            const payload = {
                ...maintenanceCompleteFormData,
                completionNotes: maintenanceCompleteFormData.completionNotes?.trim() || undefined,
                nextMaintenanceDate: maintenanceCompleteFormData.nextMaintenanceDate || undefined,
            };
            await assetService.completeMaintenance(selectedAssetId, payload, currentUser?.id ? Number(currentUser.id) : undefined);
            showToast('Maintenance completed', 'success');
            setShowMaintenanceCompleteModal(false); loadData();
        } catch { showToast('Failed to complete maintenance', 'error'); }
        finally { setSubmittingAction(false); }
    };

    const handleOpenDisposal = (id: number) => {
        setSelectedAssetId(id);
        resetDisposalForm({ disposalDate: '', disposalMethod: '', disposalReason: '', disposalNotes: '' });
        setShowDisposalModal(true);
    };

    const handleDispose = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAssetId || !validateDisposalForm()) return;
        try {
            setSubmittingAction(true);
            await assetService.disposeAsset(selectedAssetId, disposalFormData, currentUser?.id ? Number(currentUser.id) : undefined);
            showToast('Asset disposed', 'success');
            setShowDisposalModal(false); loadData();
        } catch { showToast('Failed to dispose asset', 'error'); }
        finally { setSubmittingAction(false); }
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, { variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'; label: string }> = {
            available: { variant: 'success', label: 'Available' },
            deployed: { variant: 'default', label: 'Deployed' },
            maintenance: { variant: 'warning', label: 'Maintenance' },
            repair: { variant: 'warning', label: 'Repair' },
            'in repair': { variant: 'warning', label: 'In Repair' },
            disposed: { variant: 'secondary', label: 'Disposed' },
            retired: { variant: 'secondary', label: 'Retired' },
            lost: { variant: 'destructive', label: 'Lost' },
            stolen: { variant: 'destructive', label: 'Stolen' },
        };
        const s = map[status.toLowerCase()] || { variant: 'outline', label: status };
        return <Badge variant={s.variant}>{s.label}</Badge>;
    };

    const handleSort = (key: keyof Asset | 'assignedTo') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getDeployLabel = (categoryName: string) => {
        const category = masterCategories.find(c => c.name.toLowerCase() === categoryName?.toLowerCase());
        const allowed = category?.allowedTargetTypes || ['PERSON'];
        if (allowed.length === 1 && allowed.includes('PERSON')) return 'Deploy to User';
        if (allowed.length === 1 && allowed.includes('LOCATION')) return 'Deploy to Location';
        return 'Deploy Asset';
    };

    const filteredAssets = React.useMemo(() => {
        let result = assets.filter((asset) => {
            const matchesTab =
                activeTab === 'all' ||
                (activeTab === 'available' && asset.status?.toLowerCase() === 'available') ||
                (activeTab === 'deployed' && asset.status?.toLowerCase() === 'deployed') ||
                (activeTab === 'maintenance' && ['maintenance', 'repair', 'in repair'].includes(asset.status?.toLowerCase() || '')) ||
                (activeTab === 'disposed' && ['disposed', 'retired'].includes(asset.status?.toLowerCase() || ''));

            if (!matchesTab) return false;

            if (!searchQuery) return true;

            const searchLower = searchQuery.toLowerCase();
            const fullName = `${asset.assignedTo?.firstName || ''} ${asset.assignedTo?.lastName || ''}`.toLowerCase();

            return (
                asset.name.toLowerCase().includes(searchLower) ||
                asset.assetTag.toLowerCase().includes(searchLower) ||
                asset.category.toLowerCase().includes(searchLower) ||
                (asset.brand || '').toLowerCase().includes(searchLower) ||
                (asset.model || '').toLowerCase().includes(searchLower) ||
                (asset.serialNumber || '').toLowerCase().includes(searchLower) ||
                (asset.location || '').toLowerCase().includes(searchLower) ||
                fullName.includes(searchLower)
            );
        });

        if (sortConfig) {
            result.sort((a: Asset, b: Asset) => {
                let aValue: string | number | null = null;
                let bValue: string | number | null = null;

                if (sortConfig.key === 'assignedTo') {
                    aValue = `${a.assignedTo?.firstName || ''} ${a.assignedTo?.lastName || ''}`.toLowerCase();
                    bValue = `${b.assignedTo?.firstName || ''} ${b.assignedTo?.lastName || ''}`.toLowerCase();
                } else {
                    aValue = a[sortConfig.key] as string | number | null;
                    bValue = b[sortConfig.key] as string | number | null;
                }

                if (aValue === null || aValue === undefined) aValue = '';
                if (bValue === null || bValue === undefined) bValue = '';

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return result;
    }, [assets, activeTab, searchQuery, sortConfig]);

    const paginatedAssets = React.useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredAssets.slice(start, start + itemsPerPage);
    }, [filteredAssets, currentPage, itemsPerPage]);

    // Reset page to 1 when tab or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchQuery]);

    const handleExportCSV = () => {
        if (filteredAssets.length === 0) {
            showToast('No data to export', 'warning');
            return;
        }

        const headers = [
            'Asset Tag', 'Name', 'Category', 'Brand', 'Model', 'Status', 'Condition',
            'Assigned To', 'Purchase Cost', 'Monthly Rent', 'Acquisition Type', 'Purchase Date', 'Warranty Expiry'
        ];

        const rows = filteredAssets.map(asset => [
            asset.assetTag,
            asset.name,
            asset.category,
            asset.brand || '-',
            asset.model || '-',
            asset.status,
            asset.condition,
            asset.assignedTo ? `${asset.assignedTo.firstName} ${asset.assignedTo.lastName}` : 'Unassigned',
            asset.purchaseCost || 0,
            asset.vendorMonthlyRent || 0,
            asset.acquisitionType || 'Purchased',
            asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-',
            asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : '-'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `assets_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Assets exported to CSV successfully', 'success');
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
            const result = await assetService.validateImport(file);
            setImportPreviewData(result.data);
            setShowImportPreviewModal(true);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }, message?: string };
            showToast('Validation failed: ' + (err.response?.data?.message || err.message), 'error');
        } finally {
            setLoading(false);
            if (importInputRef.current) importInputRef.current.value = '';
        }
    };

    const handleConfirmImport = async () => {
        try {
            setIsImporting(true);
            const validAssets = importPreviewData.filter(a => a._isValid);
            if (validAssets.length === 0) {
                showToast('No valid assets to import', 'error');
                return;
            }

            const result = await assetService.confirmImport(validAssets, currentUser?.id ? Number(currentUser.id) : undefined);
            
            if (result.success > 0) {
                showToast(`Successfully imported ${result.success} assets`, 'success');
            }
            if (result.failed > 0) {
                showToast(`Failed to import ${result.failed} assets.`, 'warning');
                console.error('Import Errors:', result.errors);
            }
            
            setShowImportPreviewModal(false);
            loadData();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }, message?: string };
            showToast('Import failed: ' + (err.response?.data?.message || err.message), 'error');
        } finally {
            setIsImporting(false);
        }
    };

    const handleDownloadSample = () => {
        const link = document.createElement('a');
        link.href = '/assets_import_sample.csv';
        link.download = 'assets_import_sample.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const tabs: { key: TabKey; label: string; icon: React.ReactNode; count: number }[] = [
        { key: 'all', label: 'All Assets', icon: <Monitor className="h-4 w-4" />, count: assets.length },
        { key: 'available', label: 'Available', icon: <Check className="h-4 w-4" />, count: assets.filter(a => a.status?.toLowerCase() === 'available').length },
        { key: 'deployed', label: 'Deployed', icon: <User className="h-4 w-4" />, count: assets.filter(a => a.status?.toLowerCase() === 'deployed').length },
        { key: 'maintenance', label: 'Maintenance', icon: <Wrench className="h-4 w-4" />, count: assets.filter(a => ['maintenance', 'repair', 'in repair'].includes(a.status?.toLowerCase() || '')).length },
        { key: 'disposed', label: 'Disposed', icon: <Recycle className="h-4 w-4" />, count: assets.filter(a => ['disposed', 'retired'].includes(a.status?.toLowerCase() || '')).length },
    ];

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader title="Asset Management" description="Asset Lifecycle">
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
                            <Button onClick={handleOpenCreate}><Plus className="h-4 w-4 mr-2" />Add Asset</Button>
                        </>
                    )}
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Assets"
                    value={assets.length}
                    subtitle="Tracked items"
                    icon={Monitor}
                    iconColor="bg-blue-100 text-blue-600"
                />
                <StatCard
                    title="Available"
                    value={assets.filter(a => a.status?.toLowerCase() === 'available').length}
                    subtitle="Ready to deploy"
                    icon={Check}
                    iconColor="bg-emerald-100 text-emerald-600"
                    trend="up"
                />
                <StatCard
                    title="Deployed"
                    value={assets.filter(a => a.status?.toLowerCase() === 'deployed').length}
                    subtitle="In use"
                    icon={User}
                    iconColor="bg-primary/10 text-primary"
                    trend="up"
                />
                <StatCard
                    title="Maintenance"
                    value={assets.filter(a => ['maintenance', 'repair', 'in repair'].includes(a.status?.toLowerCase() || '')).length}
                    subtitle="Pending service"
                    icon={Wrench}
                    iconColor="bg-amber-100 text-amber-600"
                    trend="down"
                />
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="border-b px-6 flex items-center justify-between bg-card/50">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
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
                                        {activeTab === tab.key && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in slide-in-from-bottom-1" />
                                        )}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>

                        <div className="pb-3 md:pb-0 md:w-64">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search assets..."
                                    className="pl-9 h-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('assetTag')}>
                                        <div className="flex items-center gap-1">Asset Tag <ArrowUpDown className="h-3 w-3" /></div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('name')}>
                                        <div className="flex items-center gap-1">Name <ArrowUpDown className="h-3 w-3" /></div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('category')}>
                                        <div className="flex items-center gap-1">Category <ArrowUpDown className="h-3 w-3" /></div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('status')}>
                                        <div className="flex items-center gap-1">Status <ArrowUpDown className="h-3 w-3" /></div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('assignedTo')}>
                                        <div className="flex items-center gap-1">Assigned To <ArrowUpDown className="h-3 w-3" /></div>
                                    </TableHead>
                                    <TableHead>Photos</TableHead>
                                    <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('purchaseCost')}>
                                        <div className="flex items-center gap-1">Purchase Cost <ArrowUpDown className="h-3 w-3" /></div>
                                    </TableHead>
                                    <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('vendorMonthlyRent')}>
                                        <div className="flex items-center gap-1">Monthly Rent <ArrowUpDown className="h-3 w-3" /></div>
                                    </TableHead>
                                    <TableHead className="w-[60px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedAssets.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                                            No assets found. Click "Add Asset" to create your first asset.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedAssets.map((asset) => (
                                        <TableRow key={asset.id}>
                                            <TableCell><code className="text-sm bg-muted px-1.5 py-0.5 rounded">{asset.assetTag}</code></TableCell>
                                            <TableCell>
                                                <div className="font-medium">{asset.name}</div>
                                                <div className="text-xs text-muted-foreground">{asset.brand} {asset.model}</div>
                                            </TableCell>
                                            <TableCell><Badge variant="info">{asset.category}</Badge></TableCell>
                                            <TableCell>{getStatusBadge(asset.status)}</TableCell>
                                            <TableCell>
                                                {asset.assignedTo ? (
                                                    <div>
                                                        <div className="font-medium text-sm">{asset.assignedTo.firstName} {asset.assignedTo.lastName}</div>
                                                        <div className="text-xs text-muted-foreground">{asset.assignedTo.email}</div>
                                                    </div>
                                                ) : <span className="text-muted-foreground text-sm">Unassigned</span>}
                                            </TableCell>
                                            <TableCell>
                                                <span className="flex items-center gap-1 text-muted-foreground text-sm">
                                                    <ImageIcon className="h-3.5 w-3.5" />{assetPhotos[asset.id] || 0}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm">{asset.purchaseCost ? formatCost(Number(asset.purchaseCost), asset.currency) : '-'}</TableCell>
                                            <TableCell className="text-sm">{asset.vendorMonthlyRent ? formatCost(Number(asset.vendorMonthlyRent), asset.currency) : '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon-sm" onClick={() => handleViewDetails(asset.id)} title="View Details">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {currentUser?.role?.name === 'Admin' && (
                                                        <ActionDropdown
                                                            actions={[
                                                                ...(asset.status === 'maintenance' || asset.status === 'repair' ? [
                                                                    { label: 'Complete Maintenance', icon: <Check className="h-4 w-4" />, onClick: () => handleOpenCompleteMaintenance(asset.id), variant: 'success' as const },
                                                                    { label: 'Dispose Asset', icon: <Recycle className="h-4 w-4" />, onClick: () => handleOpenDisposal(asset.id), variant: 'default' as const },
                                                                ] : [
                                                                    { label: 'Edit', icon: <Edit className="h-4 w-4" />, onClick: () => handleOpenEdit(asset), variant: 'default' as const },
                                                                    ...(asset.status === 'available' ? [{ label: getDeployLabel(asset.category), icon: <User className="h-4 w-4" />, onClick: () => handleOpenDeploy(asset.id), variant: 'success' as const }] : []),
                                                                    ...(asset.status === 'deployed' ? [{ label: 'Undeploy', icon: <User className="h-4 w-4" />, onClick: () => handleUndeploy(asset.id), variant: 'default' as const }] : []),
                                                                    ...(asset.status !== 'disposed' && asset.status !== 'maintenance' && asset.status !== 'repair' ? [
                                                                        { label: 'Schedule Maintenance', icon: <Wrench className="h-4 w-4" />, onClick: () => handleOpenMaintenance(asset.id), variant: 'default' as const },
                                                                        { 
                                                                            label: 'Dispose Asset', 
                                                                            icon: <Recycle className="h-4 w-4" />, 
                                                                            onClick: () => handleOpenDisposal(asset.id), 
                                                                            variant: 'default' as const,
                                                                            disabled: !!asset.assignedTo || !!asset.location || !!asset.site
                                                                        },
                                                                    ] : []),
                                                                ]),
                                                                { 
                                                                    label: 'Delete', 
                                                                    icon: <Trash2 className="h-4 w-4" />, 
                                                                    onClick: () => handleDelete(asset.id), 
                                                                    variant: 'danger' as const,
                                                                    disabled: !!asset.assignedTo || !!asset.location || !!asset.site
                                                                },
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
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredAssets.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        totalItems={filteredAssets.length}
                        pageSize={itemsPerPage}
                    />
                </CardContent>
            </Card>

            {/* Asset Create/Edit Dialog */}
            <Dialog open={showAssetModal} onOpenChange={setShowAssetModal}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editMode ? 'Edit Asset' : 'New Asset'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitAsset} className="space-y-4 pt-4">
                        <div className="grid grid-cols-4 gap-4">
                            <FormField id="category" label="Category" required error={assetErrors.category} hint="Classification of the asset">
                                <select id="category" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={assetFormData.category} onChange={(e) => handleAssetChange('category', e.target.value)} onBlur={() => handleAssetBlur('category')}>
                                    <option value="">Select category...</option>
                                    {masterCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                </select>
                            </FormField>
                            <FormField id="assetTag" label="Asset Tag" required error={assetErrors.assetTag} hint="Unique ID (e.g. LAP-001)">
                                <Input value={assetFormData.assetTag} onChange={(e) => handleAssetChange('assetTag', e.target.value)} onBlur={() => handleAssetBlur('assetTag')} placeholder="LAP-001" disabled={!editMode && !!assetFormData.category} />
                            </FormField>
                            <FormField id="name" label="Asset Name" required error={assetErrors.name} hint="Common name of the asset">
                                <Input value={assetFormData.name} onChange={(e) => handleAssetChange('name', e.target.value)} onBlur={() => handleAssetBlur('name')} placeholder="MacBook Pro 16" />
                            </FormField>
                            <FormField id="hostname" label="Hostname" hint="Network identification name">
                                <Input value={assetFormData.hostname} onChange={(e) => handleAssetChange('hostname', e.target.value)} placeholder="IT-LAP-001" />
                            </FormField>
                        </div>



                        <div className="grid grid-cols-4 gap-4">
                            <FormField id="brand" label="Brand" hint="Manufacturer name">
                                <select id="brand" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={assetFormData.brand} onChange={(e) => handleAssetChange('brand', e.target.value)}>
                                    <option value="">Select brand...</option>
                                    {masterBrands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                </select>
                            </FormField>
                            <FormField id="model" label="Model" hint="Specific product model">
                                <Input value={assetFormData.model} onChange={(e) => handleAssetChange('model', e.target.value)} placeholder="MBP16-2023" />
                            </FormField>
                            <FormField id="serialNumber" label="Serial Number" hint="Manufacturer's unique serial number">
                                <Input value={assetFormData.serialNumber} onChange={(e) => handleAssetChange('serialNumber', e.target.value)} placeholder="C02XYZ123" />
                            </FormField>
                            <FormField id="condition" label="Condition" required error={assetErrors.condition} hint="Physical state of the asset">
                                <select id="condition" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={assetFormData.condition} onChange={(e) => handleAssetChange('condition', e.target.value)} onBlur={() => handleAssetBlur('condition')}>
                                    <option value="">Select condition...</option>
                                    {masterConditions.map(cond => <option key={cond.id} value={cond.value}>{cond.label}</option>)}
                                </select>
                            </FormField>
                            <FormField id="status" label="Status" hint="Current availability status (Automated)">
                                <Input
                                    value={masterStatuses.find(s => s.value === assetFormData.status)?.label || assetFormData.status || 'Available'}
                                    disabled
                                    className="bg-muted cursor-not-allowed font-medium"
                                />
                            </FormField>
                        </div>

                        <h4 className="font-semibold text-sm text-muted-foreground pt-2">Financials & Ownership</h4>
                        <div className="grid grid-cols-4 gap-4">
                            <FormField id="poNumber" label="PO Number" hint="Purchase Order reference">
                                <Input value={assetFormData.poNumber} onChange={(e) => handleAssetChange('poNumber', e.target.value)} placeholder="PO-2024-001" />
                            </FormField>
                            <FormField id="invoiceNumber" label="Invoice Number" hint="Vendor invoice reference">
                                <Input value={assetFormData.invoiceNumber} onChange={(e) => handleAssetChange('invoiceNumber', e.target.value)} placeholder="INV-XP-500" />
                            </FormField>
                            <FormField id="costCenter" label="Cost Center" hint="Internal department for billing">
                                <Input value={assetFormData.costCenter} onChange={(e) => handleAssetChange('costCenter', e.target.value)} placeholder="IT-OPS-04" />
                            </FormField>
                            <FormField id="businessOwnerId" label="Business Owner" hint="The primary stakeholder for this asset">
                                <select id="businessOwnerId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={assetFormData.businessOwnerId} onChange={(e) => handleAssetChange('businessOwnerId', e.target.value)}>
                                    <option value="">Select owner...</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                                </select>
                            </FormField>
                        </div>

                        <h4 className="font-semibold text-sm text-muted-foreground pt-2">Acquisition Details</h4>

                        {/* Acquisition Type Toggle */}
                        <div className="mb-4">
                            <Label className="text-sm font-medium mb-2 block">Acquisition Type</Label>
                            <div className="flex items-center gap-3">
                                <span className={`text-sm font-medium transition-colors ${assetFormData.acquisitionType === 'purchased'
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                                    }`}>
                                    Purchased
                                </span>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={assetFormData.acquisitionType === 'rented'}
                                    onClick={() => handleAssetChange('acquisitionType',
                                        assetFormData.acquisitionType === 'purchased' ? 'rented' : 'purchased'
                                    )}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${assetFormData.acquisitionType === 'rented'
                                        ? 'bg-primary'
                                        : 'bg-input'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-lg transition-transform ${assetFormData.acquisitionType === 'rented'
                                            ? 'translate-x-6'
                                            : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                                <span className={`text-sm font-medium transition-colors ${assetFormData.acquisitionType === 'rented'
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                                    }`}>
                                    Rented
                                </span>
                            </div>
                        </div>

                        {/* Purchased Asset Fields */}
                        {assetFormData.acquisitionType === 'purchased' && (
                            <div className="grid grid-cols-4 gap-4">
                                <FormField id="purchaseDate" label="Purchase Date" hint="Date the asset was bought">
                                    <Input
                                        type="date"
                                        value={assetFormData.purchaseDate}
                                        onChange={(e) => handleAssetChange('purchaseDate', e.target.value)}
                                    />
                                </FormField>

                                <FormField
                                    id="purchaseCost"
                                    label="Purchase Cost"
                                    error={assetErrors.purchaseCost}
                                    hint="Total acquisition price"
                                >
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={assetFormData.purchaseCost}
                                        onChange={(e) => handleAssetChange('purchaseCost', e.target.value)}
                                        onBlur={() => handleAssetBlur('purchaseCost')}
                                        placeholder="0.00"
                                    />
                                </FormField>

                                <FormField id="currency" label="Currency" hint="Currency this asset was purchased in">
                                    <select id="currency" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={assetFormData.currency} onChange={(e) => handleAssetChange('currency', e.target.value)}>
                                        {CURRENCY_OPTIONS.map(code => <option key={code} value={code}>{code}</option>)}
                                    </select>
                                </FormField>

                                <FormField id="vendor" label="Vendor" hint="The supplier of this asset">
                                    <select id="vendor" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={assetFormData.vendor} onChange={(e) => handleAssetChange('vendor', e.target.value)}>
                                        <option value="">Select vendor...</option>
                                        {masterVendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                                    </select>
                                </FormField>
                            </div>
                        )}

                        {/* Rented Asset Fields */}
                        {assetFormData.acquisitionType === 'rented' && (
                            <div className="grid grid-cols-4 gap-4">
                                <FormField
                                    id="vendorMonthlyRent"
                                    label={`Monthly Rent (${currencySymbol})`}
                                    hint="Reoccurring monthly rental fee"
                                >
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={assetFormData.vendorMonthlyRent}
                                        onChange={(e) => handleAssetChange('vendorMonthlyRent', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </FormField>

                                <FormField id="receivedFromVendorDate" label="Rental Start Date" hint="When the rental tenure began">
                                    <Input
                                        type="date"
                                        value={assetFormData.receivedFromVendorDate}
                                        onChange={(e) => handleAssetChange('receivedFromVendorDate', e.target.value)}
                                    />
                                </FormField>

                                <FormField id="vendor" label="Vendor" hint="The supplier of this asset">
                                    <select id="vendor" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={assetFormData.vendor} onChange={(e) => handleAssetChange('vendor', e.target.value)}>
                                        <option value="">Select vendor...</option>
                                        {masterVendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                                    </select>
                                </FormField>
                            </div>
                        )}

                        <h4 className="font-semibold text-sm text-muted-foreground pt-2">Warranty & Maintenance</h4>
                        <div className="grid grid-cols-4 gap-4">
                            <FormField id="warrantyType" label="Warranty Type" hint="Type of support coverage">
                                <select id="warrantyType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={assetFormData.warrantyType} onChange={(e) => handleAssetChange('warrantyType', e.target.value)}>
                                    <option value="">Select type...</option>
                                    <option value="on-site">On-Site</option>
                                    <option value="depot">Depot (Carry-in)</option>
                                    <option value="care-pack">Extended CarePack</option>
                                </select>
                            </FormField>
                            <FormField id="warrantyStart" label="Warranty Start" hint="When coverage starts">
                                <Input type="date" value={assetFormData.warrantyStart} onChange={(e) => handleAssetChange('warrantyStart', e.target.value)} />
                            </FormField>
                            <FormField id="warrantyExpiry" label="Warranty Expiry" hint="When coverage ends">
                                <Input type="date" value={assetFormData.warrantyExpiry} onChange={(e) => handleAssetChange('warrantyExpiry', e.target.value)} />
                            </FormField>
                            <FormField id="maintenanceCycleDays" label="Maint. Cycle (Days)" hint="Days between regular services">
                                <Input type="number" value={assetFormData.maintenanceCycleDays} onChange={(e) => handleAssetChange('maintenanceCycleDays', e.target.value)} placeholder="180" />
                            </FormField>
                        </div>

                        <h4 className="font-semibold text-sm text-muted-foreground pt-2">Depreciation Settings</h4>
                        <div className="grid grid-cols-4 gap-4">
                            <FormField
                                id="usefulLifeYears"
                                label="Useful Life (Years)"
                                error={assetErrors.usefulLifeYears}
                                hint="Years before full depreciation"
                            >
                                <Input
                                    type="number"
                                    value={assetFormData.usefulLifeYears}
                                    onChange={(e) => handleAssetChange('usefulLifeYears', e.target.value)}
                                    onBlur={() => handleAssetBlur('usefulLifeYears')}
                                    min="1"
                                />
                            </FormField>
                            <FormField id="salvageValue" label={`Salvage Value (${currencySymbol})`} hint="Estimated value at end of life">
                                <Input type="number" step="0.01" value={assetFormData.salvageValue} onChange={(e) => handleAssetChange('salvageValue', e.target.value)} placeholder="0.00" />
                            </FormField>
                        </div>

                        <FormField id="location" label="Location" hint="Where the asset is currently kept">
                            <Input
                                value={assetFormData.location}
                                onChange={(e) => handleAssetChange('location', e.target.value)}
                                placeholder="e.g. Office Floor 3, Desk 12"
                            />
                        </FormField>

                        <FormField id="notes" label="Notes" hint="Any extra details or history">
                            <Textarea
                                rows={3}
                                value={assetFormData.notes}
                                onChange={(e) => handleAssetChange('notes', e.target.value)}
                                placeholder="Additional information about this asset"
                            />
                        </FormField>

                        <h4 className="font-semibold text-sm text-muted-foreground pt-4 mb-2 flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Asset Photos (Optional)
                        </h4>
                        <div className="space-y-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                            <div
                                className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors cursor-pointer bg-muted/30"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <div className="text-center">
                                    <p className="text-sm font-medium">Click to upload photos</p>
                                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 5MB each</p>
                                </div>
                            </div>
                            {imagePreviewUrls.length > 0 && (
                                <div className="grid grid-cols-4 gap-3">
                                    {imagePreviewUrls.map((url, idx) => (
                                        <div key={idx} className="relative group rounded-lg overflow-hidden border bg-muted aspect-square">
                                            <img
                                                src={url}
                                                alt={`Preview ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeSelectedImage(idx)}
                                                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/60"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                            <div className="absolute bottom-0 inset-x-0 bg-black/50 px-1.5 py-0.5">
                                                <p className="text-[10px] text-white truncate">{selectedImages[idx]?.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowAssetModal(false)}>Cancel</Button>
                            <Button type="submit" disabled={submittingAsset}>
                                {submittingAsset ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                {editMode ? 'Update Asset' : 'Create Asset'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog >

            {/* Deploy Dialog */}
            < Dialog open={showDeployModal} onOpenChange={setShowDeployModal} >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Deploy Asset</DialogTitle></DialogHeader>
                    <form onSubmit={handleDeploy} className="space-y-4 pt-4">
                        {allowedTargetTypes.length > 1 && (
                            <FormField id="targetType" label="Assignment Target" required error={deployErrors.targetType}>
                                <select
                                    id="targetType"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={deployFormData.targetType}
                                    onChange={(e) => handleDeployChange('targetType', e.target.value)}
                                >
                                    {allowedTargetTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </FormField>
                        )}

                        {deployFormData.targetType === 'PERSON' && (
                            <FormField
                                id="userId"
                                label="Assign To User"
                                required
                                error={deployErrors.userId}
                                hint="Select the staff member receiving this asset"
                            >
                                <select
                                    id="userId"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={deployFormData.userId}
                                    onChange={(e) => handleDeployChange('userId', e.target.value)}
                                    onBlur={() => handleDeployBlur('userId')}
                                >
                                    <option value="">Select user...</option>
                                    {users.map(user => <option key={user.id} value={user.id}>{user.firstName} {user.lastName} ({user.email})</option>)}
                                </select>
                            </FormField>
                        )}

                        {deployFormData.targetType === 'LOCATION' && (
                            <div className="space-y-4">
                                <FormField id="site" label="Site" hint="Phyical building or campus">
                                    <Input value={deployFormData.site} onChange={(e) => handleDeployChange('site', e.target.value)} placeholder="Main HQ" />
                                </FormField>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField id="building" label="Building">
                                        <Input value={deployFormData.building} onChange={(e) => handleDeployChange('building', e.target.value)} placeholder="Block A" />
                                    </FormField>
                                    <FormField id="floor" label="Floor">
                                        <Input value={deployFormData.floor} onChange={(e) => handleDeployChange('floor', e.target.value)} placeholder="3rd Floor" />
                                    </FormField>
                                </div>
                                <FormField id="location" label="Specific Location" hint="Room or desk number">
                                    <Input value={deployFormData.location} onChange={(e) => handleDeployChange('location', e.target.value)} placeholder="Room 302 / Desk 12" />
                                </FormField>
                            </div>
                        )}

                        <FormField
                            id="deploymentDate"
                            label="Deployment Date"
                            required
                            error={deployErrors.deploymentDate}
                        >
                            <Input
                                type="date"
                                value={deployFormData.deploymentDate}
                                onChange={(e) => handleDeployChange('deploymentDate', e.target.value)}
                                onBlur={() => handleDeployBlur('deploymentDate')}
                            />
                        </FormField>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowDeployModal(false)}>Cancel</Button>
                            <Button type="submit" disabled={submittingAction}>
                                {submittingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                                Deploy Asset
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog >

            {/* Maintenance Dialog */}
            <Dialog open={showMaintenanceModal} onOpenChange={setShowMaintenanceModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Schedule Maintenance</DialogTitle></DialogHeader>
                    <form onSubmit={handleScheduleMaintenance} className="space-y-4 pt-4">
                        <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800 flex items-start gap-2">
                            <Wrench className="h-4 w-4 mt-0.5 shrink-0" />
                            Scheduling maintenance will change the asset status and make it unavailable for deployment.
                        </div>

                        <FormField
                            id="lastMaintenanceDate"
                            label="Maintenance Start Date"
                            required
                            hint="When should the scheduled maintenance begin?"
                            error={maintenanceErrors.lastMaintenanceDate}
                        >
                            <Input
                                type="date"
                                value={maintenanceFormData.lastMaintenanceDate}
                                onChange={(e) => handleMaintenanceChange('lastMaintenanceDate', e.target.value)}
                                onBlur={() => handleMaintenanceBlur('lastMaintenanceDate')}
                            />
                        </FormField>

                        <FormField
                            id="nextMaintenanceDate"
                            label="Maintenance End Date"
                            required
                            hint="When should the scheduled maintenance end?"
                            error={maintenanceErrors.nextMaintenanceDate}
                        >
                            <Input
                                type="date"
                                value={maintenanceFormData.nextMaintenanceDate}
                                onChange={(e) => handleMaintenanceChange('nextMaintenanceDate', e.target.value)}
                                onBlur={() => handleMaintenanceBlur('nextMaintenanceDate')}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </FormField>

                        <FormField id="maintenanceNotes" label="Maintenance Notes" hint="Describe the maintenance work needed">
                            <Textarea
                                rows={3}
                                value={maintenanceFormData.maintenanceNotes}
                                onChange={(e) => handleMaintenanceChange('maintenanceNotes', e.target.value)}
                                placeholder="Describe the maintenance work..."
                            />
                        </FormField>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowMaintenanceModal(false)}>Cancel</Button>
                            <Button type="submit" variant="warning" disabled={submittingAction}>
                                {submittingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <><Wrench className="h-4 w-4 mr-2" />Schedule Maintenance</>}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Maintenance Complete Dialog */}
            <Dialog open={showMaintenanceCompleteModal} onOpenChange={setShowMaintenanceCompleteModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Complete Maintenance</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmitMaintenanceComplete} className="space-y-4 pt-4">
                        <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800 flex items-start gap-2">
                            <Check className="h-4 w-4 mt-0.5 shrink-0" />
                            Complete the maintenance record and return the asset to available status.
                        </div>

                        <FormField
                            id="maintenanceCompletedDate"
                            label="Completion Date"
                            required
                            error={maintenanceCompleteErrors.maintenanceCompletedDate}
                            hint="When was the work finished?"
                        >
                            <Input
                                type="date"
                                value={maintenanceCompleteFormData.maintenanceCompletedDate}
                                onChange={(e) => handleMaintenanceCompleteChange('maintenanceCompletedDate', e.target.value)}
                                onBlur={() => handleMaintenanceCompleteBlur('maintenanceCompletedDate')}
                            />
                        </FormField>

                        <FormField
                            id="workPerformed"
                            label="Work Performed"
                            required
                            error={maintenanceCompleteErrors.workPerformed}
                            hint="Detailed description of repairs/service"
                        >
                            <Textarea
                                rows={3}
                                value={maintenanceCompleteFormData.workPerformed}
                                onChange={(e) => handleMaintenanceCompleteChange('workPerformed', e.target.value)}
                                onBlur={() => handleMaintenanceCompleteBlur('workPerformed')}
                                placeholder="Describe what maintenance work was completed..."
                            />
                        </FormField>

                        <FormField id="completionNotes" label="Completion Notes" hint="Optional summary">
                            <Textarea
                                rows={2}
                                value={maintenanceCompleteFormData.completionNotes}
                                onChange={(e) => handleMaintenanceCompleteChange('completionNotes', e.target.value)}
                                placeholder="Additional notes..."
                            />
                        </FormField>

                        <FormField id="nextMaintenanceDate" label="Next Maintenance Date" hint="Optional: Set the next repeat cycle">
                            <Input
                                type="date"
                                value={maintenanceCompleteFormData.nextMaintenanceDate}
                                onChange={(e) => handleMaintenanceCompleteChange('nextMaintenanceDate', e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </FormField>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowMaintenanceCompleteModal(false)}>Cancel</Button>
                            <Button type="submit" variant="success" disabled={submittingAction}>
                                {submittingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <><Check className="h-4 w-4 mr-2" />Complete Maintenance</>}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Disposal Dialog */}
            <Dialog open={showDisposalModal} onOpenChange={setShowDisposalModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Dispose Asset</DialogTitle></DialogHeader>
                    <form onSubmit={handleDispose} className="space-y-4 pt-4">
                        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 flex items-start gap-2">
                            <Recycle className="h-4 w-4 mt-0.5 shrink-0" />
                            This action will permanently dispose of the asset and change its status to "disposed".
                        </div>

                        <FormField
                            id="disposalDate"
                            label="Disposal Date"
                            required
                            error={disposalErrors.disposalDate}
                            hint="When was the asset removed?"
                        >
                            <Input
                                type="date"
                                value={disposalFormData.disposalDate}
                                onChange={(e) => handleDisposalChange('disposalDate', e.target.value)}
                                onBlur={() => handleDisposalBlur('disposalDate')}
                            />
                        </FormField>

                        <FormField
                            id="disposalMethod"
                            label="Disposal Method"
                            required
                            error={disposalErrors.disposalMethod}
                            hint="How was the disposal handled?"
                        >
                            <select
                                id="disposalMethod"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={disposalFormData.disposalMethod}
                                onChange={(e) => handleDisposalChange('disposalMethod', e.target.value)}
                                onBlur={() => handleDisposalBlur('disposalMethod')}
                            >
                                <option value="">Select disposal method...</option>
                                {masterDisposalMethods.map(method => (
                                    <option key={method.id} value={method.value}>{method.label}</option>
                                ))}
                            </select>
                        </FormField>

                        <FormField
                            id="disposalReason"
                            label="Disposal Reason"
                            required
                            error={disposalErrors.disposalReason}
                            hint="Why is this asset being retired?"
                        >
                            <Textarea
                                rows={3}
                                value={disposalFormData.disposalReason}
                                onChange={(e) => handleDisposalChange('disposalReason', e.target.value)}
                                onBlur={() => handleDisposalBlur('disposalReason')}
                                placeholder="Explain why the asset is being disposed..."
                            />
                        </FormField>

                        <FormField id="disposalNotes" label="Additional Notes" hint="Optional summary">
                            <Textarea
                                rows={2}
                                value={disposalFormData.disposalNotes}
                                onChange={(e) => handleDisposalChange('disposalNotes', e.target.value)}
                                placeholder="Any additional notes..."
                            />
                        </FormField>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowDisposalModal(false)}>Cancel</Button>
                            <Button type="submit" variant="destructive" disabled={submittingAction}>
                                {submittingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <><Trash2 className="h-4 w-4 mr-2" />Dispose Asset</>}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Import Preview Modal */}
            <Dialog open={showImportPreviewModal} onOpenChange={setShowImportPreviewModal}>
                <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 text-primary" />
                            Review Import Data
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-auto my-4 border rounded-md">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 sticky top-0">
                                <tr>
                                    <th className="p-2 text-left border-b">Asset Tag</th>
                                    <th className="p-2 text-left border-b">Name</th>
                                    <th className="p-2 text-left border-b">Category</th>
                                    <th className="p-2 text-left border-b">Status</th>
                                    <th className="p-2 text-left border-b">Validation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {importPreviewData.map((row, idx) => (
                                    <tr key={idx} className={row._isValid ? 'hover:bg-muted/30' : 'bg-red-50 hover:bg-red-100/50'}>
                                        <td className="p-2 border-b">{row.assetTag || <span className="text-muted-foreground italic">Auto-gen</span>}</td>
                                        <td className={`p-2 border-b ${!row.name ? 'text-red-600 font-medium' : ''}`}>{row.name || 'MISSING'}</td>
                                        <td className={`p-2 border-b ${!row.category ? 'text-red-600 font-medium' : ''}`}>{row.category || 'MISSING'}</td>
                                        <td className="p-2 border-b uppercase">{row.status}</td>
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
                            {importPreviewData.filter(a => a._isValid).length} of {importPreviewData.length} assets are valid and ready to import.
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

            <ConfirmModal
                show={confirmState.show}
                title={confirmState.title}
                message={confirmState.message}
                type={confirmState.type}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState(prev => ({ ...prev, show: false }))}
            />
        </div >
    );
};

export default AssetManagement;
