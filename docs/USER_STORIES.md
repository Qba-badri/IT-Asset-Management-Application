# 📋 Implemented User Stories - IT Asset Management System (ITAM)

This document is a comprehensive compilation of all user stories implemented across the frontend and backend of the enterprise-grade IT Asset Management (ITAM) system. It maps business requirements to exact technical components and database schemas.

---

## 📂 Domain Index
1. [User Identity, Authentication, & RBAC (Stories 1-6)](#-1-user-identity-authentication--rbac)
2. [Organizational Master Data (Stories 7-12)](#-2-organizational-master-data)
3. [Hardware Asset Lifecycle Management (Stories 13-22)](#-3-hardware-asset-lifecycle-management)
4. [Software License Compliance & Tracking (Stories 23-25)](#-4-software-license-compliance--tracking)
5. [Consumable Inventory & Stock Ledger (Stories 26-32)](#-5-consumable-inventory--stock-ledger)
6. [Audit, Operations, & Reporting (Stories 33-36)](#-6-audit-operations--reporting)
7. [System Integrations & UI Optimizations (Stories 37-38)](#-7-system-integrations--ui-optimizations)
8. [Advanced System Monitoring & Data Integrity (Stories 39-43)](#-8-advanced-system-monitoring--data-integrity)

---

## 🔐 1. User Identity, Authentication, & RBAC

### User Story 1: Secure Login & Session Authorization
> **As a System User**,  
> **I want to** authenticate securely with my email and password and receive an access token,  
> **So that** I can access the authorized sections of the ITAM application.
- **Business Value**: Protects company asset data from unauthorized external access.
- **Implementation**: Uses JWT (JSON Web Tokens) with passport-jwt strategies on the backend, storing signed payloads. The frontend manages local storage sessions and adds Authorization headers to Axios calls.
- **Components**: 
  - Backend: [auth.service.ts](file:///d:/Opensource%20Project/IT%20Assect%20Management/backend/src/auth/auth.service.ts), `auth.controller.ts`
  - Frontend: `Login.tsx`

### User Story 2: Self-Service Password Reset & OTP Flow
> **As a Registered User**,  
> **I want to** request a password reset OTP code sent to my email when I forget my password,  
> **So that** I can securely update my password without needing IT support intervention.
- **Business Value**: Reduces support ticket overhead for password lockouts.
- **Implementation**: Generates temporary OTP codes saved to the `password_reset_tokens` table with custom expirations. If verified, the backend hashes the new password with bcrypt.
- **Components**:
  - Backend: `password-reset-token.entity.ts`, `auth.service.ts`
  - Frontend: [ForgotPassword.tsx](file:///d:/Opensource%20Project/IT%20Assect%20Management/frontend/src/components/ForgotPassword/ForgotPassword.tsx)

### User Story 3: User Profile Self-Service
> **As an Employee**,  
> **I want to** view my profile details and update my contact details (like phone number or room location),  
> **So that** my contact details are kept up-to-date in the company asset directory.
- **Business Value**: Keeps contact logs clean for asset retrieval.
- **Implementation**: Exposes a `PUT /users/me` endpoint restricted to self-profile modifications using a whitelisted `UpdateProfileDto` to prevent self-role escalation.
- **Components**:
  - Backend: [users.controller.ts](file:///d:/Opensource%20Project/IT%20Assect%20Management/backend/src/users/users.controller.ts) (`/me` routes)
  - Frontend: `UserProfile.tsx`

### User Story 4: Administrator User Provisioning
> **As an IT Administrator**,  
> **I want to** create, update, deactivate, and delete user accounts,  
> **So that** I can manage employee access rights as people onboard, offboard, or change roles.
- **Business Value**: Centralizes lifecycle control for employee access.
- **Implementation**: Admin users with `users.edit` and `users.delete` permissions make calls to `PUT /users/:id` and `DELETE /users/:id`.
- **Components**:
  - Backend: [users.controller.ts](file:///d:/Opensource%20Project/IT%20Assect%20Management/backend/src/users/users.controller.ts)
  - Frontend: `UserManagement.tsx`

### User Story 5: Role Configuration & Permission Mapping
> **As an IT Administrator**,  
> **I want to** define roles (e.g. Admin, Manager, IT Staff) and associate specific permission slugs to each role,  
> **So that** I can enforce granular feature access controls dynamically.
- **Business Value**: Supports custom roles for different team access requirements.
- **Implementation**: Utilizes `roles`, `permissions`, and the `role_permissions` junction table. Backend controllers use custom `@Permissions()` guards to restrict route access.
- **Components**:
  - Backend: `rbac.service.ts`, `permissions.guard.ts`
  - Frontend: [RoleMaster.tsx](file:///d:/Opensource%20Project/IT%20Assect%20Management/frontend/src/components/Admin/RoleMaster.tsx), [PermissionMaster.tsx](file:///d:/Opensource%20Project/IT%20Assect%20Management/frontend/src/components/Admin/PermissionMaster.tsx)

### User Story 6: Enforced Permission Safeguards
> **As a System Administrator**,  
> **I want the API** to reject any unauthorized requests and the UI to hide buttons for actions that users don't have permissions for,  
> **So that** users are prevented from executing unauthorized commands.
- **Business Value**: Implements defense-in-depth and reduces UI clutter.
- **Implementation**: Frontend helper functions check the user permission arrays to hide elements (e.g., delete buttons). The backend uses guards to return a `403 Forbidden` error.
- **Components**:
  - Backend: `permissions.guard.ts`
  - Frontend: `LicenseManagement.tsx`, `AssetManagement.tsx`

---

## 🏢 2. Organizational Master Data

### User Story 7: Department & Cost Center Setup
> **As an IT Administrator**,  
> **I want to** create and manage department cost centers,  
> **So that** we can assign hardware/software expenses to specific business units.
- **Business Value**: Simplifies budgeting and cross-department cost reallocation.
- **Implementation**: Maps department names and cost center codes through the `Department` entity, supporting CRUD endpoints.
- **Components**:
  - Backend: `departments.module.ts`, `department.entity.ts`
  - Frontend: `AppShell.tsx` (sidebar references)

### User Story 8: Physical Location Configurations
> **As a Logistics Manager**,  
> **I want to** define company buildings, floors, and server rooms,  
> **So that** we can track where physical assets and inventory items are stored.
- **Business Value**: Speeds up physical asset tracking and deployment auditing.
- **Implementation**: Connects assets to location records via `Location` entity foreign keys.
- **Components**:
  - Backend: `locations.module.ts`, `location.entity.ts`

### User Story 9: Brand and Manufacturer Registration
> **As an IT Buyer**,  
> **I want to** maintain a list of hardware manufacturers and brand names,  
> **So that** asset details use clean, standardized manufacturer labels instead of free-text.
- **Business Value**: Prevents duplicate brand labels (e.g., "Apple" vs. "Apple Inc.").
- **Implementation**: Eagerly loaded lookup table mapped to hardware records.
- **Components**:
  - Backend: `brand.entity.ts`, `master.module.ts`
  - Frontend: [BrandMaster.tsx](file:///d:/Opensource%20Project/IT%20Assect%20Management/frontend/src/components/Admin/MasterPages.tsx)

### User Story 10: Vendor / Partner Directory
> **As a Procurement Officer**,  
> **I want to** register vendor contact details and leasing companies in a supplier database,  
> **So that** I can easily access supplier info for maintenance requests and warranty support.
- **Business Value**: Centralizes supplier contact details for faster hardware support resolution.
- **Implementation**: Standard CRUD endpoints for the `Vendor` entity.
- **Components**:
  - Backend: `vendor.entity.ts`
  - Frontend: [VendorMaster.tsx](file:///d:/Opensource%20Project/IT%20Assect%20Management/frontend/src/components/Admin/MasterPages.tsx)

### User Story 11: System Lookup Configurations
> **As an Operations Specialist**,  
> **I want to** manage status options, disposal methods, and condition types,  
> **So that** lookup options match company guidelines without requiring code changes.
- **Business Value**: Makes dropdown options configurable.
- **Implementation**: A generic `Lookup` table storing key-value pairs for asset condition/disposal states.
- **Components**:
  - Backend: `lookup.entity.ts`
  - Frontend: [MasterPages.tsx](file:///d:/Opensource%20Project/IT%20Assect%20Management/frontend/src/components/Admin/MasterPages.tsx)

### User Story 12: Currency Localization Preferences
> **As a Global IT Manager**,  
> **I want to** configure the default currency symbol (e.g. ₹ or $) in user preferences,  
> **So that** all costs, rents, and depreciation values are formatted in the local currency.
- **Business Value**: Improves reporting clarity across international offices.
- **Implementation**: React context intercepts all currency display strings, translating them dynamically based on user context settings.
- **Components**:
  - Frontend: `CurrencyContext.tsx`, `UserSettings.tsx`

---

## 🖥️ 3. Hardware Asset Lifecycle Management

### User Story 13: New Asset Cataloging & Tag Mapping
> **As an IT Support Engineer**,  
> **I want to** register new physical assets with unique barcode tags, serial numbers, and model specifications,  
> **So that** every device has a unique digital profile in the tracking database.
- **Business Value**: Prevents duplicate entries and secures device traceability.
- **Implementation**: Inserts into the `assets` table with unique constraint checks on `asset_tag` and validation decorators on inputs.
- **Components**:
  - Backend: [asset.entity.ts](file:///d:/Opensource%20Project/IT%20Assect%20Management/backend/src/entities/asset.entity.ts), `CreateAssetDto`
  - Frontend: [AssetManagement.tsx](file:///d:/Opensource%20Project/IT%20Assect%20Management/frontend/src/components/Assets/AssetManagement.tsx)

### User Story 14: Acquisition Type (CAPEX vs OPEX) Toggle
> **As an IT Manager / Finance Officer**,  
> **I want to** specify whether an asset is **Purchased** or **Rented** using a toggle control,  
> **So that** I only fill out relevant financial fields (purchase cost vs monthly rent) based on my selection.
- **Business Value**: Streamlines the creation form and ensures financial data integrity.
- **Implementation**: Replaced standard button arrays with a custom toggle switch control. Selection dynamically hides or shows fields (Purchase Date/Cost for Purchased; Monthly Rent/Start Date for Rented).
- **Components**:
  - Frontend: [AssetManagement.tsx](file:///d:/Opensource%20Project/IT%20Assect%20Management/frontend/src/components/Assets/AssetManagement.tsx)

### User Story 15: 3-Column Widescreen Form Layout
> **As an IT Support Technician**,  
> **I want** the asset form fields to be organized in a spacious 3-column layout on desktop screens,  
> **So that** I can enter asset details quickly with minimal scrolling.
- **Business Value**: Improves user experience and speeds up bulk manual inventory logging.
- **Implementation**: Expanded the modal container class from `max-w-2xl` to `max-w-6xl` (~72% wider) and restructured the layout into responsive 3-column grid components.
- **Components**:
  - Frontend: [AssetManagement.tsx](file:///d:/Opensource%20Project/IT%20Assect%20Management/frontend/src/components/Assets/AssetManagement.tsx)

### User Story 16: Dynamic Field Validation & Over-Posting Guards
> **As a Security Officer**,  
> **I want** the system to reject any requests containing unauthorized or malformed data properties,  
> **So that** the database is protected against over-posting/mass-assignment attacks.
- **Business Value**: Prevents security exploits and invalid data entries.
- **Implementation**: Enforces `ValidationPipe` globally with strict whitelist properties on DTO classes.
- **Components**:
  - Backend: [main.ts](file:///d:/Opensource%20Project/IT%20Assect%20Management/backend/src/main.ts), `asset.dto.ts`

### User Story 17: Asset Deployment & User Checkout
> **As an IT Support Agent**,  
> **I want to** assign an available asset to an employee, department, or physical location,  
> **So that** the asset status updates to "Deployed" and the checkout details are logged.
- **Business Value**: Tracks custody, preventing asset loss and optimizing inventory.
- **Implementation**: Updates the asset status to `DEPLOYED`, sets the `assigned_to_id` FK, and logs a checkout record.
- **Components**:
  - Backend: `assets.service.ts` (`deploy` method)
  - Frontend: [AssetManagement.tsx](file:///d:/Opensource%20Project/IT%20Assect%20Management/frontend/src/components/Assets/AssetManagement.tsx)

### User Story 18: Asset Return & Stock De-allocation
> **As an IT Support Agent**,  
> **I want to** check in a deployed asset when an employee returns it,  
> **So that** its status changes to "Available" and the employee is cleared of responsibility.
- **Business Value**: Recovers hardware for reuse and clears staff custody flags.
- **Implementation**: Resets `assigned_to_id` to NULL and updates status to `AVAILABLE` or `MAINTENANCE`.
- **Components**:
  - Backend: `assets.service.ts` (`undeploy`)

### User Story 19: Photographic Proof of Physical Condition
> **As an IT Auditor**,  
> **I want to** upload and link physical photos of an asset during check-in or checkout,  
> **So that** we have visual evidence of its condition (e.g. damaged, worn, or like new).
- **Business Value**: Resolves disputes over physical device damage.
- **Implementation**: Mapped via `AssetPhoto` entity to upload files with size/mime details and link them directly to asset IDs.
- **Components**:
  - Backend: `asset-photo.entity.ts`, `assets.controller.ts`
  - Frontend: [AssetDetails.tsx](file:///d:/Opensource%20Project/IT%20Assect%20Management/frontend/src/components/Assets/AssetDetails.tsx)

### User Story 20: 6-Method Depreciation Calculator
> **As a Financial Auditor**,  
> **I want to** calculate asset depreciation over time using multiple standard accounting methods,  
> **So that** I can review the estimated current book value of our hardware.
- **Business Value**: Provides financial audits with standard calculations.
- **Implementation**: Built a client-side calculator offering **6 methods**: Straight Line, Diminishing Balance, Sum of Years Digits, Sinking Fund, Annuity, and Machine Hour. Renders calculated results and a yearly breakdown table.
- **Components**:
  - Frontend: [DepreciationCalculatorModal.tsx](file:///d:/Opensource%20Project/IT%20Assect%20Management/frontend/src/components/Common/DepreciationCalculatorModal.tsx)

### User Story 21: Asset Maintenance, Repair, and Status Fixes
> **As an Operations Manager**,  
> **I want** the system to track assets currently under maintenance or repair without miscalculating dashboard statistics,  
> **So that** I always have an accurate count of active vs. repair-queued devices.
- **Business Value**: Prevents statistics drift for items that are temporarily unavailable.
- **Implementation**: Fixed `AssetsService.getStatistics()` to combine both `MAINTENANCE` and `REPAIR` status enum counts into a single dashboard statistics query.
- **Components**:
  - Backend: `assets.service.ts`
  - Frontend: `DashboardHome.tsx`

### User Story 22: Asset Disposal & Retirement Logging
> **As a Disposal Officer**,  
> **I want to** log the disposal of decommissioned assets and record their disposal method, date, and salvage value,  
> **So that** we maintain records of retired equipment.
- **Business Value**: Essential for tax deductions on written-off equipment.
- **Implementation**: Updates the asset status to `DISPOSED`, records `salvageValue` and disposal logs, and blocks further checkouts.
- **Components**:
  - Backend: `assets.controller.ts` (`/dispose` routes), `AssetDisposeDto`

---

## 🔑 4. Software License Compliance & Tracking

### User Story 23: License Seat Capacity Management
> **As a Software licensing Administrator**,  
> **I want to** register software license purchases, seat counts, costs, and expiration dates,  
> **So that** we can track active seats and prevent over-allocation.
- **Business Value**: Prevents compliance fines and optimizes licensing costs.
- **Implementation**: Schema holds columns for `total_seats` and `used_seats` with checks on license plans.
- **Components**:
  - Backend: `license.entity.ts`, `licenses.service.ts`
  - Frontend: [LicenseManagement.tsx](file:///d:/Opensource%20Project/IT%20Assect%20Management/frontend/src/components/Licenses/LicenseManagement.tsx)

### User Story 24: Dual-Target License Allocation (User or Device)
> **As an IT Staff member**,  
> **I want to** assign a license seat to either a specific User or a physical Asset,  
> **So that** we can track both SaaS user seats and device-bound software keys.
- **Business Value**: Supports both user-based and device-bound license models.
- **Implementation**: Mapped via `license_assignments` containing foreign keys to both `userId` and `assetId`, supporting cross-referencing.
- **Components**:
  - Backend: `license-assignment.entity.ts`
  - Frontend: `LicenseManagement.tsx`

### User Story 25: License Expiration Warnings & Plans
> **As a Software Buyer**,  
> **I want to** configure license plan templates and track renewal alert dates,  
> **So that** I get warned of upcoming license expirations before the services renew or shut down.
- **Business Value**: Prevents unexpected software downtime.
- **Implementation**: Maps plans with billing frequencies, and alerts on dashboard if expiration is within warning thresholds.
- **Components**:
  - Backend: `license-plan.entity.ts`, `license-renewal.entity.ts`

---

## 📦 5. Consumable Inventory & Stock Ledger

### User Story 26: Bulk Inventory & Catalog Definition
> **As an Inventory Manager**,  
> **I want to** catalog bulk consumable products (e.g. patch cords, adapters, batteries) by SKU and category,  
> **So that** we can track standard office supplies separately from hardware assets.
- **Business Value**: Simplifies inventory tracking for high-volume, low-cost office supplies.
- **Implementation**: Standardized catalog templates via `CatalogItem` using SKUs to track items.
- **Components**:
  - Backend: `catalog-item.entity.ts`, `catalog.module.ts`
  - Frontend: `CatalogPage.tsx`

### User Story 27: Multi-Warehouse Stock Count Visibility
> **As a Warehouse Supervisor**,  
> **I want to** view stock balances for catalog items across different physical warehouses,  
> **So that** I can balance inventory levels and know where items are available.
- **Business Value**: Optimizes distribution and prevents shipping delays.
- **Implementation**: Tracks counts dynamically in the `stock_by_location` table.
- **Components**:
  - Backend: `stock-by-location.entity.ts`, `stock.module.ts`
  - Frontend: `StockPage.tsx`

### User Story 28: Inbound Procurement Logging
> **As a Procurement Officer**,  
> **I want to** record bulk inventory purchase shipments from vendors with unit costs and date logs,  
> **So that** we can track shipping lead times and unit cost trends.
- **Business Value**: Monitors vendor performance and unit costs.
- **Implementation**: Creates logs in `inventory_purchases`, linking to vendor records and stock balances.
- **Components**:
  - Backend: `inventory-purchase.entity.ts`
  - Frontend: `InventoryManagementModule.tsx`

### User Story 29: Consumables Allocation (Issuing Stock)
> **As an IT Support Agent**,  
> **I want to** issue bulk consumables (like a replacement charger) to an employee,  
> **So that** stock counts are updated automatically.
- **Business Value**: Identifies high-usage departments and tracks supply costs per user.
- **Implementation**: The backend updates the location quantity and inserts an `InventoryAssignment` transaction log.
- **Components**:
  - Backend: `inventory-assignment.entity.ts`
  - Frontend: `IssueReturnPage.tsx`

### User Story 30: Consumable Returns & Re-stocking
> **As an IT Support Agent**,  
> **I want to** return unused consumables back to stock,  
> **So that** the location count is updated and the return is logged.
- **Business Value**: Recovers unused inventory and maintains accurate stock levels.
- **Implementation**: Increments stock balances and logs a return record.
- **Components**:
  - Backend: `inventory-return.entity.ts`

### User Story 31: Immutable Inventory Ledger Auditing
> **As a Finance Officer**,  
> **I want** every inventory movement to write to an append-only ledger log,  
> **So that** we have a transparent audit trail of all stock movements.
- **Business Value**: Essential for preventing inventory shrinkage and locating missing stock.
- **Implementation**: Every transaction automatically generates an append-only entry in `stock_ledger` detailing the quantity change, new running balance, and user details.
- **Components**:
  - Backend: `stock-ledger.entity.ts`

### User Story 32: Physical Inventory Audits & Reconciliation
> **As an Auditor**,  
> **I want to** compare actual physical stock counts against the system numbers and log adjustments,  
> **So that** database counts are corrected and discrepancies are recorded.
- **Business Value**: Keeps system data in sync with physical warehouse counts.
- **Implementation**: Reconciles counts and creates `InventoryAudit` and `InventoryAuditDetail` logs.
- **Components**:
  - Backend: `inventory-audit.entity.ts`
  - Frontend: `AuditPage.tsx`

---

## 📊 6. Audit, Operations, & Reporting

### User Story 33: Live Dashboard activity feed
> **As an Operations Director**,  
> **I want to** view a live activity feed of recent database changes on the dashboard,  
> **So that** I can see system changes in real-time.
- **Business Value**: Helps detect unauthorized changes or errors immediately.
- **Implementation**: Frontend calls `GET /api/audit-logs/recent` to query the database log table.
- **Components**:
  - Backend: `audit-logs.controller.ts`
  - Frontend: `DashboardHome.tsx`

### User Story 34: Cron-Based Security Event Audit Log
> **As a Security Admin**,  
> **I want** failed logins, passwords updates, and role modifications to be logged in a security log table,  
> **So that** we have a secure audit trail for compliance purposes.
- **Business Value**: Essential for security audits and detecting brute-force attacks.
- **Implementation**: Operations write to `audit_events` and `audit_logs` tables containing IP addresses, user agents, and status details.
- **Components**:
  - Backend: `audit-event.entity.ts`, `audit-log.entity.ts`

### User Story 35: Employee Asset Holdings Lookup
> **As an HR Specialist**,  
> **I want to** view all hardware, licenses, and consumables currently assigned to a specific employee,  
> **So that** I can verify returned items before offboarding the employee.
- **Business Value**: Prevents equipment loss during employee offboarding.
- **Implementation**: Frontend filters assignments by user ID.
- **Components**:
  - Frontend: `HoldingsPage.tsx`

### User Story 36: Reporting Module & Excel Data Export
> **As a Department Lead**,  
> **I want to** generate asset and inventory reports and export the data to Excel or CSV,  
> **So that** I can share licensing compliance and inventory reports with management.
- **Business Value**: Simplifies resource reporting for executive reviews.
- **Implementation**: Express middleware generates CSV streams directly from the database query rows.
- **Components**:
  - Backend: `reports.module.ts`
  - Frontend: `ReportsPage.tsx`

---

## ⚙️ 7. System Integrations & UI Optimizations

### User Story 37: Azure AD Synchronization
> **As an IT Admin**,  
> **I want to** sync employee accounts with Azure Active Directory periodically,  
> **So that** user profiles and role settings stay in sync with the corporate directory.
- **Business Value**: Reduces identity administration overhead and improves security.
- **Implementation**: Graph API calls map AD GUID profiles directly to `azure_id` columns in the database.
- **Components**:
  - Backend: `user.entity.ts` (Azure ID property)

### User Story 38: Mobile Field Access (Responsive UI)
> **As an IT Engineer**,  
> **I want to** access the asset registry and update counts on my mobile device,  
> **So that** I can update inventory records directly from the server room.
- **Business Value**: Improves data entry accuracy by allowing updates on the spot.
- **Implementation**: Fully responsive CSS layouts with touch targets (min 44x44px) and collapsible mobile drawer navigation.
- **Components**:
  - Frontend: `AppShell.tsx`, `DashboardHome.tsx`

---

## ⚙️ 8. Advanced System Monitoring & Data Integrity

### User Story 39: Overdue Asset Return Notifications & Dashboard Alerts
> **As an IT Operations Coordinator**,  
> **I want to** view a list of all checked-out items that have passed their return due date, with a clear count of days overdue,  
> **So that** I can follow up with employees and recover hardware in a timely manner.
- **Business Value**: Minimizes shrinkage and ensures devices are returned on schedule.
- **Implementation**: Uses query filters checking current timestamp vs. the assigned `dueDate` on non-returned assignments.
- **Components**:
  - Frontend: [OverduePage.tsx](file:///d:/Opensource%20Project/IT%20Assect%20Management/frontend/src/components/Overdue/OverduePage.tsx)
  - Backend: `assignments.service.ts`

### User Story 40: Specific Asset History & Row-Level Audit Log
> **As an IT Compliance Officer**,  
> **I want to** view a chronological audit log of all changes made to a specific asset (who modified it, what was changed, and when),  
> **So that** I can trace the lineage of updates and audit compliance anomalies.
- **Business Value**: Simplifies root-cause analysis and compliance audits.
- **Implementation**: Queries the `audit_logs` table filtering by asset identifier entity values to present chronological diff steps.
- **Components**:
  - Frontend: [AssetAuditLog.tsx](file:///d:/Opensource%20Project/IT%20Assect%20Management/frontend/src/components/Assets/AssetAuditLog.tsx)
  - Backend: `audit-logs.service.ts`

### User Story 41: Dashboard Analytics & Interactive Charts
> **As a Chief Information Officer (CIO)**,  
> **I want to** view interactive charts showing asset allocations by location, total license expenditures, and hardware category distribution,  
> **So that** I can make data-driven decisions on IT procurement and budget allocation.
- **Business Value**: Provides executive visibility and expense optimization.
- **Implementation**: Integrates ApexCharts in React to query backend aggregation data.
- **Components**:
  - Frontend: [AnalyticsDashboard.tsx](file:///d:/Opensource%20Project/IT%20Assect%20Management/frontend/src/components/Analytics/AnalyticsDashboard.tsx)
  - Backend: `analytics.service.ts`

### User Story 42: Transactional Integrity for Asset Procurement / Goods Receipt
> **As a Finance Manager**,  
> **I want** multi-device procurement records and catalog allocations to be executed within a single database transaction,  
> **So that** database state remains completely consistent if any item registration fails.
- **Business Value**: Guarantees zero data pollution or partial registrations.
- **Implementation**: Employs TypeORM database transaction blocks wrapping individual inserts.
- **Components**:
  - Backend: `procurement.service.ts`

### User Story 43: Asset and Inventory Category Master Management
> **As a Configuration Manager**,  
> **I want to** create and manage asset categories and inventory item types (e.g., Laptops, Keyboards, Network Cables) with custom checkout rules,  
> **So that** we can dynamically group hardware and consumables throughout the system.
- **Business Value**: Restructures asset organization dynamically as the catalog grows.
- **Implementation**: Supports standard CRUD endpoints for categories.
- **Components**:
  - Frontend: [CategoryMaster.tsx](file:///d:/Opensource%20Project/IT%20Assect%20Management/frontend/src/components/Admin/CategoryMaster.tsx), [CategoryManagement.tsx](file:///d:/Opensource%20Project/IT%20Assect%20Management/frontend/src/components/ConsumableInventory/CategoryManagement.tsx)
