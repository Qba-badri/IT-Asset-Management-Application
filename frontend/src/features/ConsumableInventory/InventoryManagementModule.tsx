import React, { useEffect, useState } from 'react';
import {
    Plus, Edit, Trash2, Search, Eye,
    Package, ShoppingCart, UserPlus, AlertTriangle, ArrowUpDown,
    Check, Loader2, Download, RefreshCw, Filter, X, Settings2, History, MapPin, Sliders
} from 'lucide-react';
import { inventoryService, InventoryItem, InventoryCategory, InventoryPurchase, InventoryAssignment } from '../../services/consumableInventoryService';
import { authService } from '../../services/authService';
import { userService, User } from '../../services/userService';
import { masterService, Vendor, Lookup } from '../../services/masterService';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../hooks/useAuth';
import ConfirmModal from '../../components/Common/ConfirmModal';
import ActionDropdown from '../../components/Common/ActionDropdown';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useNavigate, Link } from 'react-router-dom';
import { Pagination } from '../../components/shared/Pagination';
import UserSelect from '../../components/shared/UserSelect';
import { FormField } from '../../components/shared/FormField';
import { useForm } from '../../hooks/useForm';

const InventoryManagement: React.FC = () => {
    const navigate = useNavigate();
    const { formatCost, availableCurrencies, defaultCurrency, convertBetween, formatInCurrency } = useCurrency();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [categories, setCategories] = useState<InventoryCategory[]>([]);
    const [purchases, setPurchases] = useState<InventoryPurchase[]>([]);
    const [assignments, setAssignments] = useState<InventoryAssignment[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [lookups, setLookups] = useState<Record<string, Lookup[]>>({});
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const { hasPermission } = useAuth();
    // Mirrors the backend PermissionsGuard: all mutating inventory routes require inventory-mgmt.manage
    const canManage = hasPermission('inventory-mgmt.manage');
    const canManageCategories = hasPermission('categories.manage');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [assignmentSearchTerm, setAssignmentSearchTerm] = useState(''); // Global assignments search
    const [modalAssignmentSearch, setModalAssignmentSearch] = useState(''); // Modal assignments search
    const [modalPurchaseSearch, setModalPurchaseSearch] = useState(''); // Modal purchases search
    const [activeTab, setActiveTab] = useState('items');

    // Filters
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const { showToast } = useToast();

    // Modals
    const [showItemFormModal, setShowItemFormModal] = useState(false);
    const [showPurchaseFormModal, setShowPurchaseFormModal] = useState(false);
    const [showAssignmentFormModal, setShowAssignmentFormModal] = useState(false);
    const [showReturnFormModal, setShowReturnFormModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);
    const [showDeleteAssignmentModal, setShowDeleteAssignmentModal] = useState(false);

    // Selected Items
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [confirmState, setConfirmState] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void; type?: 'danger' | 'warning' | 'primary' }>({ show: false, title: '', message: '', onConfirm: () => { } });

    // Form States. Several ids/quantities use 0 as their "empty" sentinel, so
    // their required checks live in `custom` rules, which run on empty values.
    const itemForm = useForm({
        name: '',
        categoryId: 0,
        isRefundable: false,
        minStockLevel: 10,
        unitsPerPack: 1,
        packQuantity: 0
    }, {
        name: { label: 'Item name', required: true },
        categoryId: { label: 'Category', custom: (v) => (!v ? 'Category is required.' : null) },
    });
    const newItem = itemForm.values;
    const setNewItem = itemForm.setValues;

    const purchaseForm = useForm({
        itemId: 0,
        vendorName: '',
        quantity: 0,
        packQuantity: 0,
        unitsPerPack: 1,
        unitCost: 0,
        currency: defaultCurrency,
        invoiceNumber: '',
        invoiceAttachment: '',
        purchaseDate: new Date().toISOString().split('T')[0]
    }, {
        itemId: { label: 'Item', custom: (v) => (!v ? 'Item is required.' : null) },
        vendorName: { label: 'Vendor name', required: true },
        packQuantity: {
            label: 'Pack quantity',
            custom: (v, all) => ((all.unitsPerPack || 1) > 1 && (!v || v <= 0) ? 'Pack quantity must be at least 1.' : null),
        },
        quantity: {
            label: 'Quantity',
            custom: (v, all) => ((all.unitsPerPack || 1) <= 1 && (!v || v <= 0) ? 'Quantity must be greater than zero.' : null),
        },
        unitCost: {
            label: 'Unit cost',
            custom: (v) => (v < 0 ? 'Unit cost cannot be negative.' : null),
        },
    });
    const newPurchase = purchaseForm.values;
    const setNewPurchase = purchaseForm.setValues;

    const assignmentForm = useForm({
        itemId: 0,
        targetType: 'PERSON' as 'PERSON' | 'LOCATION',
        userId: 0,
        location: '',
        quantity: 0,
        department: '',
        expectedReturnDate: ''
    }, {
        itemId: { label: 'Item', custom: (v) => (!v ? 'Item is required.' : null) },
        userId: {
            label: 'User',
            custom: (v, all) => (all.targetType === 'PERSON' && !v ? 'User is required.' : null),
        },
        location: {
            label: 'Location',
            custom: (v, all) => (all.targetType === 'LOCATION' && !String(v ?? '').trim() ? 'Location is required.' : null),
        },
        quantity: { label: 'Quantity', custom: (v) => (!v || v <= 0 ? 'Quantity must be greater than zero.' : null) },
    });
    const newAssignment = assignmentForm.values;
    const setNewAssignment = assignmentForm.setValues;

    const returnForm = useForm({
        assignmentId: 0,
        condition: '',
        remarks: ''
    }, {
        condition: { label: 'Condition', required: true },
    });
    const newReturn = returnForm.values;
    const setNewReturn = returnForm.setValues;

    const adjustStockForm = useForm({
        itemId: 0,
        type: 'IN' as 'IN' | 'OUT',
        quantity: 0,
        notes: ''
    }, {
        quantity: { label: 'Quantity', custom: (v) => (!v || v <= 0 ? 'Quantity must be greater than zero.' : null) },
        notes: { label: 'Reason', custom: (v) => (!String(v ?? '').trim() ? 'Reason is required.' : null) },
    });
    const stockAdjustment = adjustStockForm.values;
    const setStockAdjustment = adjustStockForm.setValues;

    const deleteAssignmentForm = useForm({ assignmentId: 0, reason: '' }, {
        reason: { label: 'Reason', custom: (v) => (!String(v ?? '').trim() ? 'Reason is required.' : null) },
    });
    const deleteAssignmentData = deleteAssignmentForm.values;

    const loadData = async () => {
        try {
            setLoading(true);
            // allSettled, not all: these endpoints have different permission gates
            // (e.g. vendors needs vendors.view). One 403 must not blank the whole page.
            const settled = await Promise.allSettled([
                inventoryService.getItems(),
                inventoryService.getCategories(),
                inventoryService.getDashboardStats(),
                userService.getUsers(),
                masterService.getVendors(),
                masterService.getLookups(),
                inventoryService.getPurchases(),
                inventoryService.getAssignments()
            ]);
            const valueOr = <T,>(r: PromiseSettledResult<T>, fallback: T): T =>
                r.status === 'fulfilled' ? r.value : fallback;
            const [itemsRes, categoriesRes, dashboardRes, usersRes, vendorsRes, lookupsRes, purchasesRes, assignmentsRes] = settled;

            // Surface anything that genuinely failed, without discarding what loaded.
            const failed = settled.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined;
            if (failed && itemsRes.status === 'rejected') {
                throw failed.reason;
            }

            const itemsData = valueOr(itemsRes, [] as InventoryItem[]);
            const categoriesData = valueOr(categoriesRes, [] as InventoryCategory[]);
            const dashboardData = valueOr(dashboardRes, null);
            const usersData = valueOr(usersRes, [] as User[]);
            const vendorsData = valueOr(vendorsRes, [] as Vendor[]);
            const lData = valueOr(lookupsRes, [] as Lookup[]);
            const purchasesData = valueOr(purchasesRes, [] as InventoryPurchase[]);
            const assignmentsData = valueOr(assignmentsRes, [] as InventoryAssignment[]);
            setItems(itemsData || []);
            setCategories(categoriesData || []);
            setStats(dashboardData);
            setUsers(usersData || []);
            setVendors(vendorsData || []);
            setPurchases(purchasesData || []);
            setAssignments(assignmentsData || []);

            // Group Lookups by Type
            const groupedLookups: Record<string, Lookup[]> = {};
            lData.forEach(l => {
                if (!groupedLookups[l.type]) groupedLookups[l.type] = [];
                groupedLookups[l.type].push(l);
            });
            setLookups(groupedLookups);
        } catch (error: any) {
            console.error('Failed to load inventory data:', error);

            if (error.response?.status === 401) {
                showToast("Session expired. Please login again.", "warning");
            } else if (error.response?.status === 403) {
                showToast("You don't have permission to view inventory. Contact your administrator.", "error");
            } else {
                const message = error.response?.data?.message || error.message || "Unknown error";
                showToast(`Failed to load inventory data: ${message}`, "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const loadPurchases = async () => {
        try {
            const data = await inventoryService.getPurchases();
            setPurchases(data || []);
        } catch (error: any) {
            console.error('Failed to load purchases:', error);
            showToast('Failed to load purchase history', 'error');
        }
    };

    const loadAssignments = async () => {
        try {
            const data = await inventoryService.getAssignments();
            setAssignments(data || []);
        } catch (error: any) {
            console.error('Failed to load assignments:', error);
            showToast('Failed to load assignments', 'error');
        }
    };

    useEffect(() => {
        loadData();
        authService.getProfile().then(setCurrentUser).catch(() => { });
    }, []);

    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [itemsPage, setItemsPage] = useState(1);
    const [purchasesPage, setPurchasesPage] = useState(1);
    const [assignmentsPage, setAssignmentsPage] = useState(1);

    useEffect(() => {
        if (activeTab === 'purchases') loadPurchases();
        if (activeTab === 'assignments') loadAssignments();
        // Reset page and filter on tab change
        setItemsPage(1);
        setPurchasesPage(1);
        setAssignmentsPage(1);
        setStatusFilter('all');
    }, [activeTab]);

    const handleCreateItem = async () => {
        if (!itemForm.validateForm()) return;

        try {
            setSubmitting(true);
            if (editingItem) {
                await inventoryService.updateItem(editingItem.id, newItem);
                showToast('Item updated successfully', 'success');
            } else {
                await inventoryService.createItem(newItem);
                showToast('Item created successfully', 'success');
            }
            setShowItemFormModal(false);
            itemForm.resetForm({
                name: '',
                categoryId: 0,
                isRefundable: false,
                minStockLevel: 10,
                unitsPerPack: 1,
                packQuantity: 0
            });
            setEditingItem(null);
            loadData();
        } catch (error: any) {
            console.error('Failed to save item:', error);
            showToast(error.response?.data?.message || 'Failed to save item', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreatePurchase = async () => {
        if (!purchaseForm.validateForm()) return;
        const purchaseUnitsPerPack = newPurchase.unitsPerPack || 1;
        const totalUnits = purchaseUnitsPerPack > 1
            ? newPurchase.packQuantity * purchaseUnitsPerPack
            : newPurchase.quantity;

        try {
            setSubmitting(true);
            await inventoryService.createPurchase({
                ...newPurchase,
                quantity: totalUnits,
                packQuantity: purchaseUnitsPerPack > 1 ? newPurchase.packQuantity : undefined,
                unitsPerPack: purchaseUnitsPerPack,
            });
            showToast('Purchase recorded successfully', 'success');
            setShowPurchaseFormModal(false);
            purchaseForm.resetForm({
                itemId: 0,
                vendorName: '',
                quantity: 0,
                packQuantity: 0,
                unitsPerPack: 1,
                unitCost: 0,
                currency: defaultCurrency,
                invoiceNumber: '',
                invoiceAttachment: '',
                purchaseDate: new Date().toISOString().split('T')[0]
            });
            loadData();
            loadPurchases();
        } catch (error: any) {
            console.error('Failed to create purchase:', error);
            const message = error.response?.data?.message || error.message || 'Failed to record purchase';
            showToast(Array.isArray(message) ? message.join(', ') : message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateAssignment = async () => {
        if (!assignmentForm.validateForm()) return;

        try {
            setSubmitting(true);
            await inventoryService.createAssignment({
                itemId: newAssignment.itemId,
                targetType: newAssignment.targetType,
                userId: newAssignment.targetType === 'PERSON' ? newAssignment.userId : undefined,
                location: newAssignment.targetType === 'LOCATION' ? newAssignment.location : undefined,
                quantity: newAssignment.quantity,
                department: newAssignment.department,
                expectedReturnDate: newAssignment.expectedReturnDate || undefined
            });
            showToast('Item assigned successfully', 'success');
            setShowAssignmentFormModal(false);
            assignmentForm.resetForm({ itemId: 0, targetType: 'PERSON', userId: 0, location: '', quantity: 0, department: '', expectedReturnDate: '' });
            loadData();
            if (activeTab === 'assignments') loadAssignments();
        } catch (error: any) {
            console.error('Failed to create assignment:', error);
            const message = error.response?.data?.message || error.message || 'Failed to assign item';
            showToast(Array.isArray(message) ? message.join(', ') : message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleViewDetails = async (id: number) => {
        try {
            const item = await inventoryService.getItem(id);
            setSelectedItem(item);
            setShowDetailsModal(true);
        } catch {
            showToast('Failed to load item details', 'error');
        }
    };

    const handleEditItem = (item: InventoryItem) => {
        setEditingItem(item);
        const upp = item.unitsPerPack || 1;
        itemForm.resetForm({
            name: item.name,
            categoryId: item.categoryId,
            isRefundable: item.isRefundable,
            minStockLevel: item.minStockLevel,
            unitsPerPack: upp,
            packQuantity: Math.floor(item.totalStock / upp)
        });
        setShowItemFormModal(true);
    };

    const handleReturn = async () => {
        if (!newReturn.assignmentId) {
            showToast("Please select an assignment to return", "error");
            return;
        }
        if (!returnForm.validateForm()) return;

        try {
            setSubmitting(true);
            await inventoryService.returnItem(newReturn.assignmentId, {
                condition: newReturn.condition,
                remarks: newReturn.remarks
            });
            showToast('Item returned successfully', 'success');
            setShowReturnFormModal(false);
            returnForm.resetForm({ assignmentId: 0, condition: '', remarks: '' });

            // Reload data
            loadData();

            // If details modal is open, refresh the item details
            if (selectedItem) {
                const updatedItem = await inventoryService.getItem(selectedItem.id);
                setSelectedItem(updatedItem);
            }
        } catch (error: any) {
            console.error('Failed to return item:', error);
            const message = error.response?.data?.message || error.message || 'Failed to return item';
            showToast(Array.isArray(message) ? message.join(', ') : message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAdjustStockClick = (item: InventoryItem) => {
        adjustStockForm.resetForm({ itemId: item.id, type: 'IN', quantity: 0, notes: '' });
        setShowAdjustStockModal(true);
    };

    const handleAdjustStock = async () => {
        if (!adjustStockForm.validateForm()) return;

        try {
            setSubmitting(true);
            await inventoryService.adjustStock(stockAdjustment);
            showToast('Stock adjusted successfully', 'success');
            setShowAdjustStockModal(false);
            loadData();

            if (selectedItem && selectedItem.id === stockAdjustment.itemId) {
                const updatedItem = await inventoryService.getItem(selectedItem.id);
                setSelectedItem(updatedItem);
            }
        } catch (error: any) {
            console.error('Failed to adjust stock:', error);
            const message = error.response?.data?.message || error.message || 'Failed to adjust stock';
            showToast(Array.isArray(message) ? message.join(', ') : message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteAssignmentClick = (assignmentId: number) => {
        deleteAssignmentForm.resetForm({ assignmentId, reason: '' });
        setShowDeleteAssignmentModal(true);
    };

    const handleDeleteAssignment = async () => {
        if (!deleteAssignmentForm.validateForm()) return;

        try {
            setSubmitting(true);
            await inventoryService.deleteMistakenAssignment(deleteAssignmentData.assignmentId, deleteAssignmentData.reason);
            showToast('Assignment corrected and stock restored', 'success');
            setShowDeleteAssignmentModal(false);
            loadData();

            if (selectedItem) {
                const updatedItem = await inventoryService.getItem(selectedItem.id);
                setSelectedItem(updatedItem);
            }
        } catch (error: any) {
            console.error('Failed to delete assignment:', error);
            const message = error.response?.data?.message || error.message || 'Failed to correct assignment';
            showToast(Array.isArray(message) ? message.join(', ') : message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClick = (item: InventoryItem) => {
        setConfirmState({
            show: true,
            title: 'Delete Inventory Item',
            message: `Are you sure you want to delete "${item.name}"? Items with assignment history cannot be deleted and are kept for audit reports.`,
            type: 'danger',
            onConfirm: () => handleDeleteConfirm(item.id)
        });
    };

    const handleDeleteConfirm = async (id: number) => {
        try {
            setSubmitting(true);
            await inventoryService.deleteItem(id);
            showToast('Item deleted successfully', 'success');
            setConfirmState(prev => ({ ...prev, show: false }));
            loadData();
        } catch (error: any) {
            console.error('Failed to delete item:', error);
            const message = error.response?.data?.message || error.message || 'Failed to delete item';
            showToast(Array.isArray(message) ? message.join(', ') : message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Filtering & Sorting
    const filteredItems = React.useMemo(() => {
        return items
            .filter(item => {
                const s = searchTerm.toLowerCase();
                const matchesSearch = !searchTerm ||
                    item.name.toLowerCase().includes(s) ||
                    item.category?.name?.toLowerCase().includes(s);

                if (!matchesSearch) return false;
                if (categoryFilter !== 'all' && item.categoryId !== parseInt(categoryFilter)) return false;

                // Status filtering
                if (statusFilter === 'in-stock' && item.availableStock <= item.minStockLevel) return false;
                if (statusFilter === 'low-stock' && (item.availableStock > item.minStockLevel || item.availableStock === 0)) return false;
                if (statusFilter === 'out-of-stock' && item.availableStock > 0) return false;

                return true;
            })
            .sort((a, b) => {
                let c = 0;
                switch (sortBy) {
                    case 'name': c = a.name.localeCompare(b.name); break;
                    case 'category': c = (a.category?.name || '').localeCompare(b.category?.name || ''); break;
                    case 'stock': c = a.availableStock - b.availableStock; break;
                    case 'total': c = a.totalStock - b.totalStock; break;
                }
                return sortOrder === 'asc' ? c : -c;
            });
    }, [items, searchTerm, categoryFilter, statusFilter, sortBy, sortOrder]);

    const paginatedItems = React.useMemo(() => {
        const start = (itemsPage - 1) * itemsPerPage;
        return filteredItems.slice(start, start + itemsPerPage);
    }, [filteredItems, itemsPage, itemsPerPage]);

    const filteredPurchases = React.useMemo(() => {
        return purchases.filter(p => {
            if (!p.item) return true;
            if (statusFilter === 'in-stock' && p.item.availableStock <= p.item.minStockLevel) return false;
            if (statusFilter === 'low-stock' && (p.item.availableStock > p.item.minStockLevel || p.item.availableStock === 0)) return false;
            if (statusFilter === 'out-of-stock' && p.item.availableStock > 0) return false;
            return true;
        });
    }, [purchases, statusFilter]);

    const paginatedPurchases = React.useMemo(() => {
        const start = (purchasesPage - 1) * itemsPerPage;
        return filteredPurchases.slice(start, start + itemsPerPage);
    }, [filteredPurchases, purchasesPage, itemsPerPage]);

    const filteredAssignments = React.useMemo(() => {
        return assignments.filter(a => {
            const s = assignmentSearchTerm.toLowerCase();
            const matchesSearch = !assignmentSearchTerm ||
                a.user?.firstName?.toLowerCase().includes(s) ||
                a.user?.lastName?.toLowerCase().includes(s) ||
                a.user?.email?.toLowerCase().includes(s) ||
                a.location?.toLowerCase().includes(s) ||
                a.item?.name?.toLowerCase().includes(s) ||
                a.department?.toLowerCase().includes(s);

            if (!matchesSearch) return false;

            // Apply Assignment status filter
            if (statusFilter !== 'all') {
                if (statusFilter === 'assigned' && a.status !== 'assigned') return false;
                if (statusFilter === 'returned' && a.status !== 'returned') return false;
            }

            return true;
        });
    }, [assignments, assignmentSearchTerm, statusFilter]);

    const paginatedAssignments = React.useMemo(() => {
        const start = (assignmentsPage - 1) * itemsPerPage;
        return filteredAssignments.slice(start, start + itemsPerPage);
    }, [filteredAssignments, assignmentsPage, itemsPerPage]);

    const handleSort = (key: string) => {
        if (sortBy === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        else { setSortBy(key); setSortOrder('asc'); }
    };

    const getStockBadge = (item: InventoryItem) => {
        if (item.availableStock === 0) return <Badge variant="destructive">Out of Stock</Badge>;
        if (item.availableStock <= item.minStockLevel) return <Badge variant="warning">Low Stock</Badge>;
        return <Badge variant="success">In Stock</Badge>;
    };

    const formatUnits = (units: number, unitsPerPack: number) => {
        if (!unitsPerPack || unitsPerPack <= 1) return `${units} units`;
        const packs = Math.floor(units / unitsPerPack);
        const remainder = units % unitsPerPack;
        return `${units} units (${packs} packs${remainder ? ` + ${remainder} loose` : ''})`;
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <PageHeader title="Inventory Management" description="Track stock, record purchases, and manage item assignments.">
                <div className="flex items-center gap-2">
                    {canManageCategories && (
                        <Button variant="outline" size="sm" className="hidden sm:flex gap-2" onClick={() => navigate('/dashboard/admin/inventory-categories')}>
                            <Settings2 className="h-4 w-4" /> Manage Categories
                        </Button>
                    )}
                    {canManage && activeTab === 'items' && (
                        <Button size="sm" onClick={() => setShowItemFormModal(true)}>
                            <Plus className="h-4 w-4 mr-2" /> New Item
                        </Button>
                    )}
                    {canManage && activeTab === 'purchases' && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => {
                            purchaseForm.resetForm({ itemId: 0, vendorName: '', quantity: 1, packQuantity: 0, unitsPerPack: 1, unitCost: 0, currency: defaultCurrency, invoiceNumber: '', purchaseDate: new Date().toISOString().split('T')[0], invoiceAttachment: '' });
                            setShowPurchaseFormModal(true);
                        }}>
                            <ShoppingCart className="h-4 w-4 mr-2" /> Record Purchase
                        </Button>
                    )}
                    {activeTab === 'assignments' && (
                        <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => {
                            assignmentForm.resetForm({ itemId: 0, targetType: 'PERSON', userId: 0, location: '', quantity: 1, department: '', expectedReturnDate: '' });
                            setShowAssignmentFormModal(true);
                        }}>
                            <UserPlus className="h-4 w-4 mr-2" /> Issue Item
                        </Button>
                    )}
                </div>
            </PageHeader>


            {/* Dashboard Navigation Tabs */}
            <Card className="shadow-sm border-muted/20">
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                >
                    <div className="border-b px-6 flex items-center justify-between bg-card/50 overflow-x-auto no-scrollbar">
                        <TabsList className="bg-transparent h-auto p-0 gap-8 border-none flex justify-start">
                            {[
                                { value: 'items', label: 'Items', icon: Package, count: items.length },
                                { value: 'purchases', label: 'Purchases', icon: ShoppingCart, count: purchases.length },
                                { value: 'assignments', label: 'Assignments', icon: UserPlus, count: assignments.length },
                            ].map((tab) => {
                                const isActive = activeTab === tab.value;

                                return (
                                    <TabsTrigger
                                        key={tab.value}
                                        value={tab.value}
                                        className="group relative data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-0 pb-3 pt-4 bg-transparent whitespace-nowrap gap-2 text-muted-foreground hover:text-foreground transition-all border-none"
                                    >
                                        <tab.icon className="h-4 w-4" />
                                        <span className="font-semibold text-sm tracking-tight">{tab.label}</span>
                                        <span className={`ml-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground group-hover:bg-muted/80'
                                            }`}>
                                            {tab.count}
                                        </span>
                                        {isActive && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in slide-in-from-bottom-1" />
                                        )}
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>

                        {activeTab !== 'purchases' && (
                            <div className="flex items-center gap-1.5 py-2 overflow-x-auto no-scrollbar">
                                {(activeTab === 'assignments' ? [
                                    { value: 'all', label: 'All', count: assignments.length },
                                    { value: 'assigned', label: 'Assigned', count: assignments.filter(a => a.status === 'assigned').length },
                                    { value: 'returned', label: 'Returned', count: assignments.filter(a => a.status === 'returned').length },
                                ] : [
                                    { value: 'all', label: 'All', count: items.length },
                                    { value: 'in-stock', label: 'In Stock', count: items.filter(i => i.availableStock > i.minStockLevel).length },
                                    { value: 'low-stock', label: 'Low Stock', count: items.filter(i => i.availableStock <= i.minStockLevel && i.availableStock > 0).length },
                                    { value: 'out-of-stock', label: 'Out of Stock', count: items.filter(i => i.availableStock === 0).length },
                                ]).map((filter) => (
                                    <button
                                        key={filter.value}
                                        type="button"
                                        onClick={() => setStatusFilter(filter.value)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${statusFilter === filter.value
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:bg-muted font-medium border border-transparent hover:border-muted-foreground/20'
                                            }`}
                                    >
                                        <span>{filter.label}</span>
                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === filter.value
                                            ? 'bg-primary-foreground/20 text-primary-foreground'
                                            : 'bg-muted-foreground/10 text-muted-foreground'
                                            }`}>
                                            {filter.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <CardContent className="p-0">
                        {/* Items View */}
                        {activeTab === 'items' && (
                            <TabsContent value="items" className="mt-0 border-none p-0 focus-visible:ring-0">
                                <div className="p-4 border-b space-y-4">
                                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                        <div className="relative w-full md:w-96">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input className="pl-9 h-9" placeholder="Search items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                        </div>
                                        <div className="flex items-center gap-2 w-full md:w-auto">
                                            <select
                                                className="flex h-9 w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:ring-2 focus:ring-primary/20"
                                                value={categoryFilter}
                                                onChange={(e) => setCategoryFilter(e.target.value)}
                                            >
                                                <option value="all">All Categories</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                                                ))}
                                            </select>

                                            {(categoryFilter !== 'all' || searchTerm) && (
                                                <Button variant="ghost" size="sm" onClick={() => { setCategoryFilter('all'); setSearchTerm(''); }} className="h-9 px-2 text-muted-foreground">
                                                    <X className="h-4 w-4 mr-1" /> Clear
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead onClick={() => handleSort('name')} className="cursor-pointer hover:text-primary transition-colors">
                                                Item Name <ArrowUpDown className={`inline h-3 w-3 ml-1 ${sortBy === 'name' ? 'text-primary' : 'opacity-30'}`} />
                                            </TableHead>
                                            <TableHead onClick={() => handleSort('category')} className="cursor-pointer hover:text-primary transition-colors">
                                                Category <ArrowUpDown className={`inline h-3 w-3 ml-1 ${sortBy === 'category' ? 'text-primary' : 'opacity-30'}`} />
                                            </TableHead>
                                            <TableHead onClick={() => handleSort('stock')} className="cursor-pointer hover:text-primary transition-colors">
                                                Available <ArrowUpDown className={`inline h-3 w-3 ml-1 ${sortBy === 'stock' ? 'text-primary' : 'opacity-30'}`} />
                                            </TableHead>
                                            <TableHead onClick={() => handleSort('total')} className="cursor-pointer hover:text-primary transition-colors">
                                                Total Stock <ArrowUpDown className={`inline h-3 w-3 ml-1 ${sortBy === 'total' ? 'text-primary' : 'opacity-30'}`} />
                                            </TableHead>
                                            <TableHead>Refundable</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedItems.length === 0 ? (
                                            <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                                <Package className="h-12 w-12 mx-auto mb-4 opacity-10" />
                                                No items found in this category.
                                            </TableCell></TableRow>
                                        ) : (
                                            paginatedItems.map(item => (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <div className="font-semibold text-primary">{item.name}</div>
                                                        {item.availableStock <= item.minStockLevel && (
                                                            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 text-destructive">
                                                                <AlertTriangle className="h-3 w-3" /> Min: {item.minStockLevel}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-normal">{item.category?.name}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className={`text-sm font-medium ${item.availableStock <= item.minStockLevel ? 'text-destructive' : ''}`}>
                                                            {formatUnits(item.availableStock, item.unitsPerPack)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm">{formatUnits(item.totalStock, item.unitsPerPack)}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={item.isRefundable ? "default" : "secondary"}>
                                                            {item.isRefundable ? "Yes" : "No"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{getStockBadge(item)}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button variant="ghost" size="icon-sm" onClick={() => handleViewDetails(item.id)} title="View Details">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            {canManage && (
                                                                <ActionDropdown actions={[
                                                                    { label: 'Edit Item', icon: <Edit className="h-4 w-4" />, onClick: () => handleEditItem(item) },
                                                                    { label: 'Record Purchase', icon: <ShoppingCart className="h-4 w-4" />, onClick: () => { purchaseForm.resetForm({ ...newPurchase, itemId: item.id, unitsPerPack: item.unitsPerPack || 1 }); setShowPurchaseFormModal(true); } },
                                                                    { label: 'Assign Item', icon: <UserPlus className="h-4 w-4" />, onClick: () => { assignmentForm.resetForm({ ...newAssignment, itemId: item.id }); setShowAssignmentFormModal(true); } },
                                                                    { label: 'Adjust Stock', icon: <Sliders className="h-4 w-4" />, onClick: () => handleAdjustStockClick(item) },
                                                                    { label: 'Delete Item', icon: <Trash2 className="h-4 w-4" />, onClick: () => handleDeleteClick(item), variant: 'danger' },
                                                                ]} />
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                                <div className="p-4 border-t">
                                    <Pagination
                                        currentPage={itemsPage}
                                        totalPages={Math.ceil(filteredItems.length / itemsPerPage)}
                                        onPageChange={setItemsPage}
                                        totalItems={filteredItems.length}
                                        pageSize={itemsPerPage}
                                        onPageSizeChange={(size) => { setItemsPerPage(size); setItemsPage(1); setPurchasesPage(1); setAssignmentsPage(1); }}
                                    />
                                </div>
                            </TabsContent>
                        )}

                        {/* Purchases Tab */}
                        <TabsContent value="purchases" className="mt-0 border-none p-0 focus-visible:ring-0">
                            <div className="p-4 border-b flex justify-between items-center">
                                <h3 className="text-lg font-semibold">Purchase History</h3>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Vendor</TableHead>
                                        <TableHead className="text-right">Quantity</TableHead>
                                        <TableHead className="text-right">Unit Cost</TableHead>
                                        <TableHead className="text-right">Total Cost</TableHead>
                                        <TableHead>Invoice</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedPurchases.length === 0 ? (
                                        <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-10" />
                                            No purchases found.
                                        </TableCell></TableRow>
                                    ) : (
                                        paginatedPurchases.map(p => (
                                            <TableRow key={p.id}>
                                                <TableCell className="text-sm">{new Date(p.purchaseDate).toLocaleDateString()}</TableCell>
                                                <TableCell className="font-medium">{p.item?.name}</TableCell>
                                                <TableCell>{p.vendorName}</TableCell>
                                                <TableCell className="text-right">{p.quantity}</TableCell>
                                                <TableCell className="text-right">
                                                    {formatCost(Number(p.unitCost), p.currency)}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {formatCost(Number(p.totalCost), p.currency)}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span>{p.invoiceNumber || '—'}</span>
                                                        {p.invoiceAttachment && (
                                                            <a
                                                                href={p.invoiceAttachment}
                                                                download={`invoice-${p.invoiceNumber || p.id}`}
                                                                className="inline-flex h-6 w-6 items-center justify-center rounded-md border bg-muted/50 text-primary hover:bg-primary/10 transition-colors"
                                                                title="Download Invoice"
                                                            >
                                                                <Download className="h-3 w-3" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            <div className="p-4 border-t">
                                <Pagination
                                    currentPage={purchasesPage}
                                    totalPages={Math.ceil(filteredPurchases.length / itemsPerPage)}
                                    onPageChange={setPurchasesPage}
                                    totalItems={filteredPurchases.length}
                                    pageSize={itemsPerPage}
                                    onPageSizeChange={(size) => { setItemsPerPage(size); setItemsPage(1); setPurchasesPage(1); setAssignmentsPage(1); }}
                                />
                            </div>
                        </TabsContent>

                        {/* Assignments Tab */}
                        <TabsContent value="assignments" className="mt-0 border-none p-0 focus-visible:ring-0">
                            <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4">
                                <h3 className="text-lg font-semibold">Assignment History</h3>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9 h-9"
                                        placeholder="Search by user, item..."
                                        value={assignmentSearchTerm}
                                        onChange={(e) => setAssignmentSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Assigned To</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedAssignments.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-10" />
                                            No assignments found.
                                        </TableCell></TableRow>
                                    ) : (
                                        paginatedAssignments.map(a => (
                                            <TableRow key={a.id}>
                                                <TableCell className="text-sm">{new Date(a.assignmentDate).toLocaleDateString()}</TableCell>
                                                <TableCell className="font-medium text-primary">{a.item?.name}</TableCell>
                                                <TableCell>
                                                    {a.targetType === 'LOCATION' ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                                            <span className="text-sm font-medium">{a.location}</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="text-sm font-medium">{a.user?.firstName} {a.user?.lastName}</div>
                                                            <div className="text-xs text-muted-foreground">{a.user?.email}</div>
                                                        </>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-semibold">{a.quantity}</TableCell>
                                                <TableCell>
                                                    <Badge variant={a.status === 'returned' ? 'success' : 'default'}>
                                                        {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            size="icon-sm"
                                                            variant="ghost"
                                                            title="View Details"
                                                            asChild
                                                        >
                                                            <Link to={`/dashboard/inventory/${a.item?.id}`}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        {a.status === 'assigned' && a.item?.isRefundable && (
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                                onClick={() => {
                                                                    returnForm.resetForm({ assignmentId: a.id, condition: '', remarks: '' });
                                                                    setShowReturnFormModal(true);
                                                                }}
                                                            >
                                                                <History className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            <div className="p-4 border-t">
                                <Pagination
                                    currentPage={assignmentsPage}
                                    totalPages={Math.ceil(filteredAssignments.length / itemsPerPage)}
                                    onPageChange={setAssignmentsPage}
                                    totalItems={filteredAssignments.length}
                                    pageSize={itemsPerPage}
                                    onPageSizeChange={(size) => { setItemsPerPage(size); setItemsPage(1); setPurchasesPage(1); setAssignmentsPage(1); }}
                                />
                            </div>
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>

            {/* Create Item Modal */}
            <Dialog open={showItemFormModal} onOpenChange={setShowItemFormModal}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingItem ? 'Edit Inventory Item' : 'New Inventory Item'}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <FormField id="name" label="Item Name" required error={itemForm.errors.name}>
                            <Input value={newItem.name} onChange={e => itemForm.handleChange('name', e.target.value)} onBlur={() => itemForm.handleBlur('name')} placeholder="e.g., AA Batteries" />
                        </FormField>
                        <FormField id="categoryId" label="Category" required error={itemForm.errors.categoryId}>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={newItem.categoryId}
                                onChange={e => itemForm.handleChange('categoryId', parseInt(e.target.value))}
                                onBlur={() => itemForm.handleBlur('categoryId')}
                            >
                                <option value={0}>-- Select Category --</option>
                                {/* Inactive categories cannot be newly assigned; the item's current one stays listed. */}
                                {categories
                                    .filter(cat => cat.isActive !== false || cat.id === newItem.categoryId)
                                    .map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.isActive === false ? `${cat.name} (Inactive)` : cat.name}
                                        </option>
                                    ))}
                            </select>
                        </FormField>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField id="minStockLevel" label="Minimum Stock Level">
                                <Input type="number" value={newItem.minStockLevel} onChange={e => setNewItem({ ...newItem, minStockLevel: parseInt(e.target.value) })} />
                            </FormField>
                            <FormField id="itemUnitsPerPack" label="Units per Pack">
                                <Input type="number" min={1} value={newItem.unitsPerPack} onChange={e => setNewItem({ ...newItem, unitsPerPack: parseInt(e.target.value) || 1 })} />
                            </FormField>
                            <FormField id="itemPackQuantity" label="Number of Packs">
                                <Input type="number" min={0} value={newItem.packQuantity} onChange={e => setNewItem({ ...newItem, packQuantity: parseInt(e.target.value) || 0 })} />
                            </FormField>
                            <div className="col-span-2 text-sm text-muted-foreground">
                                {newItem.packQuantity || 0} packs × {newItem.unitsPerPack || 1} = <span className="font-medium text-foreground">{(newItem.packQuantity || 0) * (newItem.unitsPerPack || 1)} units total stock</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="refundable"
                                checked={newItem.isRefundable}
                                onChange={e => setNewItem({ ...newItem, isRefundable: e.target.checked })}
                                className="h-4 w-4"
                            />
                            <Label htmlFor="refundable">Refundable (Must be returned)</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowItemFormModal(false);
                            setEditingItem(null);
                            itemForm.resetForm({
                                name: '',
                                categoryId: 0,
                                isRefundable: false,
                                minStockLevel: 10,
                                unitsPerPack: 1,
                                packQuantity: 0
                            });
                        }}>Cancel</Button>
                        <Button onClick={handleCreateItem} disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {editingItem ? 'Update Item' : 'Create Item'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Purchase Modal */}
            <Dialog open={showPurchaseFormModal} onOpenChange={setShowPurchaseFormModal}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Record Purchase</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <FormField id="purchaseItemId" label="Item" required error={purchaseForm.errors.itemId}>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={newPurchase.itemId}
                                onChange={e => {
                                    const selectedId = parseInt(e.target.value);
                                    const selected = items.find(i => i.id === selectedId);
                                    purchaseForm.handleChange('itemId', selectedId);
                                    setNewPurchase(prev => ({ ...prev, unitsPerPack: selected?.unitsPerPack || 1 }));
                                }}
                                onBlur={() => purchaseForm.handleBlur('itemId')}
                            >
                                <option value={0}>-- Select Item --</option>
                                {items.map(item => (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                            </select>
                        </FormField>
                        <FormField id="vendorName" label="Vendor Name" required error={purchaseForm.errors.vendorName}>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={newPurchase.vendorName}
                                onChange={e => purchaseForm.handleChange('vendorName', e.target.value)}
                                onBlur={() => purchaseForm.handleBlur('vendorName')}
                            >
                                <option value="">-- Select Vendor --</option>
                                {vendors.map(v => (
                                    <option key={v.id} value={v.name}>{v.name}</option>
                                ))}
                            </select>
                        </FormField>
                        {(newPurchase.unitsPerPack || 1) > 1 ? (
                            <div className="grid grid-cols-2 gap-4">
                                <FormField id="packQuantity" label="Pack Quantity" required error={purchaseForm.errors.packQuantity}>
                                    <Input type="number" min={1} value={newPurchase.packQuantity} onChange={e => purchaseForm.handleChange('packQuantity', parseInt(e.target.value) || 0)} onBlur={() => purchaseForm.handleBlur('packQuantity')} />
                                </FormField>
                                <FormField id="purchaseUnitsPerPack" label="Units per Pack">
                                    <Input type="number" min={1} value={newPurchase.unitsPerPack} onChange={e => setNewPurchase({ ...newPurchase, unitsPerPack: parseInt(e.target.value) || 1 })} />
                                </FormField>
                                <div className="col-span-2 text-sm text-muted-foreground">
                                    {newPurchase.packQuantity || 0} packs × {newPurchase.unitsPerPack || 1} = <span className="font-medium text-foreground">{(newPurchase.packQuantity || 0) * (newPurchase.unitsPerPack || 1)} units</span>
                                </div>
                            </div>
                        ) : (
                            <FormField id="quantity" label="Quantity" required error={purchaseForm.errors.quantity}>
                                <Input type="number" value={newPurchase.quantity} onChange={e => purchaseForm.handleChange('quantity', parseInt(e.target.value))} onBlur={() => purchaseForm.handleBlur('quantity')} />
                            </FormField>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField id="unitCost" label="Unit Cost" required error={purchaseForm.errors.unitCost}>
                                <div className="flex gap-2">
                                    <select
                                        className="flex h-10 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={newPurchase.currency}
                                        onChange={e => setNewPurchase({ ...newPurchase, currency: e.target.value })}
                                        aria-label="Currency"
                                    >
                                        {availableCurrencies.map(c => (
                                            <option key={c.code} value={c.code}>{c.code}</option>
                                        ))}
                                    </select>
                                    <Input type="number" step="0.01" value={newPurchase.unitCost} onChange={e => purchaseForm.handleChange('unitCost', parseFloat(e.target.value))} onBlur={() => purchaseForm.handleBlur('unitCost')} />
                                </div>
                                {newPurchase.unitCost > 0 && newPurchase.currency !== defaultCurrency && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        ≈ {formatInCurrency(convertBetween(newPurchase.unitCost, newPurchase.currency, defaultCurrency), defaultCurrency)} {defaultCurrency} per unit
                                    </p>
                                )}
                            </FormField>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Invoice Number</Label>
                                <Input value={newPurchase.invoiceNumber} onChange={e => setNewPurchase({ ...newPurchase, invoiceNumber: e.target.value })} placeholder="Optional" />
                            </div>
                            <div className="space-y-2">
                                <Label>Purchase Date</Label>
                                <Input type="date" value={newPurchase.purchaseDate} onChange={e => setNewPurchase({ ...newPurchase, purchaseDate: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex justify-between">
                                <span>Invoice Attachment</span>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider pt-0.5">Optional</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    type="file"
                                    className="cursor-pointer pr-10"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setNewPurchase({ ...newPurchase, invoiceAttachment: reader.result as string });
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                {newPurchase.invoiceAttachment && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1 h-8 w-8 text-destructive hover:bg-destructive/10"
                                        onClick={() => setNewPurchase({ ...newPurchase, invoiceAttachment: '' })}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPurchaseFormModal(false)}>Cancel</Button>
                        <Button onClick={handleCreatePurchase} disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Record Purchase
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Assignment Modal */}
            <Dialog open={showAssignmentFormModal} onOpenChange={setShowAssignmentFormModal}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Assign Item</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <FormField id="assignmentItemId" label="Item" required error={assignmentForm.errors.itemId}>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={newAssignment.itemId}
                                onChange={e => assignmentForm.handleChange('itemId', parseInt(e.target.value))}
                                onBlur={() => assignmentForm.handleBlur('itemId')}
                            >
                                <option value={0}>-- Select Item --</option>
                                {items.map(item => (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                            </select>
                        </FormField>
                        <div className="space-y-2">
                            <Label>Assign To <span className="text-destructive font-bold">*</span></Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={newAssignment.targetType === 'PERSON' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setNewAssignment({ ...newAssignment, targetType: 'PERSON' })}
                                >
                                    Person
                                </Button>
                                <Button
                                    type="button"
                                    variant={newAssignment.targetType === 'LOCATION' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setNewAssignment({ ...newAssignment, targetType: 'LOCATION' })}
                                >
                                    Location
                                </Button>
                            </div>
                        </div>
                        {newAssignment.targetType === 'PERSON' ? (
                            <FormField id="assign-inventory-user" label="User" required error={assignmentForm.errors.userId}>
                                <UserSelect
                                    users={users}
                                    value={newAssignment.userId || null}
                                    onChange={(userId) => assignmentForm.handleChange('userId', userId ?? 0)}
                                />
                            </FormField>
                        ) : (
                            <FormField id="assignmentLocation" label="Location" required error={assignmentForm.errors.location}>
                                <Input
                                    value={newAssignment.location}
                                    onChange={e => assignmentForm.handleChange('location', e.target.value)}
                                    onBlur={() => assignmentForm.handleBlur('location')}
                                    placeholder="e.g. Conference Room 3B, Reception TV"
                                />
                            </FormField>
                        )}
                        <FormField id="assignmentQuantity" label="Quantity" required error={assignmentForm.errors.quantity}>
                            <Input type="number" value={newAssignment.quantity} onChange={e => assignmentForm.handleChange('quantity', parseInt(e.target.value))} onBlur={() => assignmentForm.handleBlur('quantity')} />
                        </FormField>
                        <FormField id="assignmentDepartment" label="Department">
                            <Input value={newAssignment.department} onChange={e => setNewAssignment({ ...newAssignment, department: e.target.value })} placeholder="Optional" />
                        </FormField>
                        <FormField id="expectedReturnDate" label="Expected Return Date">
                            <Input type="date" value={newAssignment.expectedReturnDate} onChange={e => setNewAssignment({ ...newAssignment, expectedReturnDate: e.target.value })} />
                        </FormField>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAssignmentFormModal(false)}>Cancel</Button>
                        <Button onClick={handleCreateAssignment} disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Assign Item
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Return Item Modal */}
            <Dialog open={showReturnFormModal} onOpenChange={setShowReturnFormModal}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Return Item</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <FormField id="returnCondition" label="Condition" required error={returnForm.errors.condition}>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={newReturn.condition}
                                onChange={e => returnForm.handleChange('condition', e.target.value)}
                                onBlur={() => returnForm.handleBlur('condition')}
                            >
                                <option value="">-- Select Condition --</option>
                                <option value="good">Good</option>
                                <option value="fair">Fair</option>
                                <option value="damaged">Damaged</option>
                                <option value="lost">Lost</option>
                            </select>
                        </FormField>
                        <FormField id="returnRemarks" label="Remarks">
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={newReturn.remarks}
                                onChange={e => setNewReturn({ ...newReturn, remarks: e.target.value })}
                                placeholder="Optional remarks about the return..."
                            />
                        </FormField>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReturnFormModal(false)}>Cancel</Button>
                        <Button onClick={handleReturn} disabled={submitting || !newReturn.condition}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Process Return
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Adjust Stock Modal */}
            <Dialog open={showAdjustStockModal} onOpenChange={setShowAdjustStockModal}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Adjust Stock</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Adjustment Type</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={stockAdjustment.type}
                                onChange={e => setStockAdjustment({ ...stockAdjustment, type: e.target.value as 'IN' | 'OUT' })}
                            >
                                <option value="IN">Increase Stock</option>
                                <option value="OUT">Decrease Stock</option>
                            </select>
                        </div>
                        <FormField id="adjustQuantity" label="Quantity" required error={adjustStockForm.errors.quantity}>
                            <Input
                                type="number"
                                min={1}
                                value={stockAdjustment.quantity || ''}
                                onChange={e => adjustStockForm.handleChange('quantity', parseInt(e.target.value) || 0)}
                                onBlur={() => adjustStockForm.handleBlur('quantity')}
                                placeholder="Enter quantity"
                            />
                        </FormField>
                        <FormField id="adjustNotes" label="Reason" required error={adjustStockForm.errors.notes}>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={stockAdjustment.notes}
                                onChange={e => adjustStockForm.handleChange('notes', e.target.value)}
                                onBlur={() => adjustStockForm.handleBlur('notes')}
                                placeholder="e.g. stock-take correction, damaged goods write-off..."
                            />
                        </FormField>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAdjustStockModal(false)}>Cancel</Button>
                        <Button onClick={handleAdjustStock} disabled={submitting || !stockAdjustment.notes.trim() || !stockAdjustment.quantity || stockAdjustment.quantity <= 0}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Apply Adjustment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Mistaken Assignment Modal (non-refundable items, Admin only) */}
            <Dialog open={showDeleteAssignmentModal} onOpenChange={setShowDeleteAssignmentModal}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Delete Mistaken Assignment</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            This item is non-refundable and cannot be returned normally. Use this only to correct a
                            wrong entry — the assigned quantity will be restored to available stock and this
                            assignment record will be voided.
                        </p>
                        <FormField id="deleteAssignmentReason" label="Reason" required error={deleteAssignmentForm.errors.reason}>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={deleteAssignmentData.reason}
                                onChange={e => deleteAssignmentForm.handleChange('reason', e.target.value)}
                                onBlur={() => deleteAssignmentForm.handleBlur('reason')}
                                placeholder="e.g. Assigned to wrong user, wrong quantity entered..."
                            />
                        </FormField>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteAssignmentModal(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteAssignment} disabled={submitting || !deleteAssignmentData.reason.trim()}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Delete Assignment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Details Modal */}
            <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle>Item Details</DialogTitle>
                    </DialogHeader>
                    {selectedItem && (
                        <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0">
                            <div className="border-b px-6">
                                <TabsList className="bg-transparent h-auto p-0 gap-6 border-none flex justify-start">
                                    <TabsTrigger
                                        value="general"
                                        className="group data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-0 pb-3 pt-4 bg-transparent whitespace-nowrap gap-2 text-muted-foreground hover:text-foreground transition-all"
                                    >
                                        <Eye className="h-4 w-4" />
                                        <span className="font-medium">General</span>
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="assignments"
                                        className="group data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-0 pb-3 pt-4 bg-transparent whitespace-nowrap gap-2 text-muted-foreground hover:text-foreground transition-all"
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        <span className="font-medium">Assignments</span>
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="purchases"
                                        className="group data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-0 pb-3 pt-4 bg-transparent whitespace-nowrap gap-2 text-muted-foreground hover:text-foreground transition-all"
                                    >
                                        <ShoppingCart className="h-4 w-4" />
                                        <span className="font-medium">Purchases</span>
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {/* General Information Tab */}
                                <TabsContent value="general" className="mt-0 space-y-6">
                                    <div>
                                        <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Basic Information</h3>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div className="space-y-1">
                                                <Label className="text-muted-foreground text-xs uppercase">Item Name</Label>
                                                <p className="font-semibold text-base">{selectedItem.name}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-muted-foreground text-xs uppercase">Category</Label>
                                                <p className="font-semibold text-base">{selectedItem.category?.name || '—'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-muted-foreground text-xs uppercase">Item ID</Label>
                                                <p className="font-semibold text-base">#{selectedItem.id}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-muted-foreground text-xs uppercase">Available Stock</Label>
                                                <p className="font-bold text-lg text-primary">{formatUnits(selectedItem.availableStock, selectedItem.unitsPerPack)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-muted-foreground text-xs uppercase">Total Stock</Label>
                                                <p className="font-semibold text-base">{formatUnits(selectedItem.totalStock, selectedItem.unitsPerPack)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-muted-foreground text-xs uppercase">Min Stock Level</Label>
                                                <p className="font-semibold text-base">{selectedItem.minStockLevel} units</p>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-muted-foreground text-xs uppercase">Units per Pack</Label>
                                                <p className="font-semibold text-base">{selectedItem.unitsPerPack || 1}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-muted-foreground text-xs uppercase">Status</Label>
                                                <div>
                                                    <Badge variant={selectedItem.status === 'active' ? 'success' : 'secondary'}>
                                                        {selectedItem.status || 'Active'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-muted-foreground text-xs uppercase">Refundable (Returnable)</Label>
                                                <div>
                                                    <Badge variant={selectedItem.isRefundable ? "default" : "outline"}>
                                                        {selectedItem.isRefundable ? 'Yes' : 'No'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-muted rounded-full">
                                                <Plus className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground text-xs block">Created On</Label>
                                                <p className="text-sm font-medium">{selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : '—'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-muted rounded-full">
                                                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground text-xs block">Last Updated</Label>
                                                <p className="text-sm font-medium">{selectedItem.updatedAt ? new Date(selectedItem.updatedAt).toLocaleString() : '—'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Assignments Tab */}
                                <TabsContent value="assignments" className="mt-0">
                                    {selectedItem.assignments && selectedItem.assignments.length > 0 ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Assignment Records</h3>
                                                <div className="relative w-64">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        className="pl-9 h-9"
                                                        placeholder="Search user or department..."
                                                        value={modalAssignmentSearch}
                                                        onChange={(e) => setModalAssignmentSearch(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="border rounded-lg overflow-hidden">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Assigned To</TableHead>
                                                            <TableHead>Department</TableHead>
                                                            <TableHead className="text-right">Qty</TableHead>
                                                            <TableHead>Assigned Date</TableHead>
                                                            <TableHead>Status</TableHead>
                                                            {canManage && (selectedItem.isRefundable || currentUser?.role?.name === 'Admin') && <TableHead className="w-[100px] text-right">Action</TableHead>}
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {selectedItem.assignments
                                                            .filter((a: any) => {
                                                                const s = modalAssignmentSearch.toLowerCase();
                                                                return !modalAssignmentSearch ||
                                                                    a.user?.firstName?.toLowerCase().includes(s) ||
                                                                    a.user?.lastName?.toLowerCase().includes(s) ||
                                                                    a.user?.email?.toLowerCase().includes(s) ||
                                                                    a.location?.toLowerCase().includes(s) ||
                                                                    a.department?.toLowerCase().includes(s);
                                                            })
                                                            .map((assignment: any) => (
                                                                <TableRow key={assignment.id}>
                                                                    <TableCell>
                                                                        {assignment.targetType === 'LOCATION' ? (
                                                                            <div className="flex items-center gap-1.5">
                                                                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                                                                <span className="font-medium">{assignment.location}</span>
                                                                            </div>
                                                                        ) : (
                                                                            <>
                                                                                <div className="font-medium">
                                                                                    {assignment.user?.firstName} {assignment.user?.lastName}
                                                                                </div>
                                                                                <div className="text-xs text-muted-foreground">
                                                                                    {assignment.user?.email}
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell>{assignment.department || '—'}</TableCell>
                                                                    <TableCell className="text-right font-medium">{assignment.quantity}</TableCell>
                                                                    <TableCell className="text-sm">
                                                                        {new Date(assignment.assignmentDate).toLocaleDateString()}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Badge variant={
                                                                            assignment.status === 'returned' ? 'success' :
                                                                                assignment.status === 'assigned' ? 'default' : 'secondary'
                                                                        }>
                                                                            {assignment.status === 'returned' ? 'Returned' :
                                                                                assignment.status === 'assigned' ? 'Assigned' : 'Closed'}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    {canManage && (selectedItem.isRefundable || currentUser?.role?.name === 'Admin') && (
                                                                        <TableCell className="text-right">
                                                                            {assignment.status === 'assigned' && selectedItem.isRefundable && (
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    className="h-8 w-8 p-0"
                                                                                    title="Return Item"
                                                                                    onClick={() => {
                                                                                        returnForm.resetForm({ assignmentId: assignment.id, condition: '', remarks: '' });
                                                                                        setShowReturnFormModal(true);
                                                                                    }}
                                                                                >
                                                                                    <History className="h-4 w-4" />
                                                                                </Button>
                                                                            )}
                                                                            {assignment.status === 'assigned' && !selectedItem.isRefundable && currentUser?.role?.name === 'Admin' && (
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                                                    title="Delete Mistaken Assignment"
                                                                                    onClick={() => handleDeleteAssignmentClick(assignment.id)}
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            )}
                                                                        </TableCell>
                                                                    )}
                                                                </TableRow>
                                                            ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                                            <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                            <h3 className="text-lg font-medium">No Assignment History</h3>
                                            <p className="text-sm">This item has not been assigned to anyone yet.</p>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Purchases Tab */}
                                <TabsContent value="purchases" className="mt-0">
                                    {selectedItem.purchases && selectedItem.purchases.length > 0 ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Inventory Procurement</h3>
                                                <div className="relative w-64">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        className="pl-9 h-9"
                                                        placeholder="Search vendor or invoice..."
                                                        value={modalPurchaseSearch}
                                                        onChange={(e) => setModalPurchaseSearch(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="border rounded-lg overflow-hidden">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Date</TableHead>
                                                            <TableHead>Vendor</TableHead>
                                                            <TableHead>Invoice #</TableHead>
                                                            <TableHead className="text-right">Qty</TableHead>
                                                            <TableHead className="text-right">Unit Cost</TableHead>
                                                            <TableHead className="text-right">Total Cost</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {selectedItem.purchases
                                                            .filter((p: any) => {
                                                                const s = modalPurchaseSearch.toLowerCase();
                                                                return !modalPurchaseSearch ||
                                                                    p.vendorName?.toLowerCase().includes(s) ||
                                                                    p.invoiceNumber?.toLowerCase().includes(s);
                                                            })
                                                            .map((purchase: any) => (
                                                                <TableRow key={purchase.id}>
                                                                    <TableCell className="text-sm font-medium">
                                                                        {new Date(purchase.purchaseDate).toLocaleDateString()}
                                                                    </TableCell>
                                                                    <TableCell>{purchase.vendorName}</TableCell>
                                                                    <TableCell className="text-sm">{purchase.invoiceNumber || '—'}</TableCell>
                                                                    <TableCell className="text-right font-medium">{purchase.quantity}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        {formatCost(purchase.unitCost, purchase.currency)}
                                                                    </TableCell>
                                                                    <TableCell className="text-right font-bold">
                                                                        {formatCost(purchase.totalCost, purchase.currency)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                                            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                            <h3 className="text-lg font-medium">No Purchase History</h3>
                                            <p className="text-sm">There are no procurement records available for this item.</p>
                                        </div>
                                    )}
                                </TabsContent>
                            </div>
                        </Tabs>
                    )}
                    <DialogFooter className="px-6 py-4 border-t">
                        <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmModal show={confirmState.show} title={confirmState.title} message={confirmState.message} type={confirmState.type} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(prev => ({ ...prev, show: false }))} />
        </div >
    );
};

export default InventoryManagement;
