"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const role_entity_1 = require("./entities/role.entity");
const permission_entity_1 = require("./entities/permission.entity");
const asset_entity_1 = require("./entities/asset.entity");
const license_entity_1 = require("./entities/license.entity");
const inventory_item_entity_1 = require("./entities/inventory-item.entity");
const audit_log_entity_1 = require("./entities/audit-log.entity");
const brand_entity_1 = require("./entities/brand.entity");
const vendor_entity_1 = require("./entities/vendor.entity");
const category_entity_1 = require("./entities/category.entity");
const department_entity_1 = require("./entities/department.entity");
const location_entity_1 = require("./entities/location.entity");
const asset_photo_entity_1 = require("./entities/asset-photo.entity");
const asset_history_entity_1 = require("./entities/asset-history.entity");
const assignment_entity_1 = require("./entities/assignment.entity");
const license_assignment_entity_1 = require("./entities/license-assignment.entity");
const license_renewal_entity_1 = require("./entities/license-renewal.entity");
const license_plan_entity_1 = require("./entities/license-plan.entity");
const password_reset_token_entity_1 = require("./entities/password-reset-token.entity");
const lookup_entity_1 = require("./entities/lookup.entity");
const catalog_item_entity_1 = require("./entities/catalog-item.entity");
const asset_unit_entity_1 = require("./entities/asset-unit.entity");
const procurement_request_entity_1 = require("./entities/procurement-request.entity");
const purchase_order_entity_1 = require("./entities/purchase-order.entity");
const return_transaction_entity_1 = require("./entities/return-transaction.entity");
const audit_event_entity_1 = require("./entities/audit-event.entity");
const workflow_rule_entity_1 = require("./entities/workflow-rule.entity");
const approval_task_entity_1 = require("./entities/approval-task.entity");
const goods_receipt_entity_1 = require("./entities/goods-receipt.entity");
const inventory_audit_entity_1 = require("./entities/inventory-audit.entity");
const stock_by_location_entity_1 = require("./entities/stock-by-location.entity");
const stock_ledger_entity_1 = require("./entities/stock-ledger.entity");
const bcrypt = __importStar(require("bcrypt"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'IT Asset Management',
    entities: [
        user_entity_1.User, role_entity_1.Role, permission_entity_1.Permission, password_reset_token_entity_1.PasswordResetToken,
        asset_entity_1.Asset, asset_photo_entity_1.AssetPhoto, asset_history_entity_1.AssetHistory, assignment_entity_1.Assignment,
        license_entity_1.License, license_assignment_entity_1.LicenseAssignment, license_renewal_entity_1.LicenseRenewal, license_plan_entity_1.LicensePlan,
        inventory_item_entity_1.InventoryItem, audit_log_entity_1.AuditLog, brand_entity_1.Brand, vendor_entity_1.Vendor, category_entity_1.Category, department_entity_1.Department, location_entity_1.Location,
        lookup_entity_1.Lookup, catalog_item_entity_1.CatalogItem, asset_unit_entity_1.AssetUnit, procurement_request_entity_1.ProcurementRequest, purchase_order_entity_1.PurchaseOrder,
        return_transaction_entity_1.ReturnTransaction, audit_event_entity_1.AuditEvent, workflow_rule_entity_1.WorkflowRule, approval_task_entity_1.ApprovalTask, goods_receipt_entity_1.GoodsReceipt,
        inventory_audit_entity_1.InventoryAudit, inventory_audit_entity_1.InventoryAuditDetail, stock_by_location_entity_1.StockByLocation, stock_ledger_entity_1.StockLedger
    ],
    synchronize: true,
});
async function main() {
    try {
        await AppDataSource.initialize();
        console.log('🔗 Database connected for comprehensive seeding!');
        const lookupRepo = AppDataSource.getRepository(lookup_entity_1.Lookup);
        const deptRepo = AppDataSource.getRepository(department_entity_1.Department);
        const locRepo = AppDataSource.getRepository(location_entity_1.Location);
        const brandRepo = AppDataSource.getRepository(brand_entity_1.Brand);
        const vendorRepo = AppDataSource.getRepository(vendor_entity_1.Vendor);
        const catRepo = AppDataSource.getRepository(category_entity_1.Category);
        const userRepo = AppDataSource.getRepository(user_entity_1.User);
        const roleRepo = AppDataSource.getRepository(role_entity_1.Role);
        const permRepo = AppDataSource.getRepository(permission_entity_1.Permission);
        const assetRepo = AppDataSource.getRepository(asset_entity_1.Asset);
        const licenseRepo = AppDataSource.getRepository(license_entity_1.License);
        const catalogRepo = AppDataSource.getRepository(catalog_item_entity_1.CatalogItem);
        const procRepo = AppDataSource.getRepository(procurement_request_entity_1.ProcurementRequest);
        const poRepo = AppDataSource.getRepository(purchase_order_entity_1.PurchaseOrder);
        console.log('📦 Seeding Lookups...');
        const lookups = [
            { type: 'ASSET_CONDITION', label: 'New', value: 'new', sortOrder: 1 },
            { type: 'ASSET_CONDITION', label: 'Good', value: 'good', sortOrder: 2 },
            { type: 'ASSET_CONDITION', label: 'Fair', value: 'fair', sortOrder: 3 },
            { type: 'ASSET_CONDITION', label: 'Poor', value: 'poor', sortOrder: 4 },
            { type: 'DISPOSAL_METHOD', label: 'Sold', value: 'sold', sortOrder: 1 },
            { type: 'DISPOSAL_METHOD', label: 'Recycled', value: 'recycled', sortOrder: 2 },
            { type: 'DISPOSAL_METHOD', label: 'Donated', value: 'donated', sortOrder: 3 },
            { type: 'DISPOSAL_METHOD', label: 'Destroyed', value: 'destroyed', sortOrder: 4 },
        ];
        for (const l of lookups) {
            if (!(await lookupRepo.findOneBy({ type: l.type, value: l.value }))) {
                await lookupRepo.save(lookupRepo.create({ ...l, isActive: true }));
            }
        }
        console.log('🏢 Seeding Departments & Locations...');
        const deptNames = ['IT', 'HR', 'Finance', 'Operations', 'Sales', 'Marketing'];
        for (const name of deptNames) {
            if (!(await deptRepo.findOneBy({ name }))) {
                await deptRepo.save(deptRepo.create({ name, isActive: true }));
            }
        }
        const locs = [
            { name: 'Headquarters', address: '123 Tech Park', city: 'Silicon Valley' },
            { name: 'London Branch', address: '45 Canary Wharf', city: 'London' },
            { name: 'Remote', address: 'Global', city: 'Cloud' },
        ];
        for (const l of locs) {
            if (!(await locRepo.findOneBy({ name: l.name }))) {
                await locRepo.save(locRepo.create({ ...l, isActive: true }));
            }
        }
        console.log('🔖 Seeding Categories, Brands & Vendors...');
        const categories = [
            { name: 'Laptop', allowedTargetTypes: ['PERSON'] },
            { name: 'Desktop', allowedTargetTypes: ['PERSON', 'LOCATION'] },
            { name: 'Server', allowedTargetTypes: ['LOCATION'] },
            { name: 'Network', allowedTargetTypes: ['LOCATION'] },
            { name: 'Software', allowedTargetTypes: ['PERSON'] },
        ];
        for (const c of categories) {
            if (!(await catRepo.findOneBy({ name: c.name }))) {
                await catRepo.save(catRepo.create({ ...c, isActive: true }));
            }
        }
        const brandNames = ['Apple', 'Dell', 'HP', 'Cisco', 'Lenovo', 'Microsoft', 'Adobe'];
        for (const name of brandNames) {
            if (!(await brandRepo.findOneBy({ name }))) {
                await brandRepo.save(brandRepo.create({ name, isActive: true }));
            }
        }
        const vendorNames = ['Amazon Business', 'CDW', 'Dell Direct', 'Microsoft Store', 'Local Vendor'];
        for (const name of vendorNames) {
            if (!(await vendorRepo.findOneBy({ name }))) {
                await vendorRepo.save(vendorRepo.create({ name, isActive: true }));
            }
        }
        console.log('🔐 Seeding Roles & Permissions...');
        const perms = [
            { slug: 'assets.view', module: 'Assets', description: 'View Assets' },
            { slug: 'assets.create', module: 'Assets', description: 'Create Assets' },
            { slug: 'assets.manage', module: 'Assets', description: 'Manage Assets' },
            { slug: 'users.view', module: 'Users', description: 'View Users' },
            { slug: 'procurement.view', module: 'Procurement', description: 'View Procurement' },
            { slug: 'procurement.approve', module: 'Procurement', description: 'Approve Procurement' },
        ];
        const savedPerms = [];
        for (const p of perms) {
            let perm = await permRepo.findOneBy({ slug: p.slug });
            if (!perm) {
                perm = await permRepo.save(permRepo.create(p));
            }
            savedPerms.push(perm);
        }
        let adminRole = await roleRepo.findOneBy({ name: 'Admin' });
        if (!adminRole) {
            adminRole = await roleRepo.save(roleRepo.create({ name: 'Admin', description: 'Super Admin', permissions: savedPerms }));
        }
        let managerRole = await roleRepo.findOneBy({ name: 'Manager' });
        if (!managerRole) {
            managerRole = await roleRepo.save(roleRepo.create({ name: 'Manager', description: 'Dept Manager', permissions: savedPerms.filter(p => !p.slug.includes('approve')) }));
        }
        console.log('👤 Seeding Users...');
        const passwordHash = await bcrypt.hash('password123', 10);
        const usersData = [
            { email: 'admin@qbadvisory.com', firstName: 'Admin', lastName: 'User', role: adminRole },
            { email: 'manager@qbadvisory.com', firstName: 'Manager', lastName: 'User', role: managerRole },
            { email: 'user@qbadvisory.com', firstName: 'Regular', lastName: 'User', role: managerRole },
        ];
        const createdUsers = [];
        for (const u of usersData) {
            let user = await userRepo.findOneBy({ email: u.email });
            if (!user) {
                user = await userRepo.save(userRepo.create({ ...u, passwordHash, isActive: true, isVerified: true }));
            }
            createdUsers.push(user);
        }
        console.log('💻 Seeding Assets...');
        const assetData = [
            { name: 'MacBook Pro 16', assetTag: 'AST-001', category: asset_entity_1.AssetCategory.LAPTOP, brand: 'Apple', model: 'M2 Max', serialNumber: 'SN-001', purchaseCost: 3500, status: asset_entity_1.AssetStatus.AVAILABLE },
            { name: 'Dell Precision 5570', assetTag: 'AST-002', category: asset_entity_1.AssetCategory.LAPTOP, brand: 'Dell', model: 'Precision', serialNumber: 'SN-002', purchaseCost: 2800, status: asset_entity_1.AssetStatus.DEPLOYED, assignedToId: createdUsers[1].id },
            { name: 'HP ProLiant DL380', assetTag: 'AST-003', category: asset_entity_1.AssetCategory.SERVER, brand: 'HP', model: 'Gen10', serialNumber: 'SN-003', purchaseCost: 12000, status: asset_entity_1.AssetStatus.AVAILABLE },
            { name: 'Cisco Catalyst 9300', assetTag: 'AST-004', category: asset_entity_1.AssetCategory.NETWORK, brand: 'Cisco', model: '9300', serialNumber: 'SN-004', purchaseCost: 4500, status: asset_entity_1.AssetStatus.AVAILABLE },
        ];
        for (const a of assetData) {
            if (!(await assetRepo.findOneBy({ assetTag: a.assetTag }))) {
                await assetRepo.save(assetRepo.create(a));
            }
        }
        console.log('📜 Seeding Licenses...');
        const licenseData = [
            { softwareName: 'Microsoft Office 365', type: 'user', totalSeats: 100, usedSeats: 45, unitPrice: 12, vendor: 'Microsoft' },
            { softwareName: 'Adobe Creative Cloud', type: 'user', totalSeats: 10, usedSeats: 8, unitPrice: 50, vendor: 'Adobe' },
            { softwareName: 'Windows 11 Pro', type: 'device', totalSeats: 50, usedSeats: 20, unitPrice: 199, vendor: 'Microsoft' },
        ];
        for (const l of licenseData) {
            if (!(await licenseRepo.findOneBy({ softwareName: l.softwareName }))) {
                await licenseRepo.save(licenseRepo.create(l));
            }
        }
        console.log('🗃️ Seeding Catalog & Procurement...');
        const catalogData = [
            { sku: 'CAT-001', name: 'Standard Developer Laptop', returnPolicy: catalog_item_entity_1.ReturnPolicy.RETURNABLE, trackMode: catalog_item_entity_1.TrackMode.SERIALIZED, unitCost: 2500 },
            { sku: 'CAT-002', name: 'Wireless Mouse', returnPolicy: catalog_item_entity_1.ReturnPolicy.CONSUMABLE, trackMode: catalog_item_entity_1.TrackMode.BULK_QTY, unitCost: 25 },
        ];
        const createdCatalog = [];
        for (const c of catalogData) {
            let item = await catalogRepo.findOneBy({ sku: c.sku });
            if (!item) {
                item = await catalogRepo.save(catalogRepo.create(c));
            }
            createdCatalog.push(item);
        }
        const procurementData = [
            { itemName: 'MacBook Pro M2', quantity: 5, estimatedCost: 12500, requesterId: createdUsers[1].id, status: procurement_request_entity_1.ProcurementStatus.PENDING, priority: procurement_request_entity_1.ProcurementPriority.HIGH, reason: 'New hires in Engineering' },
            { itemName: 'Dell Monitors', quantity: 10, estimatedCost: 3000, requesterId: createdUsers[2].id, status: procurement_request_entity_1.ProcurementStatus.APPROVED, priority: procurement_request_entity_1.ProcurementPriority.MEDIUM, reason: 'Office upgrade' },
        ];
        for (const p of procurementData) {
            await procRepo.save(procRepo.create(p));
        }
        console.log('✨ Comprehensive seeding completed successfully!');
        await AppDataSource.destroy();
        process.exit(0);
    }
    catch (err) {
        console.error('❌ Error during comprehensive seeding:', err);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=seed-everything.js.map