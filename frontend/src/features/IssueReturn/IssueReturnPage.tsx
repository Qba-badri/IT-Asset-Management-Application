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
import { SelectItem } from '../../components/ui/select';
import { FormField } from '../../components/shared/FormField';
import { SelectField } from '../../components/shared/SelectField';
import { useValidatedForm, CrossFieldValidator } from '../../hooks/useValidatedForm';
import { isEmptyValue } from '../../lib/validation/isEmpty';

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
  const [locations, setLocations] = useState<Location[]>([]);

  // ─── Return State ─────────────────────────────────────────
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [activeAssignments, setActiveAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  /**
   * Issue rules the DTO cannot express.
   *
   * assetUnitId and locationId are required depending on the catalog item's
   * trackMode, which is not part of the payload — the server reads it from the
   * database, so @RequiredWhen (which gates on a sibling field) cannot describe
   * it. These mirror the imperative checks in AssignmentsService.issue().
   *
   * quantity is a UI-only rule: the service defaults an absent quantity to 1,
   * so the API does not require it, but this form always has. Emptiness is
   * tested with isEmptyValue rather than `!value` so a quantity of 0 falls
   * through to the schema's @Min(1) and gets the accurate message.
   */
  const issueRules: CrossFieldValidator<Record<string, any>> = (values) => {
    const errors: Record<string, string> = {};
    if (!selectedCatalog) return errors;

    if (selectedCatalog.trackMode === 'serialized') {
      // Checked against the resolved unit, not the raw id: switching catalog
      // items can leave an id that is no longer in availableUnits, which would
      // pass a bare presence check while the payload omits it — and the server
      // would reject what the client called valid.
      if (!selectedUnit) {
        errors.assetUnitId = 'Select Asset Unit is required for serialized items.';
      }
    }

    if (selectedCatalog.trackMode === 'bulk_qty') {
      if (isEmptyValue(values.quantity, 'number')) {
        errors.quantity = 'Quantity is required.';
      }
      if (isEmptyValue(values.locationId, 'select')) {
        errors.locationId = 'Issue From Location is required for bulk items.';
      }
    }

    return errors;
  };

  const {
    values: issueForm,
    errors: issueErrors,
    isRequired: isIssueFieldRequired,
    handleChange: handleIssueChange,
    handleBlur: handleIssueBlur,
    validateForm: validateIssueForm,
    applyServerErrors: applyIssueServerErrors,
    resetForm: resetIssueForm,
  } = useValidatedForm({
    formKey: 'assignment.issue',
    initialValues: {
      catalogItemId: 0,
      assetUnitId: undefined,
      assigneeId: undefined,
      quantity: undefined,
      locationId: undefined,
      departmentId: undefined,
      dueDate: '',
      notes: '',
    } as Record<string, any>,
    labels: {
      assetUnitId: 'Select Asset Unit',
      assigneeId: 'Assign To (Employee ID)',
      quantity: 'Quantity',
      locationId: 'Issue From Location',
      dueDate: 'Due Date',
      notes: 'Notes',
    },
    crossFieldValidators: [issueRules],
  });

  /**
   * Derived rather than separate state: assetUnitId lives in the form values so
   * it can be validated and carry a field-level error like any other field.
   */
  const selectedUnit = availableUnits.find((u) => u.id === issueForm.assetUnitId) ?? null;

  /**
   * Return rules the DTO cannot express.
   *
   * quantity is UI-only for bulk items (the service defaults it to 1), and the
   * remaining-quantity ceiling depends on the selected assignment's current
   * state, which no DTO decorator can see. The server enforces the same ceiling
   * in processReturn().
   */
  const returnRules: CrossFieldValidator<Record<string, any>> = (values) => {
    const errors: Record<string, string> = {};
    if (!selectedAssignment) return errors;

    const remaining = selectedAssignment.quantity - selectedAssignment.returnedQuantity;

    if (selectedAssignment.catalogItem?.trackMode === 'bulk_qty') {
      if (isEmptyValue(values.quantity, 'number')) {
        errors.quantity = 'Return Quantity is required.';
      } else if (Number(values.quantity) > remaining) {
        errors.quantity = `Cannot return more than the ${remaining} remaining.`;
      }
    }

    return errors;
  };

  const {
    values: returnForm,
    errors: returnErrors,
    isRequired: isReturnFieldRequired,
    handleChange: handleReturnChange,
    handleBlur: handleReturnBlur,
    validateForm: validateReturnForm,
    applyServerErrors: applyReturnServerErrors,
    resetForm: resetReturnForm,
  } = useValidatedForm({
    formKey: 'assignment.return',
    initialValues: {
      assignmentId: 0,
      quantity: undefined,
      condition: 'good',
      returnToLocationId: undefined,
      notes: '',
    } as Record<string, any>,
    labels: {
      quantity: 'Return Quantity',
      condition: 'Condition on Return',
      returnToLocationId: 'Return To Location',
      notes: 'Notes',
    },
    crossFieldValidators: [returnRules],
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
    if (!validateIssueForm()) return;

    const payload: IssueInput = {
      catalogItemId: selectedCatalog.id,
      assigneeId: issueForm.assigneeId,
      quantity: selectedCatalog.trackMode === 'bulk_qty' ? issueForm.quantity : 1,
      locationId: issueForm.locationId,
      departmentId: issueForm.departmentId,
      dueDate: issueForm.dueDate || undefined,
      notes: issueForm.notes || undefined,
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
      resetIssueForm();
    } catch (err: any) {
      // Server-side validation wins: put its messages on the fields that caused
      // them and keep the form open so the user keeps their input.
      if (err?.fieldErrors) applyIssueServerErrors(err.fieldErrors);
      showToast(err?.friendlyMessage || 'Issue failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Submit Return ────────────────────────────────────────
  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    if (!validateReturnForm()) return;

    const payload: ReturnInput = {
      assignmentId: selectedAssignment.id,
      quantity: returnForm.quantity || 1,
      condition: returnForm.condition,
      returnToLocationId: returnForm.returnToLocationId,
      notes: returnForm.notes || undefined,
    };

    setLoading(true);
    try {
      await assignmentsService.processReturn(payload);
      showToast(
        `Return processed for ${selectedAssignment.catalogItem?.name || 'item'}`,
        'success',
      );
      setSelectedAssignment(null);
      resetReturnForm();
      setActiveAssignments([]);
      setAssignmentSearch('');
    } catch (err: any) {
      if (err?.fieldErrors) applyReturnServerErrors(err.fieldErrors);
      showToast(err?.friendlyMessage || 'Return failed', 'error');
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
                        handleIssueChange('catalogItemId', item.id);
                        // A unit from the previously selected item must not
                        // carry over to a different one.
                        handleIssueChange('assetUnitId', undefined);
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
                    <FormField
                      id="assetUnitId"
                      label={<><Tag className="w-4 h-4 inline mr-1" /> Select Asset Unit</>}
                      /* Required via ISSUE_FORM rules, mirroring the server's
                         "assetUnitId is required for serialized items". */
                      required
                      error={issueErrors.assetUnitId}
                    >
                      <SelectField
                        value={issueForm.assetUnitId ? String(issueForm.assetUnitId) : ''}
                        onValueChange={(value) => handleIssueChange('assetUnitId', Number(value))}
                        onBlur={() => handleIssueBlur('assetUnitId')}
                        placeholder="— Select available unit —"
                      >
                        {availableUnits.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.assetTag} {u.serialNumber ? `(S/N: ${u.serialNumber})` : ''} — {u.condition}
                          </SelectItem>
                        ))}
                      </SelectField>
                    </FormField>
                    {availableUnits.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">No units available in stock</p>
                    )}
                  </div>
                )}

                {/* BulkQty: Quantity + Location */}
                {selectedCatalog.trackMode === 'bulk_qty' && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      id="quantity"
                      label={<><Hash className="w-4 h-4 inline mr-1" /> Quantity</>}
                      /* UI-only rule: the service defaults an absent quantity
                         to 1, so the API does not require it — but this form
                         always has. */
                      required
                      error={issueErrors.quantity}
                    >
                      <Input
                        type="number"
                        min={1}
                        value={issueForm.quantity ?? ''}
                        onChange={(e) =>
                          handleIssueChange(
                            'quantity',
                            e.target.value === '' ? undefined : Number(e.target.value),
                          )
                        }
                        onBlur={() => handleIssueBlur('quantity')}
                      />
                    </FormField>
                    <FormField
                      id="locationId"
                      label={<><MapPin className="w-4 h-4 inline mr-1" /> Issue From Location</>}
                      /* Mirrors the server's "locationId is required for
                         BulkQty items". */
                      required
                      error={issueErrors.locationId}
                    >
                      <SelectField
                        value={issueForm.locationId ? String(issueForm.locationId) : ''}
                        onValueChange={(value) => handleIssueChange('locationId', Number(value))}
                        onBlur={() => handleIssueBlur('locationId')}
                        placeholder="— Select location —"
                      >
                        {locations.map((l) => (
                          <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                        ))}
                      </SelectField>
                    </FormField>
                  </div>
                )}

                {/* Assignee */}
                <FormField
                  id="assigneeId"
                  label={<><User className="w-4 h-4 inline mr-1" /> Assign To (Employee ID)</>}
                  required={isIssueFieldRequired('assigneeId')}
                  error={issueErrors.assigneeId}
                >
                  <Input
                    type="number"
                    min={1}
                    value={issueForm.assigneeId ?? ''}
                    onChange={(e) =>
                      handleIssueChange(
                        'assigneeId',
                        e.target.value === '' ? undefined : Number(e.target.value),
                      )
                    }
                    onBlur={() => handleIssueBlur('assigneeId')}
                    placeholder="Employee ID"
                  />
                </FormField>

                {/* Due Date — only for Returnable */}
                {selectedCatalog.returnPolicy === 'returnable' && (
                  <FormField
                    id="dueDate"
                    label={<><Calendar className="w-4 h-4 inline mr-1" /> Due Date</>}
                    required={isIssueFieldRequired('dueDate')}
                    error={issueErrors.dueDate}
                  >
                    <Input
                      type="date"
                      value={issueForm.dueDate || ''}
                      onChange={(e) => handleIssueChange('dueDate', e.target.value)}
                      onBlur={() => handleIssueBlur('dueDate')}
                    />
                  </FormField>
                )}

                {/* Notes */}
                <FormField
                  id="notes"
                  label="Notes"
                  required={isIssueFieldRequired('notes')}
                  error={issueErrors.notes}
                >
                  <Textarea
                    value={issueForm.notes || ''}
                    onChange={(e) => handleIssueChange('notes', e.target.value)}
                    onBlur={() => handleIssueBlur('notes')}
                    rows={2}
                  />
                </FormField>

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
                        resetReturnForm({
                          assignmentId: a.id,
                          quantity: remaining,
                          condition: 'good',
                          returnToLocationId: undefined,
                          notes: '',
                        });
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
                    <FormField
                      id="quantity"
                      label="Return Quantity"
                      /* UI-only rule (the service defaults it to 1); the
                         remaining-quantity ceiling mirrors processReturn(). */
                      required
                      error={returnErrors.quantity}
                    >
                      <Input
                        type="number"
                        min={1}
                        max={selectedAssignment.quantity - selectedAssignment.returnedQuantity}
                        value={returnForm.quantity ?? ''}
                        onChange={(e) =>
                          handleReturnChange(
                            'quantity',
                            e.target.value === '' ? undefined : Number(e.target.value),
                          )
                        }
                        onBlur={() => handleReturnBlur('quantity')}
                      />
                    </FormField>
                  )}

                  {/* Condition */}
                  <FormField
                    id="condition"
                    label="Condition on Return"
                    required={isReturnFieldRequired('condition')}
                    error={returnErrors.condition}
                  >
                    <SelectField
                      value={returnForm.condition || 'good'}
                      onValueChange={(value) => handleReturnChange('condition', value)}
                      onBlur={() => handleReturnBlur('condition')}
                    >
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="damaged">Damaged</SelectItem>
                    </SelectField>
                  </FormField>

                  {/* Return To Location */}
                  <FormField
                    id="returnToLocationId"
                    label="Return To Location"
                    required={isReturnFieldRequired('returnToLocationId')}
                    error={returnErrors.returnToLocationId}
                  >
                    <SelectField
                      value={returnForm.returnToLocationId ? String(returnForm.returnToLocationId) : 'same'}
                      onValueChange={(value) =>
                        handleReturnChange(
                          'returnToLocationId',
                          value === 'same' ? undefined : Number(value),
                        )
                      }
                      onBlur={() => handleReturnBlur('returnToLocationId')}
                      placeholder="— Same as issue location —"
                    >
                      <SelectItem value="same">— Same as issue location —</SelectItem>
                      {locations.map((l) => (
                        <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                      ))}
                    </SelectField>
                  </FormField>

                  {/* Notes */}
                  <FormField
                    id="returnNotes"
                    label="Notes"
                    required={isReturnFieldRequired('notes')}
                    error={returnErrors.notes}
                  >
                    <Textarea
                      value={returnForm.notes || ''}
                      onChange={(e) => handleReturnChange('notes', e.target.value)}
                      onBlur={() => handleReturnBlur('notes')}
                      rows={2}
                    />
                  </FormField>

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
