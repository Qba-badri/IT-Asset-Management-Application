import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Edit2, Package, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';
import { catalogService, CatalogItem, CatalogQuery, ReturnPolicy, TrackMode } from '../../services/catalogService';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '../../context/CurrencyContext';
import { FormField } from '../../components/shared/FormField';
import { useForm } from '../../hooks/useForm';

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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalog</h1>
          <p className="text-sm text-gray-500">{total} items</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingItem(null); setForm({ sku: '', name: '', description: '', returnPolicy: 'returnable', trackMode: 'serialized', brand: '', model: '', unitCost: 0, reorderPoint: 0 }); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" placeholder="Search by name or SKU..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <select value={policyFilter} onChange={(e) => { setPolicyFilter(e.target.value as any); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Policies</option>
          <option value="returnable">Returnable</option>
          <option value="consumable">Consumable</option>
          <option value="assign_once">Assign Once</option>
        </select>
        <select value={trackFilter} onChange={(e) => { setTrackFilter(e.target.value as any); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Track Modes</option>
          <option value="serialized">Serialized</option>
          <option value="bulk_qty">Bulk Qty</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">SKU</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Brand / Model</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Return Policy</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Track Mode</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Unit Cost</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No catalog items</td></tr>
            ) : items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-medium">{item.sku}</td>
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3 text-gray-600">{[item.brand, item.model].filter(Boolean).join(' ') || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${policyStyles[item.returnPolicy]}`}>
                    {item.returnPolicy.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.trackMode === 'serialized' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {item.trackMode === 'serialized' ? 'Serialized' : 'Bulk Qty'}
                  </span>
                </td>
                <td className="px-4 py-3">{item.unitCost ? formatCost(Number(item.unitCost)) : '—'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => {
                    setEditingItem(item);
                    setForm({ sku: item.sku, name: item.name, description: item.description || '', returnPolicy: item.returnPolicy, trackMode: item.trackMode, brand: item.brand || '', model: item.model || '', unitCost: item.unitCost || 0, reorderPoint: item.reorderPoint });
                    setShowForm(true);
                  }} className="p-1 text-gray-400 hover:text-blue-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages} ({total} items)
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold">{editingItem ? 'Edit' : 'New'} Catalog Item</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                id="sku"
                label="SKU"
                required
                error={errors.sku}
                hint="Stock Keeping Unit (Unique)"
              >
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  onBlur={() => handleBlur('sku')}
                  disabled={!!editingItem}
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                />
              </FormField>
              <FormField
                id="name"
                label="Item Name"
                required
                error={errors.name}
              >
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
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
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
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
                  className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                >
                  <option value="serialized">Serialized</option>
                  <option value="bulk_qty">Bulk Qty</option>
                </select>
              </FormField>
              <FormField
                id="brand"
                label="Brand"
              >
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. Dell"
                />
              </FormField>
              <FormField
                id="model"
                label="Model"
              >
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. Latitude 5420"
                />
              </FormField>
              <FormField
                id="unitCost"
                label="Unit Cost"
                error={errors.unitCost}
              >
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.unitCost}
                  onChange={(e) => handleInputChange('unitCost', parseFloat(e.target.value))}
                  onBlur={() => handleBlur('unitCost')}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </FormField>
              <FormField
                id="reorderPoint"
                label="Reorder Point"
              >
                <input
                  type="number"
                  min={0}
                  value={form.reorderPoint}
                  onChange={(e) => handleInputChange('reorderPoint', parseInt(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
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
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Detailed specifications or notes"
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-700 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogPage;
