# 📋 Implemented User Stories - IT Asset Management System (ITAM)

This document is a comprehensive compilation of all user stories implemented across the frontend and backend of the enterprise-grade IT Asset Management (ITAM) system. It maps business requirements to exact technical components and database schemas.

---

## 📂 Domain Index
1. [User Identity, Authentication, & RBAC (Stories 1-7)](#-1-user-identity-authentication--rbac)
2. [Organizational Master Data (Stories 8-14)](#-2-organizational-master-data)
3. [Hardware Asset Lifecycle Management (Stories 15-25)](#-3-hardware-asset-lifecycle-management)
4. [Software License Compliance & Tracking (Stories 26-30)](#-4-software-license-compliance--tracking)
5. [Consumable Inventory & Stock Ledger (Stories 31-37)](#-5-consumable-inventory--stock-ledger)
6. [Audit, Operations, & Reporting (Stories 38-43)](#-6-audit-operations--reporting)
7. [System Integrations & UI Optimizations (Stories 44-46)](#-7-system-integrations--ui-optimizations)
8. [Advanced System Monitoring & Data Integrity (Stories 47-55)](#-8-advanced-system-monitoring--data-integrity)

---

## 🔐 1. User Identity, Authentication, & RBAC

### User Story 1: Secure Login & Session Authorization
> **As a System User**,  
> **I want to** authenticate securely with my email and password and receive an access token,  
> **So that** I can access the authorized sections of the ITAM application.
- **Business Value**: Protects company asset data from unauthorized external access.
- **Implementation**: Uses JWT (JSON Web Tokens) with passport-jwt strategies on the backend, storing signed payloads. The frontend manages local storage sessions and adds Authorization headers to Axios calls.
- **Components**: 
  - Backend: [auth.service.ts](../backend/src/modules/auth/auth.service.ts), `auth.controller.ts`
  - Frontend: [Login.tsx](../frontend/src/components/Login/Login.tsx)

### User Story 2: Self-Service Password Reset & OTP Flow
> **As a Registered User**,  
> **I want to** request a password reset OTP code sent to my email when I forget my password,  
> **So that** I can securely update my password without needing IT support intervention.
- **Business Value**: Reduces support ticket overhead for password lockouts.
- **Implementation**: Generates temporary OTP codes saved to the `password_reset_tokens` table with custom expirations. If verified, the backend hashes the new password with bcrypt.
- **Components**:
  - Backend: [password-reset-token.entity.ts](../backend/src/entities/password-reset-token.entity.ts), `auth.service.ts`
  - Frontend: [ForgotPassword.tsx](../frontend/src/components/ForgotPassword/ForgotPassword.tsx)

### User Story 3: User Profile Self-Service
> **As an Employee**,  
> **I want to** view my profile details and update my contact details (like phone number or room location),  
> **So that** my contact details are kept up-to-date in the company asset directory.
- **Business Value**: Keeps contact logs clean for asset retrieval.
- **Implementation**: Exposes a `PUT /users/me` endpoint restricted to self-profile modifications using a whitelisted `UpdateProfileDto` to prevent self-role escalation.
- **Components**:
  - Backend: [users.controller.ts](../backend/src/modules/users/users.controller.ts) (`/me` routes)
  - Frontend: [UserProfile.tsx](../frontend/src/features/UserManagement/UserProfile.tsx)

### User Story 4: Administrator User Provisioning
> **As an IT Administrator**,  
> **I want to** create, update, deactivate, and delete user accounts,  
> **So that** I can manage employee access rights as people onboard, offboard, or change roles.
- **Business Value**: Centralizes lifecycle control for employee access.
- **Implementation**: Admin users with `users.edit` and `users.delete` permissions make calls to `PUT /users/:id` and `DELETE /users/:id`.
- **Components**:
  - Backend: [users.controller.ts](../backend/src/modules/users/users.controller.ts)
  - Frontend: [UserManagement.tsx](../frontend/src/features/UserManagement/UserManagement.tsx)

### User Story 5: Role Configuration & Permission Mapping
> **As an IT Administrator**,  
> **I want to** define roles (e.g. Admin, Manager, IT Staff) and associate specific permission slugs to each role,  
> **So that** I can enforce granular feature access controls dynamically.
- **Business Value**: Supports custom roles for different team access requirements.
- **Implementation**: Utilizes `roles`, `permissions`, and the `role_permissions` junction table. Backend controllers use custom `@Permissions()` guards to restrict route access.
- **Components**:
  - Backend: `rbac.service.ts`, `permissions.guard.ts`
  - Frontend: [RoleMaster.tsx](../frontend/src/features/Admin/RoleMaster.tsx), [PermissionMaster.tsx](../frontend/src/features/Admin/PermissionMaster.tsx)

### User Story 6: Enforced Permission Safeguards
> **As a System Administrator**,  
> **I want the API** to reject any unauthorized requests and the UI to hide buttons for actions that users don't have permissions for,  
> **So that** users are prevented from executing unauthorized commands.
- **Business Value**: Implements defense-in-depth and reduces UI clutter.
- **Implementation**: Frontend helper functions check the user permission arrays to hide elements (e.g., delete buttons). The backend uses guards to return a `403 Forbidden` error.
- **Components**:
  - Backend: `permissions.guard.ts`
  - Frontend: [LicenseManagement.tsx](../frontend/src/features/Licenses/LicenseManagement.tsx), [AssetManagement.tsx](../frontend/src/features/Assets/AssetManagement.tsx)

### User Story 7: Role–Permission Matrix Bulk Editing
> **As an IT Administrator**,  
> **I want to** view all roles and permissions together in a single grid (matrix) and toggle assignments in bulk,  
> **So that** I can audit and reconfigure access rights across all roles at a glance instead of editing one role at a time.
- **Business Value**: Dramatically speeds up access reviews and reduces misconfiguration risk during audits.
- **Implementation**: Renders a roles-by-permissions checkbox matrix backed by the RBAC endpoints, persisting changes to the `role_permissions` junction table.
- **Components**:
  - Backend: `rbac.service.ts`
  - Frontend: [RolePermissionMatrix.tsx](../frontend/src/features/Admin/RolePermissionMatrix.tsx)

---

## 🏢 2. Organizational Master Data

### User Story 8: Department & Cost Center Setup
> **As an IT Administrator**,  
> **I want to** create and manage department cost centers,  
> **So that** we can assign hardware/software expenses to specific business units.
- **Business Value**: Simplifies budgeting and cross-department cost reallocation.
- **Implementation**: Maps department names and cost center codes through the `Department` entity, supporting CRUD endpoints.
- **Components**:
  - Backend: `departments.module.ts`, [department.entity.ts](../backend/src/entities/department.entity.ts)
  - Frontend: [AppShell.tsx](../frontend/src/components/layout/AppShell.tsx) (sidebar references)

### User Story 9: Physical Location Configurations
> **As a Logistics Manager**,  
> **I want to** define company buildings, floors, and server rooms,  
> **So that** we can track where physical assets and inventory items are stored.
- **Business Value**: Speeds up physical asset tracking and deployment auditing.
- **Implementation**: Connects assets to location records via `Location` entity foreign keys.
- **Components**:
  - Backend: `locations.module.ts`, [location.entity.ts](../backend/src/entities/location.entity.ts)

### User Story 10: Brand and Manufacturer Registration
> **As an IT Buyer**,  
> **I want to** maintain a list of hardware manufacturers and brand names,  
> **So that** asset details use clean, standardized manufacturer labels instead of free-text.
- **Business Value**: Prevents duplicate brand labels (e.g., "Apple" vs. "Apple Inc.").
- **Implementation**: Eagerly loaded lookup table mapped to hardware records.
- **Components**:
  - Backend: [brand.entity.ts](../backend/src/entities/brand.entity.ts), `master.module.ts`
  - Frontend: [MasterPages.tsx](../frontend/src/features/Admin/MasterPages.tsx) (Brand Master)

### User Story 11: Vendor / Partner Directory
> **As a Procurement Officer**,  
> **I want to** register vendor contact details and leasing companies in a supplier database,  
> **So that** I can easily access supplier info for maintenance requests and warranty support.
- **Business Value**: Centralizes supplier contact details for faster hardware support resolution.
- **Implementation**: Standard CRUD endpoints for the `Vendor` entity.
- **Components**:
  - Backend: [vendor.entity.ts](../backend/src/entities/vendor.entity.ts)
  - Frontend: [MasterPages.tsx](../frontend/src/features/Admin/MasterPages.tsx) (Vendor Master)

### User Story 12: System Lookup Configurations
> **As an Operations Specialist**,  
> **I want to** manage status options, disposal methods, and condition types,  
> **So that** lookup options match company guidelines without requiring code changes.
- **Business Value**: Makes dropdown options configurable.
- **Implementation**: A generic `Lookup` table storing key-value pairs for asset condition/disposal states.
- **Components**:
  - Backend: [lookup.entity.ts](../backend/src/entities/lookup.entity.ts)
  - Frontend: [MasterPages.tsx](../frontend/src/features/Admin/MasterPages.tsx)

### User Story 13: Currency Localization Preferences
> **As a Global IT Manager**,  
> **I want to** configure the default currency symbol (e.g. ₹ or $) in user preferences,  
> **So that** all costs, rents, and depreciation values are formatted in the local currency.
- **Business Value**: Improves reporting clarity across international offices.
- **Implementation**: React context intercepts all currency display strings, translating them dynamically based on user context settings.
- **Components**:
  - Frontend: [CurrencyContext.tsx](../frontend/src/context/CurrencyContext.tsx), [UserSettings.tsx](../frontend/src/features/UserManagement/UserSettings.tsx)

### User Story 14: System Settings Management
> **As a System Administrator**,  
> **I want to** configure application-wide settings (branding, defaults, operational parameters) from an admin screen,  
> **So that** system behavior can be tuned without code deployments or database access.
- **Business Value**: Empowers administrators to adapt the platform to company policy changes instantly.
- **Implementation**: Key-value settings persisted via the `SystemSetting` entity and exposed through the settings module CRUD endpoints.
- **Components**:
  - Backend: [settings.service.ts](../backend/src/modules/settings/settings.service.ts), [system-setting.entity.ts](../backend/src/entities/system-setting.entity.ts)
  - Frontend: [SystemSettings.tsx](../frontend/src/features/Admin/SystemSettings.tsx)

---

## 🖥️ 3. Hardware Asset Lifecycle Management

### User Story 15: New Asset Cataloging & Tag Mapping
> **As an IT Support Engineer**,  
> **I want to** register new physical assets with unique barcode tags, serial numbers, and model specifications,  
> **So that** every device has a unique digital profile in the tracking database.
- **Business Value**: Prevents duplicate entries and secures device traceability.
- **Implementation**: Inserts into the `assets` table with unique constraint checks on `asset_tag` and validation decorators on inputs.
- **Components**:
  - Backend: [asset.entity.ts](../backend/src/entities/asset.entity.ts), `CreateAssetDto`
  - Frontend: [AssetManagement.tsx](../frontend/src/features/Assets/AssetManagement.tsx)

### User Story 16: Acquisition Type (CAPEX vs OPEX) Toggle
> **As an IT Manager / Finance Officer**,  
> **I want to** specify whether an asset is **Purchased** or **Rented** using a toggle control,  
> **So that** I only fill out relevant financial fields (purchase cost vs monthly rent) based on my selection.
- **Business Value**: Streamlines the creation form and ensures financial data integrity.
- **Implementation**: Replaced standard button arrays with a custom toggle switch control. Selection dynamically hides or shows fields (Purchase Date/Cost for Purchased; Monthly Rent/Start Date for Rented).
- **Components**:
  - Frontend: [AssetManagement.tsx](../frontend/src/features/Assets/AssetManagement.tsx)

### User Story 17: 3-Column Widescreen Form Layout
> **As an IT Support Technician**,  
> **I want** the asset form fields to be organized in a spacious 3-column layout on desktop screens,  
> **So that** I can enter asset details quickly with minimal scrolling.
- **Business Value**: Improves user experience and speeds up bulk manual inventory logging.
- **Implementation**: Expanded the modal container class from `max-w-2xl` to `max-w-6xl` (~72% wider) and restructured the layout into responsive 3-column grid components.
- **Components**:
  - Frontend: [AssetManagement.tsx](../frontend/src/features/Assets/AssetManagement.tsx)

### User Story 18: Dynamic Field Validation & Over-Posting Guards
> **As a Security Officer**,  
> **I want** the system to reject any requests containing unauthorized or malformed data properties,  
> **So that** the database is protected against over-posting/mass-assignment attacks.
- **Business Value**: Prevents security exploits and invalid data entries.
- **Implementation**: Enforces `ValidationPipe` globally with strict whitelist properties on DTO classes.
- **Components**:
  - Backend: [main.ts](../backend/src/main.ts), `asset.dto.ts`

### User Story 19: Asset Deployment & User Checkout
> **As an IT Support Agent**,  
> **I want to** assign an available asset to an employee, department, or physical location,  
> **So that** the asset status updates to "Deployed" and the checkout details are logged.
- **Business Value**: Tracks custody, preventing asset loss and optimizing inventory.
- **Implementation**: Updates the asset status to `DEPLOYED`, sets the `assigned_to_id` FK, and logs a checkout record.
- **Components**:
  - Backend: `assets.service.ts` (`deploy` method)
  - Frontend: [AssetManagement.tsx](../frontend/src/features/Assets/AssetManagement.tsx)

### User Story 20: Asset Return & Stock De-allocation
> **As an IT Support Agent**,  
> **I want to** check in a deployed asset when an employee returns it,  
> **So that** its status changes to "Available" and the employee is cleared of responsibility.
- **Business Value**: Recovers hardware for reuse and clears staff custody flags.
- **Implementation**: Resets `assigned_to_id` to NULL and updates status to `AVAILABLE` or `MAINTENANCE`.
- **Components**:
  - Backend: `assets.service.ts` (`undeploy`)

### User Story 21: Photographic Proof of Physical Condition
> **As an IT Auditor**,  
> **I want to** upload and link physical photos of an asset during check-in or checkout,  
> **So that** we have visual evidence of its condition (e.g. damaged, worn, or like new).
- **Business Value**: Resolves disputes over physical device damage.
- **Implementation**: Mapped via `AssetPhoto` entity to upload files with size/mime details and link them directly to asset IDs.
- **Components**:
  - Backend: [asset-photo.entity.ts](../backend/src/entities/asset-photo.entity.ts), `assets.controller.ts`
  - Frontend: [AssetDetails.tsx](../frontend/src/features/Assets/AssetDetails.tsx), [AssetPhotoGallery.tsx](../frontend/src/features/Assets/AssetPhotoGallery.tsx)

### User Story 22: 6-Method Depreciation Calculator
> **As a Financial Auditor**,  
> **I want to** calculate asset depreciation over time using multiple standard accounting methods,  
> **So that** I can review the estimated current book value of our hardware.
- **Business Value**: Provides financial audits with standard calculations.
- **Implementation**: Built a client-side calculator offering **6 methods**: Straight Line, Diminishing Balance, Sum of Years Digits, Sinking Fund, Annuity, and Machine Hour. Renders calculated results and a yearly breakdown table.
- **Components**:
  - Frontend: [AssetDetails.tsx](../frontend/src/features/Assets/AssetDetails.tsx) (depreciation calculator)

### User Story 23: Asset Maintenance, Repair, and Status Fixes
> **As an Operations Manager**,  
> **I want** the system to track assets currently under maintenance or repair without miscalculating dashboard statistics,  
> **So that** I always have an accurate count of active vs. repair-queued devices.
- **Business Value**: Prevents statistics drift for items that are temporarily unavailable.
- **Implementation**: Fixed `AssetsService.getStatistics()` to combine both `MAINTENANCE` and `REPAIR` status enum counts into a single dashboard statistics query.
- **Components**:
  - Backend: `assets.service.ts`
  - Frontend: [DashboardHome.tsx](../frontend/src/features/Dashboard/DashboardHome.tsx)

### User Story 24: Asset Disposal & Retirement Logging
> **As a Disposal Officer**,  
> **I want to** log the disposal of decommissioned assets and record their disposal method, date, and salvage value,  
> **So that** we maintain records of retired equipment.
- **Business Value**: Essential for tax deductions on written-off equipment.
- **Implementation**: Updates the asset status to `DISPOSED`, records `salvageValue` and disposal logs, and blocks further checkouts.
- **Components**:
  - Backend: `assets.controller.ts` (`/dispose` routes), `AssetDisposeDto`

### User Story 25: Individual Asset Unit Registry & Tag Lookup
> **As an IT Support Engineer**,  
> **I want to** track each physical unit of an asset model individually and look any unit up instantly by its asset tag,  
> **So that** I can manage per-unit status, custody, and history even when many identical devices share one model record.
- **Business Value**: Enables serial-level traceability for fleets of identical hardware and instant identification during physical checks.
- **Implementation**: Dedicated asset-units module with CRUD endpoints plus a `GET /asset-units/tag/:assetTag` lookup, backed by the `AssetUnit` entity; dedicated list and detail pages on the frontend.
- **Components**:
  - Backend: [asset-units.controller.ts](../backend/src/modules/asset-units/asset-units.controller.ts), [asset-unit.entity.ts](../backend/src/entities/asset-unit.entity.ts)
  - Frontend: [AssetsListPage.tsx](../frontend/src/features/AssetUnits/AssetsListPage.tsx), [AssetDetailPage.tsx](../frontend/src/features/AssetUnits/AssetDetailPage.tsx)

---

## 🔑 4. Software License Compliance & Tracking

### User Story 26: License Seat Capacity Management
> **As a Software licensing Administrator**,  
> **I want to** register software license purchases, seat counts, costs, and expiration dates,  
> **So that** we can track active seats and prevent over-allocation.
- **Business Value**: Prevents compliance fines and optimizes licensing costs.
- **Implementation**: Schema holds columns for `total_seats` and `used_seats` with checks on license plans.
- **Components**:
  - Backend: [license.entity.ts](../backend/src/entities/license.entity.ts), [licenses.service.ts](../backend/src/modules/licenses/licenses.service.ts)
  - Frontend: [LicenseManagement.tsx](../frontend/src/features/Licenses/LicenseManagement.tsx)

### User Story 27: Dual-Target License Allocation (User or Device)
> **As an IT Staff member**,  
> **I want to** assign a license seat to either a specific User or a physical Asset,  
> **So that** we can track both SaaS user seats and device-bound software keys.
- **Business Value**: Supports both user-based and device-bound license models.
- **Implementation**: Mapped via `license_assignments` containing foreign keys to both `userId` and `assetId`, supporting cross-referencing.
- **Components**:
  - Backend: [license-assignment.entity.ts](../backend/src/entities/license-assignment.entity.ts)
  - Frontend: [LicenseManagement.tsx](../frontend/src/features/Licenses/LicenseManagement.tsx)

### User Story 28: License Expiration Warnings & Plans
> **As a Software Buyer**,  
> **I want to** configure license plan templates and track renewal alert dates,  
> **So that** I get warned of upcoming license expirations before the services renew or shut down.
- **Business Value**: Prevents unexpected software downtime.
- **Implementation**: Maps plans with billing frequencies, and alerts on dashboard if expiration is within warning thresholds.
- **Components**:
  - Backend: [license-plan.entity.ts](../backend/src/entities/license-plan.entity.ts), [license-renewal.entity.ts](../backend/src/entities/license-renewal.entity.ts)

### User Story 29: License Renewal Workflow with Cost Adjustment
> **As a Software Licensing Administrator**,  
> **I want to** renew an expiring license by recording the new expiry date and any change in total license cost,  
> **So that** the license's total cost and per-seat unit price are updated automatically and a renewal record is kept for financial history.
- **Business Value**: Keeps licensing spend accurate over multi-year renewals and preserves a cost trail for budget reviews.
- **Implementation**: The renew endpoint creates a `LicenseRenewal` record capturing old/new expiry dates and the cost change (a total-license delta, not per seat), applies the delta to the license's total cost, and recalculates the unit price from the new total and seat count.
- **Components**:
  - Backend: [licenses.service.ts](../backend/src/modules/licenses/licenses.service.ts) (`renewLicense`), [license-renewal.entity.ts](../backend/src/entities/license-renewal.entity.ts)
  - Frontend: [LicenseDetails.tsx](../frontend/src/features/Licenses/LicenseDetails.tsx)

### User Story 30: Expired-License Assignment Guard
> **As a Compliance Officer**,  
> **I want** the system to block assigning seats from an expired license until it is renewed,  
> **So that** employees are never issued non-compliant or inactive software entitlements.
- **Business Value**: Prevents compliance violations and support incidents from dead license keys.
- **Implementation**: The assignment flow validates the license expiry date and rejects the request with a clear error ("Cannot assign expired license. Please renew the license first.").
- **Components**:
  - Backend: [licenses.service.ts](../backend/src/modules/licenses/licenses.service.ts)

---

## 📦 5. Consumable Inventory & Stock Ledger

### User Story 31: Bulk Inventory & Catalog Definition
> **As an Inventory Manager**,  
> **I want to** catalog bulk consumable products (e.g. patch cords, adapters, batteries) by SKU and category,  
> **So that** we can track standard office supplies separately from hardware assets.
- **Business Value**: Simplifies inventory tracking for high-volume, low-cost office supplies.
- **Implementation**: Standardized catalog templates via `CatalogItem` using SKUs to track items.
- **Components**:
  - Backend: [catalog-item.entity.ts](../backend/src/entities/catalog-item.entity.ts), `catalog.module.ts`
  - Frontend: [CatalogPage.tsx](../frontend/src/features/Catalog/CatalogPage.tsx)

### User Story 32: Multi-Warehouse Stock Count Visibility
> **As a Warehouse Supervisor**,  
> **I want to** view stock balances for catalog items across different physical warehouses,  
> **So that** I can balance inventory levels and know where items are available.
- **Business Value**: Optimizes distribution and prevents shipping delays.
- **Implementation**: Tracks counts dynamically in the `stock_by_location` table.
- **Components**:
  - Backend: [stock-by-location.entity.ts](../backend/src/entities/stock-by-location.entity.ts), `stock.module.ts`
  - Frontend: [StockPage.tsx](../frontend/src/features/Stock/StockPage.tsx)

### User Story 33: Inbound Procurement Logging
> **As a Procurement Officer**,  
> **I want to** record bulk inventory purchase shipments from vendors with unit costs and date logs,  
> **So that** we can track shipping lead times and unit cost trends.
- **Business Value**: Monitors vendor performance and unit costs.
- **Implementation**: Creates logs in `inventory_purchases`, linking to vendor records and stock balances.
- **Components**:
  - Backend: [inventory-purchase.entity.ts](../backend/src/entities/inventory-purchase.entity.ts)
  - Frontend: [InventoryManagementModule.tsx](../frontend/src/features/ConsumableInventory/InventoryManagementModule.tsx)

### User Story 34: Consumables Allocation (Issuing Stock)
> **As an IT Support Agent**,  
> **I want to** issue bulk consumables (like a replacement charger) to an employee,  
> **So that** stock counts are updated automatically.
- **Business Value**: Identifies high-usage departments and tracks supply costs per user.
- **Implementation**: The backend updates the location quantity and inserts an `InventoryAssignment` transaction log.
- **Components**:
  - Backend: [inventory-assignment.entity.ts](../backend/src/entities/inventory-assignment.entity.ts)
  - Frontend: [IssueReturnPage.tsx](../frontend/src/features/IssueReturn/IssueReturnPage.tsx)

### User Story 35: Consumable Returns & Re-stocking
> **As an IT Support Agent**,  
> **I want to** return unused consumables back to stock,  
> **So that** the location count is updated and the return is logged.
- **Business Value**: Recovers unused inventory and maintains accurate stock levels.
- **Implementation**: Increments stock balances and logs a return record.
- **Components**:
  - Backend: [inventory-return.entity.ts](../backend/src/entities/inventory-return.entity.ts)

### User Story 36: Immutable Inventory Ledger Auditing
> **As a Finance Officer**,  
> **I want** every inventory movement to write to an append-only ledger log,  
> **So that** we have a transparent audit trail of all stock movements.
- **Business Value**: Essential for preventing inventory shrinkage and locating missing stock.
- **Implementation**: Every transaction automatically generates an append-only entry in `stock_ledger` detailing the quantity change, new running balance, and user details.
- **Components**:
  - Backend: [stock-ledger.entity.ts](../backend/src/entities/stock-ledger.entity.ts)
  - Frontend: [InventoryLedger.tsx](../frontend/src/features/ConsumableInventory/InventoryLedger.tsx)

### User Story 37: Physical Inventory Audits & Reconciliation
> **As an Auditor**,  
> **I want to** compare actual physical stock counts against the system numbers and log adjustments,  
> **So that** database counts are corrected and discrepancies are recorded.
- **Business Value**: Keeps system data in sync with physical warehouse counts.
- **Implementation**: Reconciles counts and creates `InventoryAudit` and `InventoryAuditDetail` logs.
- **Components**:
  - Backend: [inventory-audit.entity.ts](../backend/src/entities/inventory-audit.entity.ts)
  - Frontend: [AuditPage.tsx](../frontend/src/features/Audit/AuditPage.tsx)

---

## 📊 6. Audit, Operations, & Reporting

### User Story 38: Live Dashboard activity feed
> **As an Operations Director**,  
> **I want to** view a live activity feed of recent database changes on the dashboard,  
> **So that** I can see system changes in real-time.
- **Business Value**: Helps detect unauthorized changes or errors immediately.
- **Implementation**: Frontend calls `GET /api/audit-logs/recent` to query the database log table.
- **Components**:
  - Backend: `audit-logs.controller.ts`
  - Frontend: [DashboardHome.tsx](../frontend/src/features/Dashboard/DashboardHome.tsx)

### User Story 39: Security Event Audit Log
> **As a Security Admin**,  
> **I want** failed logins, password updates, and role modifications to be logged in a security log table,  
> **So that** we have a secure audit trail for compliance purposes.
- **Business Value**: Essential for security audits and detecting brute-force attacks.
- **Implementation**: Operations write to `audit_events` and `audit_logs` tables containing IP addresses, user agents, and status details.
- **Components**:
  - Backend: [audit-event.entity.ts](../backend/src/entities/audit-event.entity.ts), [audit-log.entity.ts](../backend/src/entities/audit-log.entity.ts)

### User Story 40: Employee Asset Holdings Lookup
> **As an HR Specialist**,  
> **I want to** view all hardware, licenses, and consumables currently assigned to a specific employee,  
> **So that** I can verify returned items before offboarding the employee.
- **Business Value**: Prevents equipment loss during employee offboarding.
- **Implementation**: Frontend filters assignments by user ID.
- **Components**:
  - Frontend: [HoldingsPage.tsx](../frontend/src/features/Holdings/HoldingsPage.tsx)

### User Story 41: Reporting Module & Excel Data Export
> **As a Department Lead**,  
> **I want to** generate asset and inventory reports and export the data to Excel or CSV,  
> **So that** I can share licensing compliance and inventory reports with management.
- **Business Value**: Simplifies resource reporting for executive reviews.
- **Implementation**: The NestJS reports module generates CSV/Excel exports directly from database query rows.
- **Components**:
  - Backend: `reports.module.ts`
  - Frontend: [ReportsPage.tsx](../frontend/src/features/Reports/ReportsPage.tsx)

### User Story 42: Consolidated Audit Report Generation
> **As a Compliance Auditor**,  
> **I want to** generate a consolidated audit report covering system activity over a chosen period,  
> **So that** I can hand a single compliance document to external auditors without manually stitching logs together.
- **Business Value**: Cuts audit preparation time and standardizes compliance evidence.
- **Implementation**: A dedicated audit-report module aggregates audit data server-side and serves it to a dedicated reporting page.
- **Components**:
  - Backend: [audit-report.service.ts](../backend/src/modules/audit-report/audit-report.service.ts)
  - Frontend: [AuditReportPage.tsx](../frontend/src/features/Audit/AuditReportPage.tsx)

### User Story 43: Asset & License Lifecycle History Timelines
> **As an IT Compliance Officer**,  
> **I want** each asset and license to keep a domain-level history of lifecycle events (deployments, returns, renewals, status changes),  
> **So that** I can review a clean business-event timeline separate from the raw technical audit log.
- **Business Value**: Gives reviewers a readable event trail without wading through low-level change diffs.
- **Implementation**: Lifecycle operations write dedicated records to the `AssetHistory` and `LicenseHistory` entities alongside the generic audit log; issue/return flows are similarly backed by `ReturnTransaction` and `InventoryTransaction` records.
- **Components**:
  - Backend: [asset-history.entity.ts](../backend/src/entities/asset-history.entity.ts), [license-history.entity.ts](../backend/src/entities/license-history.entity.ts), [return-transaction.entity.ts](../backend/src/entities/return-transaction.entity.ts)

---

## ⚙️ 7. System Integrations & UI Optimizations

### User Story 44: Azure AD Synchronization
> **As an IT Admin**,  
> **I want to** sync employee accounts with Azure Active Directory periodically,  
> **So that** user profiles and role settings stay in sync with the corporate directory.
- **Business Value**: Reduces identity administration overhead and improves security.
- **Implementation**: Graph API calls map AD GUID profiles directly to `azure_id` columns in the database.
- **Components**:
  - Backend: [user.entity.ts](../backend/src/entities/user.entity.ts) (Azure ID property)

### User Story 45: Mobile Field Access (Responsive UI)
> **As an IT Engineer**,  
> **I want to** access the asset registry and update counts on my mobile device,  
> **So that** I can update inventory records directly from the server room.
- **Business Value**: Improves data entry accuracy by allowing updates on the spot.
- **Implementation**: Fully responsive CSS layouts with touch targets (min 44x44px) and collapsible mobile drawer navigation.
- **Components**:
  - Frontend: [AppShell.tsx](../frontend/src/components/layout/AppShell.tsx), [DashboardHome.tsx](../frontend/src/features/Dashboard/DashboardHome.tsx)

### User Story 46: Configurable Dashboard Widgets
> **As an Operations Manager**,  
> **I want to** customize which widgets appear on my dashboard and how they are arranged,  
> **So that** my landing page surfaces the KPIs most relevant to my role.
- **Business Value**: Personalizes visibility so each role sees its critical metrics first.
- **Implementation**: A dashboard-widgets module persists per-user widget configuration and serves it to the dashboard on load.
- **Components**:
  - Backend: [dashboard-widgets.service.ts](../backend/src/modules/dashboard-widgets/dashboard-widgets.service.ts)
  - Frontend: [DashboardHome.tsx](../frontend/src/features/Dashboard/DashboardHome.tsx)

### User Story 52: QPeople HRMS User Synchronization
> **As an IT Administrator**,  
> **I want to** sync employee records (name, email, department, designation, reporting manager) from the QPeople HRMS on demand,  
> **So that** the asset directory always reflects the current organization without manual data entry.
- **Business Value**: Eliminates duplicate HR data entry and keeps asset assignment records aligned with the org structure.
- **Implementation**: `POST /users/sync/qpeople` calls the QPeople (Frappe HRMS) `get_all_users_details` API and upserts users matched by `qpeople_id` or email. Departments arriving as free text are matched case-insensitively against the departments master and auto-created when missing. New accounts get the default Employee role, an unusable `SSO:`-prefixed password (`is_sso_user = true`) pending the future SSO login module, and `source = QPEOPLE`. Every user carries a `source` column (`MANUAL` / `AZURE_AD` / `QPEOPLE`) so admins can see where each account was provisioned from, surfaced as a badge in User Management.
- **Components**:
  - Backend: [qpeople-sync.service.ts](../backend/src/modules/users/qpeople-sync.service.ts), [qpeople-sync.controller.ts](../backend/src/modules/users/qpeople-sync.controller.ts), [user.entity.ts](../backend/src/entities/user.entity.ts)
  - Frontend: [UserManagement.tsx](../frontend/src/features/UserManagement/UserManagement.tsx)
- **Planned**: SSO login module so directory/HRMS-provisioned accounts (`is_sso_user`) can authenticate without a local password.

### User Story 53: Admin-Configurable Integration Credentials
> **As an IT Administrator**,  
> **I want to** configure Azure AD and QPeople API credentials from the admin Settings UI and test the connection before syncing,  
> **So that** integrations can be enabled or rotated at runtime without server access or restarts.
- **Business Value**: Removes the ops bottleneck of editing `.env` files and restarting the backend to onboard or rotate integration credentials.
- **Implementation**: An `integration_settings` table stores credential values encrypted with AES-256-GCM (key from `SETTINGS_ENCRYPTION_KEY`, falling back to `JWT_SECRET`). The API returns secrets only as masked previews. Environment variables remain a supported fallback. Sync services build their API clients per run so saved credentials take effect immediately; `POST /users/sync/{azure|qpeople}/test` validates connectivity.
- **Components**:
  - Backend: [integration-settings.service.ts](../backend/src/modules/settings/integration-settings.service.ts), [integration-settings.controller.ts](../backend/src/modules/settings/integration-settings.controller.ts), [integration-setting.entity.ts](../backend/src/entities/integration-setting.entity.ts)
  - Frontend: [IntegrationSettings.tsx](../frontend/src/features/Admin/IntegrationSettings.tsx), [SystemSettings.tsx](../frontend/src/features/Admin/SystemSettings.tsx)

---

## ⚙️ 8. Advanced System Monitoring & Data Integrity

### User Story 47: Overdue Asset Return Notifications & Dashboard Alerts
> **As an IT Operations Coordinator**,  
> **I want to** view a list of all checked-out items that have passed their return due date, with a clear count of days overdue,  
> **So that** I can follow up with employees and recover hardware in a timely manner.
- **Business Value**: Minimizes shrinkage and ensures devices are returned on schedule.
- **Implementation**: Uses query filters checking current timestamp vs. the assigned `dueDate` on non-returned assignments.
- **Components**:
  - Frontend: [OverduePage.tsx](../frontend/src/features/Overdue/OverduePage.tsx)
  - Backend: `assignments.service.ts`

### User Story 48: Specific Asset History & Row-Level Audit Log
> **As an IT Compliance Officer**,  
> **I want to** view a chronological audit log of all changes made to a specific asset (who modified it, what was changed, and when),  
> **So that** I can trace the lineage of updates and audit compliance anomalies.
- **Business Value**: Simplifies root-cause analysis and compliance audits.
- **Implementation**: Queries the `audit_logs` table filtering by asset identifier entity values to present chronological diff steps.
- **Components**:
  - Frontend: [AssetAuditLog.tsx](../frontend/src/features/Assets/AssetAuditLog.tsx)
  - Backend: `audit-logs.service.ts`

### User Story 49: Dashboard Analytics & Interactive Charts
> **As a Chief Information Officer (CIO)**,  
> **I want to** view interactive charts showing asset allocations by location, total license expenditures, and hardware category distribution,  
> **So that** I can make data-driven decisions on IT procurement and budget allocation.
- **Business Value**: Provides executive visibility and expense optimization.
- **Implementation**: Integrates ApexCharts in React to query backend aggregation data.
- **Components**:
  - Frontend: [AnalyticsDashboard.tsx](../frontend/src/features/Analytics/AnalyticsDashboard.tsx)
  - Backend: `analytics.service.ts`

### User Story 50: Transactional Integrity for Asset Procurement / Goods Receipt
> **As a Finance Manager**,  
> **I want** multi-device procurement records and catalog allocations to be executed within a single database transaction,  
> **So that** database state remains completely consistent if any item registration fails.
- **Business Value**: Guarantees zero data pollution or partial registrations.
- **Implementation**: Employs TypeORM database transaction blocks wrapping individual inserts.
- **Components**:
  - Backend: `procurement.service.ts`

### User Story 51: Asset and Inventory Category Master Management
> **As a Configuration Manager**,  
> **I want to** create and manage asset categories and inventory item types (e.g., Laptops, Keyboards, Network Cables) with custom checkout rules,  
> **So that** we can dynamically group hardware and consumables throughout the system.
- **Business Value**: Restructures asset organization dynamically as the catalog grows.
- **Implementation**: Supports standard CRUD endpoints for categories.
- **Components**:
  - Frontend: [CategoryMaster.tsx](../frontend/src/features/Admin/CategoryMaster.tsx), [CategoryManagement.tsx](../frontend/src/features/ConsumableInventory/CategoryManagement.tsx)

### User Story 52: Multi-Currency Display with Global Currency Switcher
> **As a System User**,  
> **I want to** pick my preferred display currency from a dropdown in the top navigation bar and see all monetary values (purchase cost, book value, salvage value, rents, license costs, and dashboard totals) converted on the fly,  
> **So that** I can read financials in my local currency while all data remains stored and calculated in the base currency (INR).
- **Business Value**: Globally distributed teams read asset financials natively without any data-migration risk — storage, filtering, and sorting stay on base-currency values; only presentation converts.
- **Implementation**: An admin-managed `currency_rates` table (code, name, symbol, `rate_to_base` = "1 unit = X INR", `is_active`, `updated_at`) is exposed via `GET /api/currencies` (active only, JWT) and admin add/update endpoints guarded by `settings.manage`. The frontend `CurrencyContext` fetches active currencies on app load, persists the per-user selection in `localStorage` (falling back to the org `DEFAULT_CURRENCY` setting and clearing stale/inactive preferences), and provides `convert()`, locale-aware `format()` (₹12,34,567.00 Indian grouping vs $12,345.00), and `formatCompact()` (₹1.5Cr/₹25L for INR; $1.5M/$250K otherwise). Dashboard and analytics aggregates are converted server-side per request via a `displayCurrency` query param.
- **Components**:
  - Backend: [currency-rate.entity.ts](../backend/src/entities/currency-rate.entity.ts), `currencies.controller.ts`, `currencies.service.ts`, `analytics.service.ts` (`sumInDisplayCurrency`)
  - Frontend: [CurrencyContext.tsx](../frontend/src/context/CurrencyContext.tsx), [currencyService.ts](../frontend/src/services/currencyService.ts), [AppShell.tsx](../frontend/src/components/layout/AppShell.tsx) (navbar switcher), [SystemSettings.tsx](../frontend/src/features/Admin/SystemSettings.tsx)

### User Story 54: Application-Wide Mandatory Field Validation
> **Status: 🚧 Partially implemented.** Foundation, schema, pilot form and the DTO backfill are shipped; the backfilled rules are in **observation mode** (recording, not rejecting) pending review, and the remaining forms are not yet migrated. Design and rollout state: [mandatory-field-validation-design.md](./mandatory-field-validation-design.md)

> **As a System User**,
> **I want** every mandatory field to be clearly marked and validated before I submit any create or edit form,
> **So that** I am told exactly which field is missing in plain language instead of losing my work to a generic "Failed to save" toast.
>
> **And as a Compliance Officer**,
> **I want** the same mandatory rules enforced by the API independently of the UI,
> **So that** invalid records cannot be persisted by any caller.
- **Business Value**: Removes the app's most common data-entry dead end, and closes a real integrity gap — required-ness currently lives almost entirely in the frontend, so the API accepts records the UI would reject.
- **Implementation (planned)**: DTO decorators become the single source of truth. A `ValidationSchemaService` reflects class-validator metadata into a `GET /schema/:formKey` contract the frontend consumes, so client and server rules cannot drift. A new `@RequiredWhen` decorator makes conditional rules serializable to both sides. A `ValidationExceptionFilter` reshapes Nest's `message: string[]` into per-field errors that `apiClient` maps back onto fields. The unused `react-hook-form` dependency is activated behind a `useValidatedForm` hook; the existing shared [FormField.tsx](../frontend/src/components/shared/FormField.tsx) (which already renders the required asterisk and `aria-required`) is extended with a per-field-type emptiness matrix. Rollout is additive and phased so un-migrated forms keep working.
- **Known defects this addresses**:
  - [useForm.ts](../frontend/src/hooks/useForm.ts) runs `custom` rules only when a value is truthy, so conditional-required rules never fire on empty values — the `userId`/`PERSON` check in [AssetManagement.tsx](../frontend/src/features/Assets/AssetManagement.tsx) is dead code.
  - That same rule mirrors only the `PERSON` branch of the backend rule in [inventory-mgmt.dto.ts](../backend/src/modules/consumable-inventory/dto/inventory-mgmt.dto.ts), not `LOCATION` — the two sides disagree today.
  - Validation 400s render as a comma-joined blob in toasts because every call site passes Nest's `message` array straight to `showToast`.
- **Relationship to Story 18**: Story 18 covers over-posting guards (`whitelist`) — rejecting properties that *shouldn't* be there. This story covers the inverse: requiring properties that *must* be there.
- **Rollout state**: Backfilled rules ship marked `@Observe` — recorded, not rejected — because external/automated API consumers are unknown rather than confirmed absent. Observation is **per-property**: a global "enforce nothing" switch would also disable rules that already work, so the release meant to be safe would be the one admitting bad data. Review `GET /validation/observations` (`settings.manage`) after ≥1 production release, then set `VALIDATION_ENFORCE_OBSERVED=true` and finally delete the decorators.
- **Components**:
  - Backend: [validation-schema.service.ts](../backend/src/common/validation/validation-schema.service.ts), [validation-exception.filter.ts](../backend/src/common/validation/validation-exception.filter.ts), [validation-pipe.factory.ts](../backend/src/common/validation/validation-pipe.factory.ts), [required-when.decorator.ts](../backend/src/common/validation/required-when.decorator.ts), [observe.decorator.ts](../backend/src/common/validation/observe.decorator.ts), [validation-observation.service.ts](../backend/src/common/validation/validation-observation.service.ts), [validation-observation.entity.ts](../backend/src/entities/validation-observation.entity.ts)
  - Frontend: [useValidatedForm.ts](../frontend/src/hooks/useValidatedForm.ts), [schemaService.ts](../frontend/src/services/schemaService.ts), [isEmpty.ts](../frontend/src/lib/validation/isEmpty.ts), [FormField.tsx](../frontend/src/components/shared/FormField.tsx), [apiClient.ts](../frontend/src/services/apiClient.ts)
- **Out of scope**: Copy/duplicate validation (no such feature exists yet); real localization — messages are *localizable* via a keyed catalog, but i18next, locale files and translation are a separate story.

### User Story 55: Configurable Email Notifications for Assets, Licenses & Inventory
> **Status: 📋 Planned.** Not yet implemented — see the implementation plan for the current design.

> **As an Asset/License Holder**,
> **I want** to be emailed when my hardware's warranty or my software license is approaching expiry, or when an item is assigned to or unassigned from me, or an asset's status changes,
> **So that** I can act before something lapses or lose custody responsibility without knowing it.
>
> **And as an IT Administrator**,
> **I want to** configure, per notification type, exactly who receives each email (the assigned user, a department admin, a specific person, or a static distribution address) instead of a hardcoded recipient rule,
> **So that** notification routing matches our team's actual escalation structure and can be changed without a code deployment.
- **Business Value**: Turns dashboard-only expiry data into proactive outreach, catching lapses (expired warranties, expired licenses, stockouts) before they cause downtime or compliance gaps, while letting admins tune who gets paged as org structure changes.
- **Implementation (planned)**: Extends the existing `MailService` (currently only `sendPasswordResetOtp`) with new templated HTML methods, orchestrated by a new `NotificationsService`/`NotificationsModule`. Three trigger categories: (1) a daily `@nestjs/schedule` cron job scans asset `warrantyExpiry` and license `expiryDate` for 30/15/7-day-out thresholds, deduped via a `NotificationLog` table so each threshold crossing emails once; (2) event-driven low-stock alerts fire the moment a stock-adjusting transaction in the inventory module drops an item's quantity below `minStockLevel`/`reorderPoint`; (3) event-driven assignment/unassignment/status-change emails fire from the existing assign/return/status-update methods in assets, licenses, and assignments services. Recipient routing is admin-configurable via a new `NotificationRecipientConfig` table (`notificationType` × `recipientType`: assigned user / department admin / static email / specific user id) managed through a small admin CRUD endpoint, defaulting to "assigned user" so behavior works out of the box before any admin configuration.
- **Components**:
  - Backend (planned): `mail.service.ts` (new `send*` methods), `notifications/notifications.service.ts`, `notifications/notifications.module.ts`, `notifications/notification-recipients.controller.ts`, `notification-log.entity.ts`, `notification-recipient-config.entity.ts`; hooks in `assignments.service.ts`, `assets.service.ts`, `licenses.service.ts`, `inventory-mgmt.service.ts`
- **Out of scope (for now)**: Admin-configurable cron schedule (starts as a fixed daily time); in-app/SMS notification channels — email only.
