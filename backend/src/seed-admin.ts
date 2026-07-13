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
import { Assignment } from './entities/assignment.entity';
import { Asset } from './entities/asset.entity';
import { AssetHistory } from './entities/asset-history.entity';
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
        const permissionsToSeed = [
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
            { slug: 'reports.view', module: 'Reports', description: 'View Reports' },
            { slug: 'reports.export', module: 'Reports', description: 'Export Reports' },
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
                    'assets.', 'inventory.', 'licenses.', 'users.', 'reports.',
                    'locations.', 'departments.', 'categories.', 'brands.', 'vendors.'
                ])
            },
            {
                name: 'IT Helpdesk',
                description: 'Manage assets, inventory, and regular users',
                permissions: getPerms([
                    'assets.', 'inventory.', 'licenses.', 'users.view', 'users.create', 'users.edit',
                    'locations.view', 'departments.view', 'categories.view', 'brands.view', 'vendors.view'
                ])
            },
            {
                name: 'Manager',
                description: 'Department or Location Manager',
                permissions: getPerms([
                    'assets.view', 'reports.view', 'inventory.view', 'users.view',
                    'locations.view', 'departments.view'
                ])
            },
            {
                name: 'Auditor',
                description: 'Read-only access for compliance and audits',
                permissions: allPerms.filter(p => p.slug.includes('.view') || p.slug.includes('.export'))
            },
            {
                name: 'Standard User',
                description: 'Regular employee with self-service access',
                permissions: getPerms(['assets.view'])
            }
        ];

        let adminRole = null;
        for (const r of rolesToSeed) {
            let existingRole = await roleRepo.findOne({ where: { name: r.name }, relations: ['permissions'] });
            if (!existingRole) {
                existingRole = await roleRepo.save(roleRepo.create({ name: r.name, description: r.description, permissions: r.permissions, isActive: true }));
            } else {
                existingRole.permissions = r.permissions;
                existingRole = await roleRepo.save(existingRole);
            }
            if (existingRole.name === 'Admin') adminRole = existingRole;
        }

        console.log('👤 Seeding Users...');
        if (adminRole) {
            const passwordHash = await bcrypt.hash('password123', 10);
            let adminUser = await userRepo.findOneBy({ email: 'admin@qbadvisory.com' });
            if (!adminUser) {
                await userRepo.save(userRepo.create({ 
                    email: 'admin@qbadvisory.com', 
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
