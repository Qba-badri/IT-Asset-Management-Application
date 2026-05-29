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
async function checkInventoryData() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected\n');
        const items = await AppDataSource.query('SELECT COUNT(*) as count FROM inventory_items');
        console.log(`📦 Inventory Items: ${items[0].count} records`);
        if (items[0].count > 0) {
            const sampleItems = await AppDataSource.query('SELECT id, name, total_stock, available_stock FROM inventory_items LIMIT 5');
            console.log('\nSample Items:');
            console.table(sampleItems);
        }
        const purchases = await AppDataSource.query('SELECT COUNT(*) as count FROM inventory_purchases');
        console.log(`\n🛒 Inventory Purchases: ${purchases[0].count} records`);
        if (purchases[0].count > 0) {
            const samplePurchases = await AppDataSource.query('SELECT id, vendor_name, quantity, purchase_date FROM inventory_purchases LIMIT 5');
            console.log('\nSample Purchases:');
            console.table(samplePurchases);
        }
        const categories = await AppDataSource.query('SELECT COUNT(*) as count FROM inventory_categories');
        console.log(`\n📁 Inventory Categories: ${categories[0].count} records`);
        const assignments = await AppDataSource.query('SELECT COUNT(*) as count FROM inventory_assignments');
        console.log(`\n👥 Inventory Assignments: ${assignments[0].count} records`);
        const transactions = await AppDataSource.query('SELECT COUNT(*) as count FROM inventory_transactions');
        console.log(`\n📝 Inventory Transactions: ${transactions[0].count} records`);
        console.log('\n\n🔍 Testing Service Queries:\n');
        const itemsWithCategory = await AppDataSource.query(`
      SELECT i.id, i.name, i.total_stock, i.available_stock, c.name as category_name
      FROM inventory_items i
      LEFT JOIN inventory_categories c ON i.category_id = c.id
      LIMIT 5
    `);
        console.log('Items with Category (Service Query):');
        console.table(itemsWithCategory);
        const purchasesWithItem = await AppDataSource.query(`
      SELECT p.id, p.vendor_name, p.quantity, p.purchase_date, i.name as item_name
      FROM inventory_purchases p
      LEFT JOIN inventory_items i ON p.item_id = i.id
      ORDER BY p.purchase_date DESC
      LIMIT 5
    `);
        console.log('\nPurchases with Item (Service Query):');
        console.table(purchasesWithItem);
        await AppDataSource.destroy();
        console.log('\n✅ Database check complete!');
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
checkInventoryData();
//# sourceMappingURL=check-inventory-db.js.map