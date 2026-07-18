/**
 * The canonical list of every permission this application understands.
 *
 * A permission only does anything if code checks it — via `@Permissions(...)` on
 * a controller, or an explicit lookup such as `dashboard.view.all` in
 * `dashboard-scope.ts`. A slug that no code checks is inert: it can be created
 * and granted to a role, and it will still authorise nothing. That failure is
 * silent, which is why the admin UI offers this catalog instead of a free-text
 * field, and why the seeder reads from here rather than keeping its own copy.
 *
 * When you add a `@Permissions('foo.bar')` check, add `foo.bar` here too.
 * `permission-catalog.spec.ts` fails if you forget.
 */
export interface CatalogPermission {
    slug: string;
    module: string;
    description: string;
}

export const PERMISSION_CATALOG: readonly CatalogPermission[] = [
    { slug: 'assets.view', module: 'Assets', description: 'View Assets' },
    { slug: 'assets.create', module: 'Assets', description: 'Create Assets' },
    { slug: 'assets.edit', module: 'Assets', description: 'Edit Assets' },
    { slug: 'assets.delete', module: 'Assets', description: 'Delete Assets' },
    { slug: 'assets.manage', module: 'Assets', description: 'Manage Assets (All actions)' },
    { slug: 'users.view', module: 'Users', description: 'View Users' },
    { slug: 'users.create', module: 'Users', description: 'Create Users' },
    { slug: 'users.edit', module: 'Users', description: 'Edit Users' },
    { slug: 'users.delete', module: 'Users', description: 'Delete Users' },
    { slug: 'users.manage', module: 'Users', description: 'Manage Users (All actions)' },
    { slug: 'roles.view', module: 'Roles', description: 'View Roles' },
    { slug: 'roles.create', module: 'Roles', description: 'Create Roles' },
    { slug: 'roles.edit', module: 'Roles', description: 'Edit Roles' },
    { slug: 'roles.delete', module: 'Roles', description: 'Delete Roles' },
    { slug: 'roles.manage', module: 'Roles', description: 'Manage Roles (All actions)' },
    { slug: 'licenses.view', module: 'Licenses', description: 'View Licenses' },
    { slug: 'licenses.create', module: 'Licenses', description: 'Create Licenses' },
    { slug: 'licenses.edit', module: 'Licenses', description: 'Edit Licenses' },
    { slug: 'licenses.delete', module: 'Licenses', description: 'Delete Licenses' },
    { slug: 'licenses.manage', module: 'Licenses', description: 'Manage Licenses (All actions)' },
    { slug: 'inventory.view', module: 'Inventory', description: 'View Inventory' },
    { slug: 'inventory.create', module: 'Inventory', description: 'Create Inventory Items' },
    { slug: 'inventory.edit', module: 'Inventory', description: 'Edit Inventory Items' },
    { slug: 'inventory.delete', module: 'Inventory', description: 'Delete Inventory Items' },
    { slug: 'inventory.manage', module: 'Inventory', description: 'Manage Inventory (All actions)' },
    // Consumable Inventory module (api/inventory-management) uses its own slugs.
    { slug: 'inventory-mgmt.view', module: 'Inventory', description: 'View Consumable Inventory' },
    { slug: 'inventory-mgmt.manage', module: 'Inventory', description: 'Manage Consumable Inventory (All actions)' },
    { slug: 'reports.view', module: 'Reports', description: 'View Reports' },
    { slug: 'reports.export', module: 'Reports', description: 'Export Reports' },
    // Audit-logs endpoints require this slug.
    { slug: 'analytics.view', module: 'Reports', description: 'View Analytics & Audit Logs' },
    // Dashboard data-scope permissions. Absence of both = self-only view
    // (a user sees only their own assigned assets/licenses/assignments).
    { slug: 'dashboard.view.all', module: 'Dashboard', description: 'View organization-wide dashboard data' },
    { slug: 'dashboard.view.department', module: 'Dashboard', description: 'View dashboard data scoped to own department' },
    { slug: 'settings.view', module: 'Settings', description: 'View System Settings' },
    { slug: 'settings.manage', module: 'Settings', description: 'Manage System Settings' },
    { slug: 'categories.view', module: 'Categories', description: 'View Categories' },
    { slug: 'categories.manage', module: 'Categories', description: 'Manage Categories' },
    { slug: 'locations.view', module: 'Locations', description: 'View Locations' },
    { slug: 'locations.manage', module: 'Locations', description: 'Manage Locations' },
    { slug: 'departments.view', module: 'Departments', description: 'View Departments' },
    { slug: 'departments.manage', module: 'Departments', description: 'Manage Departments' },
    { slug: 'brands.view', module: 'Brands', description: 'View Brands' },
    { slug: 'brands.manage', module: 'Brands', description: 'Manage Brands' },
    { slug: 'vendors.view', module: 'Vendors', description: 'View Vendors' },
    { slug: 'vendors.manage', module: 'Vendors', description: 'Manage Vendors' },
];

/** Every module in the catalog, sorted, for populating the admin Module picker. */
export const PERMISSION_MODULES: readonly string[] = [
    ...new Set(PERMISSION_CATALOG.map((p) => p.module)),
].sort();
