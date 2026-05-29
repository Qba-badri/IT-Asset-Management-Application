"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'IT Asset Management',
    synchronize: false,
});
async function addInventoryPermissions() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected');
        await AppDataSource.query(`
      INSERT INTO permissions (slug, module, description, created_at, updated_at)
      VALUES 
        ('inventory-mgmt.view', 'Inventory', 'View Inventory Management', NOW(), NOW()),
        ('inventory-mgmt.manage', 'Inventory', 'Manage Inventory Management', NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING;
    `);
        console.log('✅ Permissions created');
        await AppDataSource.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'Admin' 
        AND p.module = 'Inventory'
        AND NOT EXISTS (
          SELECT 1 FROM role_permissions rp 
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        );
    `);
        console.log('✅ Permissions assigned to Admin role');
        const result = await AppDataSource.query(`
      SELECT r.name as role, p.slug as permission, p.module
      FROM roles r
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE p.module = 'Inventory'
      ORDER BY r.name, p.slug;
    `);
        console.log('\n📋 Inventory Permissions:');
        console.table(result);
        await AppDataSource.destroy();
        console.log('\n✅ Done!');
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
addInventoryPermissions();
//# sourceMappingURL=add-inventory-permissions.js.map