import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { Brand } from './entities/brand.entity';
import { Vendor } from './entities/vendor.entity';
import { Category } from './entities/category.entity';
import { Department } from './entities/department.entity';
import { Location } from './entities/location.entity';
import { Lookup } from './entities/lookup.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { CurrencyRate } from './entities/currency-rate.entity';
import { Assignment } from './entities/assignment.entity';
import { Asset } from './entities/asset.entity';
import { AssetHistory } from './entities/asset-history.entity';
import { PERMISSION_CATALOG } from './common/permission-catalog';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'IT Asset Management',
    entities: [__dirname + '/entities/*.entity{.ts,.js}'],
    synchronize: false,
});

async function main() {
    try {
        await AppDataSource.initialize();
        console.log('🔗 Database connected for Master Admin Seeding!');

        const lookupRepo = AppDataSource.getRepository(Lookup);
        const deptRepo = AppDataSource.getRepository(Department);
        const locRepo = AppDataSource.getRepository(Location);
        const brandRepo = AppDataSource.getRepository(Brand);
        const vendorRepo = AppDataSource.getRepository(Vendor);
        const catRepo = AppDataSource.getRepository(Category);
        const userRepo = AppDataSource.getRepository(User);
        const roleRepo = AppDataSource.getRepository(Role);
        const permRepo = AppDataSource.getRepository(Permission);

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

        console.log('💱 Seeding Currency Rates...');
        // rateToBase = "1 [code] = X INR". Insert-if-missing only: never
        // overwrite rates an admin has tuned in System Settings.
        const currencyRepo = AppDataSource.getRepository(CurrencyRate);
        const currencies = [
            { code: 'INR', name: 'Indian Rupee', symbol: '₹', rateToBase: 1 },
            { code: 'USD', name: 'US Dollar', symbol: '$', rateToBase: 88.5 },
            { code: 'EUR', name: 'Euro', symbol: '€', rateToBase: 96.4 },
            { code: 'GBP', name: 'British Pound', symbol: '£', rateToBase: 112.3 },
            { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rateToBase: 0.58 },
            { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rateToBase: 57.8 },
            { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rateToBase: 63.2 },
            { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rateToBase: 65.6 },
            { code: 'AED', name: 'UAE Dirham', symbol: 'AED ', rateToBase: 24.1 },
            { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF ', rateToBase: 99.7 },
            { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rateToBase: 12.2 },
        ];
        for (const c of currencies) {
            if (!(await currencyRepo.findOneBy({ code: c.code }))) {
                await currencyRepo.save(currencyRepo.create({ ...c, isActive: true }));
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

        console.log('🔐 Seeding Permissions...');
        const permissionsToSeed = PERMISSION_CATALOG;

        for (const p of permissionsToSeed) {
            if (!(await permRepo.findOneBy({ slug: p.slug }))) {
                await permRepo.save(permRepo.create(p));
            }
        }
        
        const allPerms = await permRepo.find();
        const getPerms = (prefixes: string[]) => {
            if (prefixes.includes('*')) return allPerms;
            return allPerms.filter(p => prefixes.some(prefix => p.slug.startsWith(prefix)));
        };

        console.log('🎭 Seeding Roles...');
        const rolesToSeed = [
            {
                name: 'Admin',
                description: 'Full system access and configuration',
                permissions: getPerms(['*']) // all permissions
            },
            {
                name: 'IT',
                description: 'IT Department usage for asset and inventory management',
                permissions: getPerms([
                    'assets.', 'inventory.', 'inventory-mgmt.', 'licenses.', 'users.', 'reports.',
                    'analytics.view', 'locations.', 'departments.', 'categories.', 'brands.', 'vendors.',
                    'dashboard.view.all'
                ])
            },
            {
                name: 'IT Helpdesk',
                description: 'Manage assets, inventory, and regular users',
                permissions: getPerms([
                    'assets.', 'inventory.', 'inventory-mgmt.', 'licenses.', 'users.view', 'users.create', 'users.edit',
                    'locations.view', 'departments.view', 'categories.view', 'brands.view', 'vendors.view',
                    'dashboard.view.all'
                ])
            },
            {
                name: 'Manager',
                description: 'Department or Location Manager',
                permissions: getPerms([
                    'assets.view', 'licenses.view', 'reports.view', 'analytics.view', 'inventory.view', 'inventory-mgmt.view',
                    'users.view', 'locations.view', 'departments.view', 'dashboard.view.department'
                ])
            },
            {
                name: 'Auditor',
                description: 'Read-only access for compliance and audits',
                // Enumerated, not pattern-matched: a blanket `.view` filter also grants
                // users.view/roles.view, which unhide the Admin nav group.
                permissions: getPerms([
                    'assets.view', 'licenses.view',
                    'inventory.view', 'inventory-mgmt.view',
                    'reports.view', 'reports.export', 'analytics.view',
                    'dashboard.view.all',
                ])
            },
            {
                name: 'Standard User',
                description: 'Regular employee with self-service access',
                permissions: getPerms(['assets.view'])
            }
        ];

        let adminRole = null;
        for (const r of rolesToSeed) {
            // The seeded Admin role is the built-in system role: protected from
            // rename/deactivation/deletion. Runtime checks read is_system.
            const isSystem = r.name === 'Admin';
            let existingRole = await roleRepo.findOne({ where: { name: r.name }, relations: ['permissions'] });
            if (!existingRole) {
                existingRole = await roleRepo.save(roleRepo.create({ name: r.name, description: r.description, permissions: r.permissions, isActive: true, isSystem }));
            } else {
                existingRole.permissions = r.permissions;
                if (isSystem && !existingRole.isSystem) existingRole.isSystem = true;
                existingRole = await roleRepo.save(existingRole);
            }
            if (existingRole.name === 'Admin') adminRole = existingRole;
        }

        console.log('👤 Seeding Users...');
        if (adminRole) {
            // UAT/production-safe: the admin credential must come from env.
            // A hard-coded password is only permitted in local development.
            const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@qbadvisory.com';
            let adminPassword = process.env.SEED_ADMIN_PASSWORD;
            if (!adminPassword) {
                if (process.env.NODE_ENV === 'development') {
                    adminPassword = 'password123'; // development-only default
                    console.warn('⚠️  Using the development-only default admin password. Set SEED_ADMIN_PASSWORD for UAT/production.');
                } else {
                    throw new Error(
                        'SEED_ADMIN_PASSWORD must be set when NODE_ENV is not "development". ' +
                        'Refusing to seed a well-known default admin password outside local development.',
                    );
                }
            }
            const passwordHash = await bcrypt.hash(adminPassword, 10);
            let adminUser = await userRepo.findOneBy({ email: adminEmail });
            if (!adminUser) {
                await userRepo.save(userRepo.create({
                    email: adminEmail,
                    firstName: 'System',
                    lastName: 'Admin',
                    role: adminRole,
                    passwordHash,
                    isActive: true,
                    isVerified: true
                }));
            }
        }

        console.log('✨ Admin Module Master Seeding completed successfully!');
        await AppDataSource.destroy();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during master seeding:', err);
        process.exit(1);
    }
}

main();
