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
const inventory_category_entity_1 = require("./entities/inventory-category.entity");
const inventory_item_entity_1 = require("./entities/inventory-item.entity");
const permission_entity_1 = require("./entities/permission.entity");
const role_entity_1 = require("./entities/role.entity");
const user_entity_1 = require("./entities/user.entity");
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config({ path: path.join(__dirname, '../.env') });
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'Banap@5692',
    database: process.env.DB_NAME || 'IT Asset Management',
    entities: [inventory_category_entity_1.InventoryCategory, inventory_item_entity_1.InventoryItem, permission_entity_1.Permission, role_entity_1.Role, user_entity_1.User],
    synchronize: false,
});
async function seed() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected');
        const categoryRepo = AppDataSource.getRepository(inventory_category_entity_1.InventoryCategory);
        const itemRepo = AppDataSource.getRepository(inventory_item_entity_1.InventoryItem);
        const permRepo = AppDataSource.getRepository(permission_entity_1.Permission);
        const roleRepo = AppDataSource.getRepository(role_entity_1.Role);
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
        const adminRole = await roleRepo.findOne({ where: { name: 'Admin' }, relations: ['permissions'] });
        if (adminRole) {
            const allPerms = await permRepo.find();
            adminRole.permissions = Array.from(new Set([...adminRole.permissions, ...allPerms.filter(p => p.module === 'Inventory')]));
            await roleRepo.save(adminRole);
            console.log('Updated Admin permissions');
        }
        const categories = ['Battery', 'Cable', 'Headphone', 'Bags', 'Input Devices'];
        for (const catName of categories) {
            const existing = await categoryRepo.findOne({ where: { name: catName } });
            if (!existing) {
                await categoryRepo.save(categoryRepo.create({ name: catName, description: `${catName} items` }));
                console.log(`Created category: ${catName}`);
            }
        }
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
    }
    catch (err) {
        console.error('Seed failed', err);
        process.exit(1);
    }
}
seed();
//# sourceMappingURL=seed-consumables.js.map