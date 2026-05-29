import { DataSource } from 'typeorm';
import { InventoryCategory } from './entities/inventory-category.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { User } from './entities/user.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'Banap@5692',
    database: process.env.DB_NAME || 'IT Asset Management',
    entities: [InventoryCategory, InventoryItem, Permission, Role, User],
    synchronize: false,
});

async function seed() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected');

        const categoryRepo = AppDataSource.getRepository(InventoryCategory);
        const itemRepo = AppDataSource.getRepository(InventoryItem);
        const permRepo = AppDataSource.getRepository(Permission);
        const roleRepo = AppDataSource.getRepository(Role);

        // 1. Create Permissions
        const perms = [
            { slug: 'inventory-mgmt.view', module: 'Inventory', description: 'View Inventory Management' },
            { slug: 'inventory-mgmt.manage', module: 'Inventory', description: 'Manage Inventory Management' },
        ];

        for (const p of perms) {
            const existing = await permRepo.findOne({ where: { slug: p.slug } });
            if (!existing) {
                await permRepo.save(permRepo.create(p));
                console.log(`Created permission: ${p.slug}`);
            }
        }

        // 2. Assign to Admin/Manager
        const adminRole = await roleRepo.findOne({ where: { name: 'Admin' }, relations: ['permissions'] });
        if (adminRole) {
            const allPerms = await permRepo.find();
            adminRole.permissions = Array.from(new Set([...adminRole.permissions, ...allPerms.filter(p => p.module === 'Inventory')]));
            await roleRepo.save(adminRole);
            console.log('Updated Admin permissions');
        }

        // 3. Categories
        const categories = ['Battery', 'Cable', 'Headphone', 'Bags', 'Input Devices'];
        for (const catName of categories) {
            const existing = await categoryRepo.findOne({ where: { name: catName } });
            if (!existing) {
                await categoryRepo.save(categoryRepo.create({ name: catName, description: `${catName} items` }));
                console.log(`Created category: ${catName}`);
            }
        }

        // 4. Sample Items
        const catBattery = await categoryRepo.findOne({ where: { name: 'Battery' } });
        const catCable = await categoryRepo.findOne({ where: { name: 'Cable' } });

        if (catBattery) {
            const item = await itemRepo.findOne({ where: { name: 'AA Batteries (4-pack)' } });
            if (!item) {
                await itemRepo.save(itemRepo.create({
                    name: 'AA Batteries (4-pack)',
                    categoryId: catBattery.id,
                    isRefundable: false,
                    minStockLevel: 10,
                    status: 'active'
                }));
            }
        }

        if (catCable) {
            const item = await itemRepo.findOne({ where: { name: 'HDMI 2.1 Cable 2m' } });
            if (!item) {
                await itemRepo.save(itemRepo.create({
                    name: 'HDMI 2.1 Cable 2m',
                    categoryId: catCable.id,
                    isRefundable: true,
                    minStockLevel: 5,
                    status: 'active'
                }));
            }
        }

        console.log('Inventory seed completed');
        await AppDataSource.destroy();
    } catch (err) {
        console.error('Seed failed', err);
        process.exit(1);
    }
}

seed();
