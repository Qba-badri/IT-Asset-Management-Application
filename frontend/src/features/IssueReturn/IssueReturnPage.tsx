import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, RotateCcw, ArrowLeftRight, Search, AlertCircle, CheckCircle2,
  Calendar, User, MapPin, Hash, Tag, ChevronDown
} from 'lucide-react';
import { catalogService, CatalogItem, ReturnPolicy, TrackMode } from '../../services/catalogService';
import { assetUnitsService, AssetUnit } from '../../services/assetUnitsService';
import { assignmentsService, Assignment, IssueInput, ReturnInput } from '../../services/assignmentsService';
import { locationsService, Location } from '../../services/lookupService';
import { useToast } from '../../context/ToastContext';

type Mode = 'issue' | 'return';

/**
 * IssueReturnPage — Unified flow that adapts based on CatalogItem classification:
 *
 * Issue flow:
 *   1. Select catalog item → form adapts to ReturnPolicy + TrackMode
 *   2. Serialized: show asset unit picker (scan/search by tag)
 *   3. BulkQty: show quantity input + location selector
 *   4. Returnable: show due date field
 *   5. Consumable: no due date, no return expected
 *   6. AssignOnce: no due date, permanent assignment warning
 *
 * Return flow:
 *   1. Search active assignments by employee or asset tag
 *   2. Select assignment → show return form
 *   3. Partial return support for BulkQty
 *   4. Condition assessment on return
 */
const IssueReturnPage: React.FC = () => {
  const { showToast } = useToast();
  const [mode, setMode] = useState<Mode>('issue');
  const [loading, setLoading] = useState(false);

  // ─── Issue State ──────────────────────────────────────────
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogItem | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [availableUnits, setAvailableUnits] = useState<AssetUnit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<AssetUnit | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);

  const [issueForm, setIssueForm] = useState<IssueInput>({
    catalogItemId: 0,
    assigneeId: 0,
  });

  // ─── Return State ─────────────────────────────────────────
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [activeAssignments, setActiveAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [returnForm, setReturnForm] = useState<ReturnInput>({
    assignmentId: 0,
  });

  // ─── Load lookups ─────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [catalogResult, locationList] = await Promise.all([
          catalogService.getAll({ isActive: true, limit: 200 }),
          locationsService.getAll(),
        ]);
        setCatalogItems(catalogResult.data);
        setLocations(locationList);
      } catch (err) {
        showToast('Failed to load data', 'error');
      }
    };
    load();
  }, []);

  // ─── When catalog item selected, load available units ─────
  useEffect(() => {
    if (selectedCatalog && selectedCatalog.trackMode === 'serialized') {
      assetUnitsService
        .getAll({ catalogItemId: selectedCatalog.id, status: 'in_stock', limit: 200 })
        .then((res) => setAvailableUnits(res.data))
        .catch(() => setAvailableUnits([]));
    } else {
      setAvailableUnits([]);
      setSelectedUnit(null);
    }
  }, [selectedCatalog]);

  // ─── Search assignments for return mode ──────────────────
  const searchAssignments = useCallback(async () => {
    if (!assignmentSearch.trim()) return;
    try {
      const result = await assignmentsService.getHoldings({ page: 1, limit: 50 });
      // Client-side filter for simplicity; backend could add search param
      const filtered = result.data.filter(
        (a) =>
          a.assignee?.firstName?.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
          a.assignee?.lastName?.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
          a.assignee?.email?.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
          a.assetUnit?.assetTag?.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
          a.catalogItem?.name?.toLowerCase().includes(assignmentSearch.toLowerCase()),
      );
      setActiveAssignments(filtered);
    } catch {
      showToast('Failed to search assignments', 'error');
    }
  }, [assignmentSearch]);

  // ─── Submit Issue ─────────────────────────────────────────
  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatalog) return;

    const payload: IssueInput = {
      catalogItemId: selectedCatalog.id,
      assigneeId: issueForm.assigneeId,
      quantity: selectedCatalog.trackMode === 'bulk_qty' ? issueForm.quantity : 1,
      locationId: issueForm.locationId,
      departmentId: issueForm.departmentId,
      dueDate: issueForm.dueDate,
      notes: issueForm.notes,
    };

    if (selectedCatalog.trackMode === 'serialized' && selectedUnit) {
      payload.assetUnitId = selectedUnit.id;
    }

    setLoading(true);
    try {
      await assignmentsService.issue(payload);
      showToast(
        `Successfully issued ${selectedCatalog.name}${selectedUnit ? ` (${selectedUnit.assetTag})` : ''}`,
        'success',
      );
      // Reset form
      setSelectedCatalog(null);
      setSelectedUnit(null);
      setIssueForm({ catalogItemId: 0, assigneeId: 0 });
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Issue failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Submit Return ────────────────────────────────────────
  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    const payload: ReturnInput = {
      assignmentId: selectedAssignment.id,
      quantity: returnForm.quantity || 1,
      condition: returnForm.condition,
      returnToLocationId: returnForm.returnToLocationId,
      notes: returnForm.notes,
    };

    setLoading(true);
    try {
      await assignmentsService.processReturn(payload);
      showToast(
        `Return processed for ${selectedAssignment.catalogItem?.name || 'item'}`,
        'success',
      );
      setSelectedAssignment(null);
      setReturnForm({ assignmentId: 0 });
      setActiveAssignments([]);
      setAssignmentSearch('');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Return failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Filter catalog items by search ───────────────────────
  const filteredCatalog = catalogItems.filter(
    (c) =>
      c.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      c.sku.toLowerCase().includes(catalogSearch.toLowerCase()),
  );

  // ─── Helper: policy badge ─────────────────────────────────
  const policyBadge = (policy: ReturnPolicy) => {
    const styles: Record<ReturnPolicy, string> = {
      returnable: 'bg-blue-100 text-blue-800',
      consumable: 'bg-orange-100 text-orange-800',
      assign_once: 'bg-purple-100 text-purple-800',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[policy]}`}>
        {policy.replace('_', ' ')}
      </span>
    );
  };

  const trackBadge = (track: TrackMode) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${track === 'serialized' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
      {track === 'serialized' ? 'Serialized' : 'Bulk Qty'}
    </span>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* ─── Mode Toggle ──────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setMode('issue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'issue'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
        >
          <Package className="w-4 h-4" /> Issue
        </button>
        <button
          onClick={() => setMode('return')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'return'
            ? 'bg-green-600 text-white shadow-sm'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
        >
          <RotateCcw className="w-4 h-4" /> Return
        </button>
      </div>

      {/* ════════════════ ISSUE MODE ══════════════════════════ */}
      {mode === 'issue' && (
        <form onSubmit={handleIssue} className="space-y-6">
          {/* Step 1: Select Catalog Item */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">1. Select Item</h3>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search catalog by name or SKU..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {catalogSearch && (
              <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                {filteredCatalog.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedCatalog(item);
                      setCatalogSearch('');
                      setIssueForm((f) => ({ ...f, catalogItemId: item.id }));
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium text-sm">{item.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{item.sku}</span>
                    </div>
                    <div className="flex gap-2">
                      {policyBadge(item.returnPolicy)}
                      {trackBadge(item.trackMode)}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedCatalog && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{selectedCatalog.name}</p>
                  <p className="text-xs text-gray-600">
                    SKU: {selectedCatalog.sku} • {selectedCatalog.brand} {selectedCatalog.model}
                  </p>
                </div>
                <div className="flex gap-2">
                  {policyBadge(selectedCatalog.returnPolicy)}
                  {trackBadge(selectedCatalog.trackMode)}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Dynamic Fields Based on Classification */}
          {selectedCatalog && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">2. Assignment Details</h3>

              {/* Policy-specific warnings */}
              {selectedCatalog.returnPolicy === 'consumable' && (
                <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Consumable — stock will be deducted permanently. No return expected.
                </div>
              )}
              {selectedCatalog.returnPolicy === 'assign_once' && (
                <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Permanent assignment — this item will not be returned.
                </div>
              )}

              {/* Serialized: Asset Unit Picker */}
              {selectedCatalog.trackMode === 'serialized' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Tag className="w-4 h-4 inline mr-1" /> Select Asset Unit
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={selectedUnit?.id || ''}
                    onChange={(e) => {
                      const unit = availableUnits.find((u) => u.id === Number(e.target.value));
                      setSelectedUnit(unit || null);
                    }}
                    required
                  >
                    <option value="">— Select available unit —</option>
                    {availableUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.assetTag} {u.serialNumber ? `(S/N: ${u.serialNumber})` : ''} — {u.condition}
                      </option>
                    ))}
                  </select>
                  {availableUnits.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">No units available in stock</p>
                  )}
                </div>
              )}

              {/* BulkQty: Quantity + Location */}
              {selectedCatalog.trackMode === 'bulk_qty' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Hash className="w-4 h-4 inline mr-1" /> Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={issueForm.quantity || ''}
                      onChange={(e) => setIssueForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <MapPin className="w-4 h-4 inline mr-1" /> Issue From Location
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={issueForm.locationId || ''}
                      onChange={(e) => setIssueForm((f) => ({ ...f, locationId: Number(e.target.value) }))}
                      required
                    >
                      <option value="">— Select location —</option>
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Assignee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 inline mr-1" /> Assign To (Employee ID)
                </label>
                <input
                  type="number"
                  min={1}
                  value={issueForm.assigneeId || ''}
                  onChange={(e) => setIssueForm((f) => ({ ...f, assigneeId: Number(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Employee ID"
                  required
                />
              </div>

              {/* Due Date — only for Returnable */}
              {selectedCatalog.returnPolicy === 'returnable' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" /> Due Date
                  </label>
                  <input
                    type="date"
                    value={issueForm.dueDate || ''}
                    onChange={(e) => setIssueForm((f) => ({ ...f, dueDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={issueForm.notes || ''}
                  onChange={(e) => setIssueForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Processing...' : 'Issue Item'}
              </button>
            </div>
          )}
        </form>
      )}

      {/* ════════════════ RETURN MODE ═════════════════════════ */}
      {mode === 'return' && (
        <div className="space-y-6">
          {/* Search Assignments */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Search Active Assignments</h3>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by employee name, email, or asset tag..."
                  value={assignmentSearch}
                  onChange={(e) => setAssignmentSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchAssignments()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button
                type="button"
                onClick={searchAssignments}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
              >
                Search
              </button>
            </div>
          </div>

          {/* Active Assignments List */}
          {activeAssignments.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 divide-y">
              {activeAssignments.map((a) => {
                const remaining = a.quantity - a.returnedQuantity;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setSelectedAssignment(a);
                      setReturnForm({ assignmentId: a.id, quantity: remaining });
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-green-50 transition-colors ${selectedAssignment?.id === a.id ? 'bg-green-50 ring-2 ring-green-500 ring-inset' : ''
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {a.catalogItem?.name}
                          {a.assetUnit && (
                            <span className="text-gray-500 ml-2">({a.assetUnit.assetTag})</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          Assigned to: {a.assignee?.firstName} {a.assignee?.lastName} •
                          Qty: {remaining}/{a.quantity} remaining •
                          Issued: {new Date(a.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {a.dueDate && new Date(a.dueDate) < new Date() && (
                          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">
                            OVERDUE
                          </span>
                        )}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${a.status === 'active' ? 'bg-blue-50 text-blue-700' :
                          a.status === 'partially_returned' ? 'bg-yellow-50 text-yellow-700' :
                            'bg-gray-50 text-gray-700'
                          }`}>
                          {a.status}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Return Form */}
          {selectedAssignment && (
            <form onSubmit={handleReturn} className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Process Return</h3>

              <div className="p-3 bg-green-50 rounded-lg text-sm">
                <p className="font-medium">{selectedAssignment.catalogItem?.name}</p>
                <p className="text-gray-600">
                  {selectedAssignment.quantity - selectedAssignment.returnedQuantity} of{' '}
                  {selectedAssignment.quantity} remaining to return
                </p>
              </div>

              {/* Quantity (for BulkQty partial returns) */}
              {selectedAssignment.catalogItem?.trackMode === 'bulk_qty' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Return Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedAssignment.quantity - selectedAssignment.returnedQuantity}
                    value={returnForm.quantity || ''}
                    onChange={(e) => setReturnForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>
              )}

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition on Return</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={returnForm.condition || 'good'}
                  onChange={(e) => setReturnForm((f) => ({ ...f, condition: e.target.value as any }))}
                >
                  <option value="new">New</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>

              {/* Return To Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return To Location</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={returnForm.returnToLocationId || ''}
                  onChange={(e) => setReturnForm((f) => ({ ...f, returnToLocationId: Number(e.target.value) }))}
                >
                  <option value="">— Same as issue location —</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={returnForm.notes || ''}
                  onChange={(e) => setReturnForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Processing...' : 'Process Return'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default IssueReturnPage;
