import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Edit2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { catalogService, CatalogItem, CatalogQuery, ReturnPolicy, TrackMode } from '../../services/catalogService';
import { useToast } from '../../context/ToastContext';
import { useCurrency, CURRENCY_OPTIONS } from '../../context/CurrencyContext';
import { FormField } from '../../components/shared/FormField';
import { useForm } from '../../hooks/useForm';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';

const CatalogPage: React.FC = () => {
  const { showToast } = useToast();
  const { formatCost } = useCurrency();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [policyFilter, setPolicyFilter] = useState<ReturnPolicy | ''>('');
  const [trackFilter, setTrackFilter] = useState<TrackMode | ''>('');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const {
    values: form,
    errors,
    handleChange: handleInputChange,
    handleBlur,
    validateForm,
    resetForm,
    setValues: setForm
  } = useForm({
    sku: '',
    name: '',
    description: '',
    returnPolicy: 'returnable' as ReturnPolicy,
    trackMode: 'serialized' as TrackMode,
    brand: '',
    model: '',
    unitCost: 0,
    currency: 'INR',
    reorderPoint: 0,
  }, {
    sku: { required: true },
    name: { required: true },
    unitCost: { min: 0 }
  });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const query: CatalogQuery = { page, limit: pageSize, isActive: true };
      if (search) query.search = search;
      if (policyFilter) query.returnPolicy = policyFilter;
      if (trackFilter) query.trackMode = trackFilter;

      const result = await catalogService.getAll(query);
      setItems(result.data);
      setTotal(result.total);
    } catch {
      showToast('Failed to load catalog', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, policyFilter, trackFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      if (editingItem) {
        await catalogService.update(editingItem.id, form);
        showToast('Catalog item updated', 'success');
      } else {
        await catalogService.create(form);
        showToast('Catalog item created', 'success');
      }
      setShowForm(false);
      setEditingItem(null);
      fetchItems();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Save failed', 'error');
    }
  };

  const policyStyles: Record<ReturnPolicy, string> = {
    returnable: 'bg-blue-100 text-blue-800',
    consumable: 'bg-orange-100 text-orange-800',
    assign_once: 'bg-purple-100 text-purple-800',
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <PageHeader title="Catalog" description={`${total} items`}>
        <Button
          onClick={() => { setShowForm(true); setEditingItem(null); setForm({ sku: '', name: '', description: '', returnPolicy: 'returnable', trackMode: 'serialized', brand: '', model: '', unitCost: 0, currency: 'INR', reorderPoint: 0 }); }}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Item
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text" placeholder="Search by name or SKU..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
        <select value={policyFilter} onChange={(e) => { setPolicyFilter(e.target.value as any); setPage(1); }} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">All Policies</option>
          <option value="returnable">Returnable</option>
          <option value="consumable">Consumable</option>
          <option value="assign_once">Assign Once</option>
        </select>
        <select value={trackFilter} onChange={(e) => { setTrackFilter(e.target.value as any); setPage(1); }} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">All Track Modes</option>
          <option value="serialized">Serialized</option>
          <option value="bulk_qty">Bulk Qty</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Brand / Model</TableHead>
                <TableHead>Return Policy</TableHead>
                <TableHead>Track Mode</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No catalog items</TableCell></TableRow>
              ) : items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono font-medium">{item.sku}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{[item.brand, item.model].filter(Boolean).join(' ') || '—'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${policyStyles[item.returnPolicy]}`}>
                      {item.returnPolicy.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.trackMode === 'serialized' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {item.trackMode === 'serialized' ? 'Serialized' : 'Bulk Qty'}
                    </span>
                  </TableCell>
                  <TableCell>{item.unitCost ? formatCost(Number(item.unitCost), item.currency) : '—'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-sm" onClick={() => {
                      setEditingItem(item);
                      setForm({ sku: item.sku, name: item.name, description: item.description || '', returnPolicy: item.returnPolicy, trackMode: item.trackMode, brand: item.brand || '', model: item.model || '', unitCost: item.unitCost || 0, currency: item.currency || 'INR', reorderPoint: item.reorderPoint });
                      setShowForm(true);
                    }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/40">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} items)
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit' : 'New'} Catalog Item</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="sku"
              label="SKU"
              required
              error={errors.sku}
              hint="Stock Keeping Unit (Unique)"
            >
              <Input
                type="text"
                value={form.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                onBlur={() => handleBlur('sku')}
                disabled={!!editingItem}
              />
            </FormField>
            <FormField
              id="name"
              label="Item Name"
              required
              error={errors.name}
            >
              <Input
                type="text"
                value={form.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                placeholder="e.g. Dell Latitude 5420"
              />
            </FormField>
            <FormField
              id="returnPolicy"
              label="Return Policy"
              required
            >
              <select
                value={form.returnPolicy}
                onChange={(e) => handleInputChange('returnPolicy', e.target.value as ReturnPolicy)}
                disabled={!!editingItem}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="returnable">Returnable</option>
                <option value="consumable">Consumable</option>
                <option value="assign_once">Assign Once</option>
              </select>
            </FormField>
            <FormField
              id="trackMode"
              label="Track Mode"
              required
            >
              <select
                value={form.trackMode}
                onChange={(e) => handleInputChange('trackMode', e.target.value as TrackMode)}
                disabled={!!editingItem}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="serialized">Serialized</option>
                <option value="bulk_qty">Bulk Qty</option>
              </select>
            </FormField>
            <FormField
              id="brand"
              label="Brand"
            >
              <Input
                type="text"
                value={form.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                placeholder="e.g. Dell"
              />
            </FormField>
            <FormField
              id="model"
              label="Model"
            >
              <Input
                type="text"
                value={form.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="e.g. Latitude 5420"
              />
            </FormField>
            <FormField
              id="unitCost"
              label="Unit Cost"
              error={errors.unitCost}
            >
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.unitCost}
                onChange={(e) => handleInputChange('unitCost', parseFloat(e.target.value))}
                onBlur={() => handleBlur('unitCost')}
              />
            </FormField>
            <FormField id="currency" label="Currency">
              <select id="currency" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={form.currency} onChange={(e) => handleInputChange('currency', e.target.value)}>
                {CURRENCY_OPTIONS.map(code => <option key={code} value={code}>{code}</option>)}
              </select>
            </FormField>
            <FormField
              id="reorderPoint"
              label="Reorder Point"
            >
              <Input
                type="number"
                min={0}
                value={form.reorderPoint}
                onChange={(e) => handleInputChange('reorderPoint', parseInt(e.target.value))}
              />
            </FormField>
          </div>
          <FormField
            id="description"
            label="Description"
          >
            <textarea
              value={form.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Detailed specifications or notes"
            />
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CatalogPage;
