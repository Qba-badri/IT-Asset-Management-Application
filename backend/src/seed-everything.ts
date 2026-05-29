import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { Asset, AssetStatus, AssetCondition, AssetCategory, AcquisitionType } from './entities/asset.entity';
import { License } from './entities/license.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Brand } from './entities/brand.entity';
import { Vendor } from './entities/vendor.entity';
import { Category } from './entities/category.entity';
import { Department } from './entities/department.entity';
import { Location } from './entities/location.entity';
import { AssetPhoto } from './entities/asset-photo.entity';
import { AssetHistory } from './entities/asset-history.entity';
import { Assignment } from './entities/assignment.entity';
import { LicenseAssignment } from './entities/license-assignment.entity';
import { LicenseRenewal } from './entities/license-renewal.entity';

import { LicensePlan } from './entities/license-plan.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { Lookup } from './entities/lookup.entity';
import { CatalogItem, ReturnPolicy, TrackMode } from './entities/catalog-item.entity';
import { AssetUnit } from './entities/asset-unit.entity';
import { InventoryAudit, InventoryAuditDetail } from './entities/inventory-audit.entity';
import { StockByLocation } from './entities/stock-by-location.entity';
import { StockLedger } from './entities/stock-ledger.entity';
import { ReturnTransaction } from './entities/return-transaction.entity';
import { AuditEvent } from './entities/audit-event.entity';
import { LicenseHistory } from './entities/license-history.entity';
import { InventoryCategory } from './entities/inventory-category.entity';
import { InventoryPurchase } from './entities/inventory-purchase.entity';
import { InventoryAssignment } from './entities/inventory-assignment.entity';
import { InventoryReturn } from './entities/inventory-return.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'IT Asset Management',
    entities: [
        User, Role, Permission, PasswordResetToken,
        Asset, AssetPhoto, AssetHistory, Assignment,
        License, LicenseAssignment, LicenseRenewal, LicensePlan,
        InventoryItem, AuditLog, Brand, Vendor, Category, Department, Location,
        Lookup, CatalogItem,
        InventoryAudit, InventoryAuditDetail, StockByLocation, StockLedger, AssetUnit,
        ReturnTransaction, AuditEvent, LicenseHistory,
        InventoryCategory, InventoryPurchase, InventoryAssignment, InventoryReturn, InventoryTransaction
    ],
    synchronize: true, // Be careful in production, but good for seeding a fresh DB
});

async function main() {
    try {
        await AppDataSource.initialize();
        console.log('🔗 Database connected for comprehensive seeding!');

        // 0. Helper for clearing (optional)
        // await AppDataSource.synchronize(true);

        const lookupRepo = AppDataSource.getRepository(Lookup);
        const deptRepo = AppDataSource.getRepository(Department);
        const locRepo = AppDataSource.getRepository(Location);
        const brandRepo = AppDataSource.getRepository(Brand);
        const vendorRepo = AppDataSource.getRepository(Vendor);
        const catRepo = AppDataSource.getRepository(Category);
        const userRepo = AppDataSource.getRepository(User);
        const roleRepo = AppDataSource.getRepository(Role);
        const permRepo = AppDataSource.getRepository(Permission);
        const assetRepo = AppDataSource.getRepository(Asset);
        const licenseRepo = AppDataSource.getRepository(License);
        const catalogRepo = AppDataSource.getRepository(CatalogItem);

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
            { slug: 'users.view', module: 'Users', description: 'View Users' },
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
            { name: 'MacBook Pro 16', assetTag: 'AST-001', category: AssetCategory.LAPTOP, brand: 'Apple', model: 'M2 Max', serialNumber: 'SN-001', purchaseCost: 3500, status: AssetStatus.AVAILABLE },
            { name: 'Dell Precision 5570', assetTag: 'AST-002', category: AssetCategory.LAPTOP, brand: 'Dell', model: 'Precision', serialNumber: 'SN-002', purchaseCost: 2800, status: AssetStatus.DEPLOYED, assignedToId: createdUsers[1].id },
            { name: 'HP ProLiant DL380', assetTag: 'AST-003', category: AssetCategory.SERVER, brand: 'HP', model: 'Gen10', serialNumber: 'SN-003', purchaseCost: 12000, status: AssetStatus.AVAILABLE },
            { name: 'Cisco Catalyst 9300', assetTag: 'AST-004', category: AssetCategory.NETWORK, brand: 'Cisco', model: '9300', serialNumber: 'SN-004', purchaseCost: 4500, status: AssetStatus.AVAILABLE },
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


        console.log('✨ Comprehensive seeding completed successfully!');
        await AppDataSource.destroy();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during comprehensive seeding:', err);
        process.exit(1);
    }
}

main();
