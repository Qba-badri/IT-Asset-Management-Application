# Changelog

This file tracks notable feature additions and bug fixes, with enough detail (files touched,
endpoints, root cause) to be reused directly in release notes or further documentation.

## 2026-07-13

### 1. Dashboard — Recent Assignments KPI cards

Added three cards to `frontend/src/features/Dashboard/DashboardHome.tsx` showing the last 10
records for each domain, each with an icon header, a scrollable stacked-row list (not a
cramped table — see "Design notes" below), a color-coded status badge, and a "View All" link.

- **Asset Card** → Asset Name, Assigned To, Assigned Date, Status. Links to `/dashboard/assets`.
- **License Card** → License Name, Assigned To, Expiry Date, Status. Links to `/dashboard/licenses`.
- **Inventory Card** → Item Name, Assigned To, Quantity, Assigned Date. Links to `/dashboard/inventory`.

**Backend** — `backend/src/modules/dashboard-widgets/` (controller, service, module) already
existed and was wired into `app.module.ts`; endpoints:
- `GET /api/dashboard-widgets/recent-assets`
- `GET /api/dashboard-widgets/recent-licenses`
- `GET /api/dashboard-widgets/recent-inventory`

**Fixes applied on top of the initial build:**
- `dashboard-widgets.service.ts` `getRecentAssetAssignments` originally only fetched `CHECKOUT`
  history rows and showed the asset's *current* status for every row. Changed to fetch both
  `CHECKOUT` and `CHECKIN` (`AssetAction` enum) rows, with a per-row status of `deployed` /
  `returned` reflecting what actually happened at that point in time.
- `assets.service.ts` `undeploy()` wasn't recording who the asset was returned from
  (`assignedToId` was left blank on the `CHECKIN` history row) — fixed to pass
  `previousAssignedToId` into `logAction()`.
- View-all links pointed to `/assets`, `/licenses`, `/inventory` but those routes are nested
  under `/dashboard` in `App.tsx` — corrected to `/dashboard/assets` etc.

**Design notes:** the first implementation used a 4-column `<table>` per card, which either
overflowed the card width or truncated every field to `...`. Replaced with a stacked two-line
row layout (name + status badge on top, "Assigned To" and date/qty below) so every field gets
close to the full card width instead of a narrow fixed column.

### 2. "Recent Activity" (Analytics & Reporting page) showing nothing

**Root cause:** `AnalyticsService.getRecentActivity()` in
`backend/src/modules/analytics/analytics.service.ts` queried the legacy `audit_log` table
(`AuditLog` entity), which the app stopped writing to after moving to the newer append-only
`audit_events` table (`AuditEvent` entity) — already used successfully by the Dashboard's
"System Activity" feed (`getAuditActivityKpis`). The legacy table was empty, so the widget on
`AnalyticsDashboard.tsx` always rendered "No recent activity".

**Fix:** rewrote `getRecentActivity` to query `audit_events` via `auditEventRepository`,
join the actor, apply the same role-based scoping as elsewhere (non-Admins see only their own
actions), and return `actorName` alongside action/entityType/date. Frontend `ActivityLog`
interface and render in `AnalyticsDashboard.tsx` updated to show the actor name too.

### 3. Stock/seat adjustment — missing or disconnected across modules

Investigated three places where "adjust stock/seats" could apply:

| Area | Before | After |
|---|---|---|
| License seat adjustment | Backend endpoint + frontend modal both fully built, but no button opened the modal (`openAdjustSeatsModal` was dead code) | Added an "Adjust Seats" action to the `ActionDropdown` in `LicenseManagement.tsx` |
| Consumable inventory stock adjustment | Did not exist — only an unused `AdjustStockDto` shell, no service method, no controller route, no UI | Implemented end-to-end (see below) |
| Catalog/AssetUnits stock adjustment | Backend (`POST /api/stock/adjust`) + frontend service method (`stockService.adjust()`) existed, but `StockPage.tsx` had no UI to call it | Added an "Adjust" button + modal to `StockPage.tsx` |

**New consumable inventory adjustment (backend):**
- `AdjustStockDto` (already existed) used by a new `adjustStock()` method in
  `inventory-mgmt.service.ts` — accepts `itemId`, `quantity`, `type` (`IN`/`OUT`), `notes`.
  Only `IN` (increase) or `OUT` (decrease) are valid; `OUT` checks `availableStock` isn't
  exceeded. Every adjustment writes an `InventoryTransaction` (`type: ADJUSTMENT`) and an
  `AuditEvent` (`action: ADJUST`, `entityType: 'inventory_item'`) for traceability.
- New route: `POST /api/inventory-management/items/adjust-stock` (permission
  `inventory-mgmt.manage`).
- `AuditEvent` added to `inventory-mgmt.module.ts`'s `TypeOrmModule.forFeature([...])`.

**New consumable inventory adjustment (frontend):**
- `consumableInventoryService.adjustStock()` in `consumableInventoryService.ts`.
- "Adjust Stock" action + modal in `InventoryManagementModule.tsx` (IN/OUT select, quantity,
  reason).

**Catalog/AssetUnits stock (frontend only, backend already existed):**
- Added an "Adjust" icon button per row in the Stock Levels table and a modal in
  `StockPage.tsx`, calling the existing `stockService.adjust()` (`POST /api/stock/adjust`,
  which writes a `StockLedger` entry with `reason: ADJUSTMENT` + an `AuditEvent`).

### 4. Mandatory validation on all adjustment flows

Two rules enforced consistently across all three adjustment modals (license seats, consumable
inventory, catalog stock), both client-side (submit button disabled + guard in the handler)
and server-side (`class-validator` decorators, returns 400 if violated):

- **Reason is required** — `@IsNotEmpty()` on `AdjustStockDto.notes` (both inventory and
  stock DTOs) and `AdjustSeatsDto.reason` in `license.dto.ts`.
- **Quantity/seats must be > 0** — `@Min(1)` on `AdjustStockDto.quantity` (inventory),
  `AdjustStockDto.newQuantity` (catalog stock — note this previously allowed `0` as a
  legitimate way to empty out a location's stock; that use case is no longer supported via
  this screen), and `AdjustSeatsDto.seats` (license).

### 5. Non-refundable inventory items had no way to correct a mistaken assignment

Refundable items already support a "Return" flow to undo an assignment. Non-refundable items
had no equivalent — once assigned, there was no way to fix a wrong entry (wrong user, wrong
quantity).

**Backend (`inventory-mgmt.service.ts` / `.controller.ts` / `.dto.ts`):**
- New `DeleteAssignmentDto` (`reason` mandatory).
- New `deleteMistakenAssignment(assignmentId, dto, performedById)`: only allowed for
  non-refundable items on an `ASSIGNED`-status assignment (refundable items are told to use
  Return instead). Restores `assignment.quantity` to `item.availableStock`, sets the
  assignment to `CLOSED` and **soft-deletes** it (kept for audit, not hard-deleted), and logs
  both an `InventoryTransaction` (`type: ADJUSTMENT`, `referenceType: 'assignment_correction'`)
  and an `AuditEvent` (`action: DELETE`, `entityType: 'inventory_assignment'`).
- New route: `POST /api/inventory-management/assignments/:id/delete-mistake` — gated to the
  `Admin` role explicitly (403 otherwise) on top of the `inventory-mgmt.manage` permission.

**Frontend (`InventoryManagementModule.tsx`):**
- Loads `currentUser` via `authService.getProfile()` (mirrors the pattern already used in
  `LicenseManagement.tsx`).
- In the item Details → Assignments tab, non-refundable items now show a red trash-icon
  "Delete Mistaken Assignment" action (Admin-only) alongside the existing "Return" action for
  refundable items. Modal requires a reason before the button enables.

### 6. Dashboard chart "Serialized Asset Units" (KPI 4) always showing zero

**Root cause (same pattern as #2):** this app has two parallel asset-tracking systems — the
legacy `Asset` entity (used throughout `AssetManagement.tsx`, populated, backs "Total Assets"
and other working KPIs) and a newer `AssetUnit`/`CatalogItem` subsystem (used by
`AssetsListPage.tsx`/Stock/Assignments). The `AssetUnit`→`asset_units` table is fully wired
end-to-end (entity → service → controller → `assetUnitsService.create()`), but **no UI
anywhere actually calls that create function**, so the table is genuinely empty — the KPI
query itself had no bug, it was just measuring an unused subsystem.

**Fix:** repointed `getSerializedUnitKpis` in `analytics.service.ts` to group by the legacy
`Asset.status` field instead of `AssetUnit.status`, via the shared `applyFilters()` helper
(so it now also respects location/date filters and role-based scoping like the other Asset
KPIs):

| Card bucket | Asset.status values |
|---|---|
| In Stock | `AVAILABLE` |
| Assigned | `DEPLOYED` |
| In Repair | `MAINTENANCE` + `REPAIR` + `IN_REPAIR` |
| Written-Off | `DISPOSED` + `RETIRED` |
| Lost | `LOST` + `STOLEN` |

Response shape unchanged, so no frontend changes were needed. Removed the now-unused
`AssetUnitStatus` import (kept `AssetUnit`/`assetUnitRepository` since the type/injection may
still be needed if that subsystem gets a creation UI later).

### 7. Dashboard chart "Stock Movement" always showing zero

**Root cause:** identical pattern to #6 — `getStockMovement` queried the `StockLedger` table
(the newer catalog/AssetUnit subsystem, populated only via `POST /api/stock/adjust` /
`/initialize`, which had no UI until fix #3), while the app's real day-to-day purchase/
assignment/return activity is recorded in the legacy `InventoryTransaction` table
(consumable-inventory module).

**Fix:** repointed `getStockMovement` in `analytics.service.ts` to `inventoryTransactionRepository`,
grouping by transaction `type` and mapping to the reason labels the chart already expects:

| `InventoryTransactionType` | Chart label |
|---|---|
| `IN` | `procurement` |
| `OUT` | `issue` |
| `RETURN` | `return` |
| `ADJUSTMENT` | `adjustment` |

Dropped the `user`/`req.user` scoping parameter — `InventoryTransaction` has no department/
location columns to scope by (consistent with how this same repository is queried elsewhere,
e.g. the inventory turnover KPI). Removed the now-unused `LedgerReason` import (kept
`StockLedger`/`stockLedgerRepository`). Response shape (`{ reason, count }[]` for
`thisMonth`/`lastMonth`) unchanged, so no frontend changes were needed.

### 8. Dashboard "Assignment Health" KPI cards (9–12) always showing zero

**Root cause:** same two-parallel-subsystems pattern (see theme below). `getAssignmentKpis` in
`backend/src/modules/analytics/analytics.service.ts` read the `assignments` /
`return_transactions` tables (standalone Issue/Return module) — both empty. Real activity lives
in `inventory_assignments` / `inventory_returns` (consumable inventory) and `assets` with
status `deployed`.

**Fix:** repointed KPIs 9–12:
- **Active Assignments** = bulk `inventory_assignments` (`status='assigned'`) + serialized
  deployed assets. Same fix applied to `activeAssignments` in `getGlobalSummary` (Analytics page).
- **Overdue** = assigned bulk items past `expected_return_date`.
- **Return Rate (30d)** = (bulk `inventory_returns` + asset `return` audit events) ÷
  (bulk assignments created + asset `issue` audit events) in 30 days.
- **Returned Damaged** = returns with condition `poor`/`damaged`/`lost` from both sources.

Non-Admin role scoping preserved (own assignments / own asset events via jsonb metadata).
Removed `overdueExplicit` from the response and from `frontend/src/services/dashboardService.ts`
(nothing rendered it). Registered `InventoryAssignment`/`InventoryReturn` in `analytics.module.ts`.

### 9. Asset un-deploy now captures condition on return

Un-deploy only collected a free-text reason — the asset's physical state was never recorded, so
serialized returns could never count as "Returned Damaged".

- `AssetCondition` enum (`asset.entity.ts`) extended with `damaged`, `lost` (varchar column, no
  migration needed).
- `UndeployAssetDto` requires `condition` (`@IsEnum`); `undeploy()` updates `asset.condition`,
  includes it in the CHECKIN history note, and stores `conditionOnReturn` in the RETURN
  audit-event metadata (which KPI 12 reads).
- `AssetManagement.tsx` undeploy dialog: required "Condition on Return" select
  (New/Excellent/Good/Fair/Poor/Damaged/Lost); `assetService.undeployAsset` sends it.
- Historical rows have no condition (never captured) — no backfill possible.

### 10. Delete-vs-dispose policy enforced across Assets, Licenses, Inventory

**Policy:** a record that was never assigned may be (soft-)deleted; a record with assignment
history appears in audit reports and may only be end-of-lifed (dispose / terminate / keep).
Previously only *current* assignment blocked deletion, and deletes were hard:

- **Assets** (`assets.service.ts` `delete()`): now rejects if any `checkout`/`checkin`
  `asset_history` rows exist; `remove()` → `softRemove()` (entity already had `deleted_at`).
- **Licenses** (`licenses.service.ts` `delete()`): worst case — `license_history` has
  `onDelete: 'CASCADE'`, so hard-deleting a license silently wiped its entire history (and the
  audit report's License tab is built from that table). Added `deleted_at` to `License`,
  rejects if `assigned`/`unassigned` history exists, `delete()` → `softDelete()`.
- **Inventory items** (`inventory-mgmt.service.ts` `deleteItem()`): was only blocking
  refundable items with *active* assignments — now rejects any item with assignment history
  (including soft-deleted corrected assignments, via `withDeleted`).
- **Inventory categories** (`deleteCategory()`): item-count check now includes soft-deleted
  items (they still FK-reference the category; previously passed the check then failed on the
  FK with a raw 500); `remove()` → `softRemove()`.
- Frontends updated: confirmation dialogs explain the rule; error toasts surface the backend
  message (`AssetManagement.tsx`, `LicenseManagement.tsx`, `InventoryManagementModule.tsx`).

### 11. Audit report: names survive soft deletion

`audit-report.service.ts` joins/lookups excluded soft-deleted rows, so deleting an
asset/license/item blanked its name in historical report entries. Added `withDeleted()` to the
inventory-transaction item join, assignment/return person lookups, asset id lookup, and license
history join.

### 12. Return Item dialog — condition made mandatory

`CreateInventoryReturnDto.condition` was optional; the dialog allowed processing a return with
no condition selected (breaking KPI 12 counts).
- Backend: `@IsNotEmpty` + `@IsIn(['good','fair','damaged','lost'])`.
- Frontend (`InventoryManagementModule.tsx`): required `*` marker, "Process Return" disabled
  until selected, guard in `handleReturn`. Remarks stays optional.

### 13. License Audit "Performed By" always showed "System"

The audit report falls back to "System" when `license_history.performedById` is null — and the
license module never recorded it for assign/unassign/create/bulk-import (only renew and
seat-adjustment did). `licenses.controller.ts` now passes `req.user?.id` into
`assignLicense`/`unassignLicense`/`create`, and `bulkCreate` forwards its `userId` to `create`.
Existing rows can't be backfilled (performer never stored); new actions show real name & email.

---

## Recurring theme: two parallel subsystems

Several bugs in this session (#2, #6, #7) shared the same root cause: this codebase has two
generations of the same concept living side by side —

- **Audit logging:** legacy `audit_log` (`AuditLog` entity) vs. newer `audit_events`
  (`AuditEvent` entity, append-only, actively written to).
- **Physical asset tracking:** legacy `Asset` entity (what `AssetManagement.tsx` actually
  uses) vs. newer `AssetUnit`/`CatalogItem` serialized-tracking subsystem (fully built
  end-to-end but has no data because no UI creates records in it).
- **Consumable stock ledgering:** legacy `InventoryTransaction` (consumable-inventory module,
  actively used) vs. newer `StockLedger` (catalog/AssetUnit subsystem, only populated once a
  UI exists to call `stockService.adjust()`/`initialize()`).

**When a dashboard number or activity feed looks empty or wrong, check first whether it's
reading from the "new" table in one of these pairs while real usage flows through the "old"
one.** The newer tables/entities are not dead code — they're fully wired subsystems waiting on
a UI to populate them (e.g. an "Add Asset Unit" form) — but until that UI exists, any KPI
pointed at them will show zeros even though the equivalent legacy data is plentiful.
