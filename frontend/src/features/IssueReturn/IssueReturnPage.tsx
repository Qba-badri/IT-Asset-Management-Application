import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, RotateCcw, Search, AlertCircle,
  Calendar, User, MapPin, Hash, Tag
} from 'lucide-react';
import { catalogService, CatalogItem, ReturnPolicy, TrackMode } from '../../services/catalogService';
import { assetUnitsService, AssetUnit } from '../../services/assetUnitsService';
import { assignmentsService, Assignment, IssueInput, ReturnInput } from '../../services/assignmentsService';
import { locationsService, Location } from '../../services/lookupService';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

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
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${track === 'serialized' ? 'bg-green-100 text-green-800' : 'bg-muted text-foreground'
      }`}>
      {track === 'serialized' ? 'Serialized' : 'Bulk Qty'}
    </span>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Issue / Return" />

      {/* ─── Mode Toggle ──────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={mode === 'issue' ? 'default' : 'outline'}
          onClick={() => setMode('issue')}
        >
          <Package className="w-4 h-4 mr-2" /> Issue
        </Button>
        <Button
          type="button"
          variant={mode === 'return' ? 'success' : 'outline'}
          onClick={() => setMode('return')}
        >
          <RotateCcw className="w-4 h-4 mr-2" /> Return
        </Button>
      </div>

      {/* ════════════════ ISSUE MODE ══════════════════════════ */}
      {mode === 'issue' && (
        <form onSubmit={handleIssue} className="space-y-6">
          {/* Step 1: Select Catalog Item */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">1. Select Item</h3>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search catalog by name or SKU..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="pl-10"
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
                      className="w-full text-left px-4 py-2 hover:bg-accent flex items-center justify-between"
                    >
                      <div>
                        <span className="font-medium text-sm">{item.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{item.sku}</span>
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
                    <p className="text-xs text-muted-foreground">
                      SKU: {selectedCatalog.sku} • {selectedCatalog.brand} {selectedCatalog.model}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {policyBadge(selectedCatalog.returnPolicy)}
                    {trackBadge(selectedCatalog.trackMode)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Dynamic Fields Based on Classification */}
          {selectedCatalog && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">2. Assignment Details</h3>

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
                    <Label className="mb-1 flex items-center">
                      <Tag className="w-4 h-4 inline mr-1" /> Select Asset Unit
                    </Label>
                    <Select
                      value={selectedUnit ? String(selectedUnit.id) : ''}
                      onValueChange={(value) => {
                        const unit = availableUnits.find((u) => u.id === Number(value));
                        setSelectedUnit(unit || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="— Select available unit —" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUnits.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.assetTag} {u.serialNumber ? `(S/N: ${u.serialNumber})` : ''} — {u.condition}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {availableUnits.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">No units available in stock</p>
                    )}
                  </div>
                )}

                {/* BulkQty: Quantity + Location */}
                {selectedCatalog.trackMode === 'bulk_qty' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-1 flex items-center">
                        <Hash className="w-4 h-4 inline mr-1" /> Quantity
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={issueForm.quantity || ''}
                        onChange={(e) => setIssueForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                        required
                      />
                    </div>
                    <div>
                      <Label className="mb-1 flex items-center">
                        <MapPin className="w-4 h-4 inline mr-1" /> Issue From Location
                      </Label>
                      <Select
                        value={issueForm.locationId ? String(issueForm.locationId) : ''}
                        onValueChange={(value) => setIssueForm((f) => ({ ...f, locationId: Number(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="— Select location —" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((l) => (
                            <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Assignee */}
                <div>
                  <Label className="mb-1 flex items-center">
                    <User className="w-4 h-4 inline mr-1" /> Assign To (Employee ID)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={issueForm.assigneeId || ''}
                    onChange={(e) => setIssueForm((f) => ({ ...f, assigneeId: Number(e.target.value) }))}
                    placeholder="Employee ID"
                    required
                  />
                </div>

                {/* Due Date — only for Returnable */}
                {selectedCatalog.returnPolicy === 'returnable' && (
                  <div>
                    <Label className="mb-1 flex items-center">
                      <Calendar className="w-4 h-4 inline mr-1" /> Due Date
                    </Label>
                    <Input
                      type="date"
                      value={issueForm.dueDate || ''}
                      onChange={(e) => setIssueForm((f) => ({ ...f, dueDate: e.target.value }))}
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <Label className="mb-1">Notes</Label>
                  <Textarea
                    value={issueForm.notes || ''}
                    onChange={(e) => setIssueForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={2}
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Processing...' : 'Issue Item'}
                </Button>
              </CardContent>
            </Card>
          )}
        </form>
      )}

      {/* ════════════════ RETURN MODE ═════════════════════════ */}
      {mode === 'return' && (
        <div className="space-y-6">
          {/* Search Assignments */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Search Active Assignments</h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by employee name, email, or asset tag..."
                    value={assignmentSearch}
                    onChange={(e) => setAssignmentSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchAssignments()}
                    className="pl-10"
                  />
                </div>
                <Button type="button" variant="success" onClick={searchAssignments}>
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Active Assignments List */}
          {activeAssignments.length > 0 && (
            <Card>
              <CardContent className="p-0 divide-y">
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
                      className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors ${selectedAssignment?.id === a.id ? 'bg-accent ring-2 ring-green-500 ring-inset' : ''
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {a.catalogItem?.name}
                            {a.assetUnit && (
                              <span className="text-muted-foreground ml-2">({a.assetUnit.assetTag})</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
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
                              'bg-muted text-foreground'
                            }`}>
                            {a.status}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Return Form */}
          {selectedAssignment && (
            <Card>
              <form onSubmit={handleReturn}>
                <CardContent className="p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Process Return</h3>

                  <div className="p-3 bg-green-50 rounded-lg text-sm">
                    <p className="font-medium">{selectedAssignment.catalogItem?.name}</p>
                    <p className="text-muted-foreground">
                      {selectedAssignment.quantity - selectedAssignment.returnedQuantity} of{' '}
                      {selectedAssignment.quantity} remaining to return
                    </p>
                  </div>

                  {/* Quantity (for BulkQty partial returns) */}
                  {selectedAssignment.catalogItem?.trackMode === 'bulk_qty' && (
                    <div>
                      <Label className="mb-1">Return Quantity</Label>
                      <Input
                        type="number"
                        min={1}
                        max={selectedAssignment.quantity - selectedAssignment.returnedQuantity}
                        value={returnForm.quantity || ''}
                        onChange={(e) => setReturnForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                        required
                      />
                    </div>
                  )}

                  {/* Condition */}
                  <div>
                    <Label className="mb-1">Condition on Return</Label>
                    <Select
                      value={returnForm.condition || 'good'}
                      onValueChange={(value) => setReturnForm((f) => ({ ...f, condition: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Return To Location */}
                  <div>
                    <Label className="mb-1">Return To Location</Label>
                    <Select
                      value={returnForm.returnToLocationId ? String(returnForm.returnToLocationId) : 'same'}
                      onValueChange={(value) => setReturnForm((f) => ({ ...f, returnToLocationId: value === 'same' ? undefined : Number(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="— Same as issue location —" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="same">— Same as issue location —</SelectItem>
                        {locations.map((l) => (
                          <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label className="mb-1">Notes</Label>
                    <Textarea
                      value={returnForm.notes || ''}
                      onChange={(e) => setReturnForm((f) => ({ ...f, notes: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  <Button type="submit" variant="success" disabled={loading} className="w-full">
                    {loading ? 'Processing...' : 'Process Return'}
                  </Button>
                </CardContent>
              </form>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default IssueReturnPage;
