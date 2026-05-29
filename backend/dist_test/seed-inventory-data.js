"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
const inventory_category_entity_1 = require("./entities/inventory-category.entity");
const inventory_item_entity_1 = require("./entities/inventory-item.entity");
const inventory_purchase_entity_1 = require("./entities/inventory-purchase.entity");
const inventory_assignment_entity_1 = require("./entities/inventory-assignment.entity");
const inventory_return_entity_1 = require("./entities/inventory-return.entity");
const inventory_transaction_entity_1 = require("./entities/inventory-transaction.entity");
const user_entity_1 = require("./entities/user.entity");
(0, dotenv_1.config)();
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'it_asset_db',
    entities: [__dirname + '/entities/*.entity{.ts,.js}'],
    synchronize: false,
});
async function seedInventoryData() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected');
        const categoryRepo = AppDataSource.getRepository(inventory_category_entity_1.InventoryCategory);
        const itemRepo = AppDataSource.getRepository(inventory_item_entity_1.InventoryItem);
        const purchaseRepo = AppDataSource.getRepository(inventory_purchase_entity_1.InventoryPurchase);
        const assignmentRepo = AppDataSource.getRepository(inventory_assignment_entity_1.InventoryAssignment);
        const returnRepo = AppDataSource.getRepository(inventory_return_entity_1.InventoryReturn);
        const transactionRepo = AppDataSource.getRepository(inventory_transaction_entity_1.InventoryTransaction);
        const userRepo = AppDataSource.getRepository(user_entity_1.User);
        const users = await userRepo.find({ take: 10 });
        if (users.length === 0) {
            console.error('❌ No users found. Please seed users first.');
            process.exit(1);
        }
        console.log(`✅ Found ${users.length} users for assignments`);
        console.log('\n📦 Seeding Inventory Categories...');
        const categoryData = [
            { name: 'Batteries', description: 'Rechargeable and disposable batteries for various devices' },
            { name: 'Cables & Adapters', description: 'USB cables, HDMI cables, power adapters, and converters' },
            { name: 'Audio Accessories', description: 'Headphones, earbuds, microphones, and audio equipment' },
            { name: 'Computer Bags', description: 'Laptop bags, backpacks, and protective cases' },
            { name: 'Input Devices', description: 'Mice, keyboards, and other input peripherals' },
            { name: 'Storage Media', description: 'USB drives, external HDDs, SD cards' },
            { name: 'Office Supplies', description: 'Stationery and desk accessories for IT staff' },
            { name: 'Cleaning Supplies', description: 'Screen cleaners, compressed air, cleaning kits' },
        ];
        const categories = [];
        for (const data of categoryData) {
            const existing = await categoryRepo.findOne({ where: { name: data.name } });
            if (!existing) {
                const category = categoryRepo.create(data);
                await categoryRepo.save(category);
                categories.push(category);
                console.log(`  ✓ Created category: ${data.name}`);
            }
            else {
                categories.push(existing);
                console.log(`  ⊙ Category exists: ${data.name}`);
            }
        }
        console.log('\n📋 Seeding Inventory Items...');
        const itemsData = [
            { name: 'AA Alkaline Battery (4-pack)', categoryId: categories[0].id, isRefundable: false, minStockLevel: 20 },
            { name: 'AAA Alkaline Battery (4-pack)', categoryId: categories[0].id, isRefundable: false, minStockLevel: 15 },
            { name: 'Laptop Battery - Dell', categoryId: categories[0].id, isRefundable: true, minStockLevel: 5 },
            { name: 'USB-C to USB-A Cable (1m)', categoryId: categories[1].id, isRefundable: true, minStockLevel: 10 },
            { name: 'HDMI Cable (2m)', categoryId: categories[1].id, isRefundable: true, minStockLevel: 8 },
            { name: 'VGA Cable (1.5m)', categoryId: categories[1].id, isRefundable: true, minStockLevel: 5 },
            { name: 'USB-C Power Adapter 65W', categoryId: categories[1].id, isRefundable: true, minStockLevel: 6 },
            { name: 'Ethernet Cable Cat6 (3m)', categoryId: categories[1].id, isRefundable: true, minStockLevel: 12 },
            { name: 'Wired Headphones with Mic', categoryId: categories[2].id, isRefundable: true, minStockLevel: 10 },
            { name: 'USB Conference Microphone', categoryId: categories[2].id, isRefundable: true, minStockLevel: 3 },
            { name: 'Earbuds - Basic', categoryId: categories[2].id, isRefundable: false, minStockLevel: 15 },
            { name: 'Laptop Backpack 15.6"', categoryId: categories[3].id, isRefundable: true, minStockLevel: 8 },
            { name: 'Laptop Sleeve 13"', categoryId: categories[3].id, isRefundable: true, minStockLevel: 10 },
            { name: 'Wireless Mouse - Logitech', categoryId: categories[4].id, isRefundable: true, minStockLevel: 12 },
            { name: 'USB Wired Mouse', categoryId: categories[4].id, isRefundable: true, minStockLevel: 15 },
            { name: 'Wireless Keyboard', categoryId: categories[4].id, isRefundable: true, minStockLevel: 8 },
            { name: 'Numeric Keypad - USB', categoryId: categories[4].id, isRefundable: true, minStockLevel: 5 },
            { name: 'USB Flash Drive 32GB', categoryId: categories[5].id, isRefundable: true, minStockLevel: 20 },
            { name: 'USB Flash Drive 64GB', categoryId: categories[5].id, isRefundable: true, minStockLevel: 10 },
            { name: 'External HDD 1TB', categoryId: categories[5].id, isRefundable: true, minStockLevel: 5 },
            { name: 'Sticky Notes Pack', categoryId: categories[6].id, isRefundable: false, minStockLevel: 25 },
            { name: 'Whiteboard Markers (Set of 4)', categoryId: categories[6].id, isRefundable: false, minStockLevel: 10 },
            { name: 'Screen Cleaning Kit', categoryId: categories[7].id, isRefundable: false, minStockLevel: 8 },
            { name: 'Compressed Air Can', categoryId: categories[7].id, isRefundable: false, minStockLevel: 12 },
        ];
        const items = [];
        for (const data of itemsData) {
            const item = itemRepo.create({
                ...data,
                totalStock: 0,
                availableStock: 0,
                status: 'active',
                vendor: null,
                supplier: null,
            });
            await itemRepo.save(item);
            items.push(item);
            console.log(`  ✓ Created item: ${data.name}`);
        }
        console.log('\n🛒 Seeding Inventory Purchases...');
        const vendors = ['TechSupply Co.', 'Office Depot', 'Amazon Business', 'Dell Direct', 'Logitech Store', 'Best Buy Business'];
        const purchasesData = [
            { itemIdx: 0, qty: 100, unitCost: 4.99, vendor: vendors[0], date: '2025-12-01' },
            { itemIdx: 1, qty: 80, unitCost: 4.99, vendor: vendors[0], date: '2025-12-01' },
            { itemIdx: 3, qty: 50, unitCost: 8.99, vendor: vendors[2], date: '2025-12-05' },
            { itemIdx: 4, qty: 40, unitCost: 12.99, vendor: vendors[2], date: '2025-12-05' },
            { itemIdx: 7, qty: 60, unitCost: 6.50, vendor: vendors[1], date: '2025-12-10' },
            { itemIdx: 8, qty: 45, unitCost: 15.99, vendor: vendors[4], date: '2025-12-12' },
            { itemIdx: 10, qty: 70, unitCost: 3.50, vendor: vendors[1], date: '2025-12-15' },
            { itemIdx: 13, qty: 50, unitCost: 18.99, vendor: vendors[4], date: '2025-12-18' },
            { itemIdx: 14, qty: 60, unitCost: 12.50, vendor: vendors[1], date: '2025-12-20' },
            { itemIdx: 17, qty: 100, unitCost: 9.99, vendor: vendors[2], date: '2025-12-22' },
            { itemIdx: 20, qty: 50, unitCost: 2.99, vendor: vendors[1], date: '2025-12-25' },
            { itemIdx: 2, qty: 15, unitCost: 45.00, vendor: vendors[3], date: '2026-01-02' },
            { itemIdx: 5, qty: 20, unitCost: 7.50, vendor: vendors[2], date: '2026-01-05' },
            { itemIdx: 6, qty: 18, unitCost: 35.00, vendor: vendors[3], date: '2026-01-08' },
            { itemIdx: 9, qty: 12, unitCost: 89.99, vendor: vendors[4], date: '2026-01-10' },
            { itemIdx: 11, qty: 25, unitCost: 28.99, vendor: vendors[2], date: '2026-01-12' },
            { itemIdx: 12, qty: 30, unitCost: 12.99, vendor: vendors[1], date: '2026-01-15' },
            { itemIdx: 15, qty: 22, unitCost: 24.99, vendor: vendors[4], date: '2026-01-18' },
            { itemIdx: 16, qty: 15, unitCost: 18.50, vendor: vendors[4], date: '2026-01-20' },
            { itemIdx: 18, qty: 35, unitCost: 15.99, vendor: vendors[2], date: '2026-01-22' },
            { itemIdx: 19, qty: 8, unitCost: 65.00, vendor: vendors[3], date: '2026-01-25' },
            { itemIdx: 21, qty: 12, unitCost: 4.50, vendor: vendors[1], date: '2026-01-28' },
            { itemIdx: 22, qty: 10, unitCost: 12.99, vendor: vendors[1], date: '2026-02-01' },
            { itemIdx: 23, qty: 15, unitCost: 8.99, vendor: vendors[1], date: '2026-02-03' },
            { itemIdx: 0, qty: 50, unitCost: 4.99, vendor: vendors[0], date: '2026-02-10' },
            { itemIdx: 3, qty: 30, unitCost: 8.99, vendor: vendors[2], date: '2026-02-12' },
            { itemIdx: 13, qty: 25, unitCost: 18.99, vendor: vendors[4], date: '2026-02-14' },
            { itemIdx: 17, qty: 40, unitCost: 9.99, vendor: vendors[2], date: '2026-02-15' },
        ];
        const purchases = [];
        for (const data of purchasesData) {
            const item = items[data.itemIdx];
            const totalCost = data.qty * data.unitCost;
            const purchase = purchaseRepo.create({
                itemId: item.id,
                vendorName: data.vendor,
                invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                purchaseDate: new Date(data.date),
                quantity: data.qty,
                unitCost: data.unitCost,
                totalCost: totalCost,
                remarks: `Bulk purchase for ${item.name}`,
            });
            await purchaseRepo.save(purchase);
            purchases.push(purchase);
            item.totalStock += data.qty;
            item.availableStock += data.qty;
            await itemRepo.save(item);
            const transaction = transactionRepo.create({
                itemId: item.id,
                type: inventory_transaction_entity_1.InventoryTransactionType.IN,
                quantity: data.qty,
                referenceId: purchase.id,
                referenceType: 'purchase',
                transactionDate: new Date(data.date),
                performedById: users[0].id,
                notes: `Purchase from ${data.vendor}`,
            });
            await transactionRepo.save(transaction);
            console.log(`  ✓ Purchase: ${data.qty}x ${item.name} from ${data.vendor}`);
        }
        console.log('\n👥 Seeding Inventory Assignments...');
        const departments = ['IT', 'Engineering', 'Sales', 'Marketing', 'HR', 'Finance'];
        const assignmentsData = [
            { itemIdx: 2, userIdx: 0, qty: 1, dept: 'IT', daysAgo: 30, returned: false },
            { itemIdx: 3, userIdx: 1, qty: 2, dept: 'Engineering', daysAgo: 25, returned: false },
            { itemIdx: 4, userIdx: 2, qty: 1, dept: 'Sales', daysAgo: 20, returned: false },
            { itemIdx: 6, userIdx: 3, qty: 1, dept: 'IT', daysAgo: 18, returned: false },
            { itemIdx: 8, userIdx: 4, qty: 1, dept: 'Marketing', daysAgo: 15, returned: false },
            { itemIdx: 9, userIdx: 5, qty: 1, dept: 'IT', daysAgo: 12, returned: false },
            { itemIdx: 11, userIdx: 6, qty: 1, dept: 'Sales', daysAgo: 10, returned: false },
            { itemIdx: 13, userIdx: 7, qty: 2, dept: 'Engineering', daysAgo: 8, returned: false },
            { itemIdx: 14, userIdx: 0, qty: 1, dept: 'IT', daysAgo: 7, returned: false },
            { itemIdx: 15, userIdx: 1, qty: 1, dept: 'Finance', daysAgo: 5, returned: false },
            { itemIdx: 17, userIdx: 2, qty: 3, dept: 'IT', daysAgo: 4, returned: false },
            { itemIdx: 18, userIdx: 3, qty: 2, dept: 'Engineering', daysAgo: 3, returned: false },
            { itemIdx: 19, userIdx: 4, qty: 1, dept: 'Sales', daysAgo: 2, returned: false },
            { itemIdx: 3, userIdx: 5, qty: 1, dept: 'IT', daysAgo: 60, returned: true, returnDaysAgo: 30 },
            { itemIdx: 4, userIdx: 6, qty: 1, dept: 'Marketing', daysAgo: 55, returned: true, returnDaysAgo: 25 },
            { itemIdx: 8, userIdx: 7, qty: 1, dept: 'Sales', daysAgo: 50, returned: true, returnDaysAgo: 20 },
            { itemIdx: 11, userIdx: 0, qty: 1, dept: 'IT', daysAgo: 45, returned: true, returnDaysAgo: 15 },
            { itemIdx: 13, userIdx: 1, qty: 1, dept: 'Engineering', daysAgo: 40, returned: true, returnDaysAgo: 10 },
            { itemIdx: 14, userIdx: 2, qty: 2, dept: 'IT', daysAgo: 35, returned: true, returnDaysAgo: 8 },
            { itemIdx: 17, userIdx: 3, qty: 2, dept: 'Sales', daysAgo: 30, returned: true, returnDaysAgo: 5 },
            { itemIdx: 5, userIdx: 4, qty: 1, dept: 'Marketing', daysAgo: 50, returned: true, returnDaysAgo: 10, damaged: true },
            { itemIdx: 7, userIdx: 5, qty: 2, dept: 'IT', daysAgo: 45, returned: true, returnDaysAgo: 8, damaged: true },
            { itemIdx: 0, userIdx: 6, qty: 4, dept: 'IT', daysAgo: 20, returned: false },
            { itemIdx: 1, userIdx: 7, qty: 4, dept: 'Engineering', daysAgo: 18, returned: false },
            { itemIdx: 10, userIdx: 0, qty: 1, dept: 'Sales', daysAgo: 15, returned: false },
            { itemIdx: 20, userIdx: 1, qty: 5, dept: 'IT', daysAgo: 12, returned: false },
            { itemIdx: 21, userIdx: 2, qty: 2, dept: 'Marketing', daysAgo: 10, returned: false },
            { itemIdx: 22, userIdx: 3, qty: 1, dept: 'IT', daysAgo: 8, returned: false },
            { itemIdx: 23, userIdx: 4, qty: 2, dept: 'Engineering', daysAgo: 5, returned: false },
            { itemIdx: 12, userIdx: 5, qty: 1, dept: 'Sales', daysAgo: 90, returned: false, overdue: true },
            { itemIdx: 16, userIdx: 6, qty: 1, dept: 'IT', daysAgo: 85, returned: false, overdue: true },
        ];
        const assignments = [];
        for (const data of assignmentsData) {
            const item = items[data.itemIdx];
            const user = users[data.userIdx % users.length];
            const assignmentDate = new Date();
            assignmentDate.setDate(assignmentDate.getDate() - data.daysAgo);
            let expectedReturnDate = null;
            if (item.isRefundable) {
                expectedReturnDate = new Date(assignmentDate);
                if (data.overdue) {
                    expectedReturnDate.setDate(expectedReturnDate.getDate() + 30);
                }
                else {
                    expectedReturnDate.setDate(expectedReturnDate.getDate() + 60);
                }
            }
            const assignment = assignmentRepo.create({
                userId: user.id,
                itemId: item.id,
                quantity: data.qty,
                department: data.dept,
                assignmentDate: assignmentDate,
                expectedReturnDate: expectedReturnDate,
                status: data.returned ? inventory_assignment_entity_1.InventoryAssignmentStatus.RETURNED : inventory_assignment_entity_1.InventoryAssignmentStatus.ASSIGNED,
            });
            await assignmentRepo.save(assignment);
            assignments.push(assignment);
            item.availableStock -= data.qty;
            await itemRepo.save(item);
            const transaction = transactionRepo.create({
                itemId: item.id,
                type: inventory_transaction_entity_1.InventoryTransactionType.OUT,
                quantity: data.qty,
                referenceId: assignment.id,
                referenceType: 'assignment',
                transactionDate: assignmentDate,
                performedById: users[0].id,
                notes: `Assigned to ${user.firstName} ${user.lastName} (${data.dept})`,
            });
            await transactionRepo.save(transaction);
            console.log(`  ✓ Assignment: ${data.qty}x ${item.name} to ${user.firstName} ${user.lastName}`);
            if (data.returned) {
                const returnDate = new Date();
                returnDate.setDate(returnDate.getDate() - (data.returnDaysAgo || 0));
                const condition = data.damaged ? 'damaged' : 'good';
                const returnRecord = returnRepo.create({
                    assignmentId: assignment.id,
                    itemId: item.id,
                    returnDate: returnDate,
                    condition: condition,
                    approvedById: users[0].id,
                    remarks: data.damaged ? 'Item returned with physical damage' : 'Item returned in good condition',
                });
                await returnRepo.save(returnRecord);
                if (!data.damaged && item.isRefundable) {
                    item.availableStock += data.qty;
                    await itemRepo.save(item);
                }
                const returnTransaction = transactionRepo.create({
                    itemId: item.id,
                    type: inventory_transaction_entity_1.InventoryTransactionType.RETURN,
                    quantity: data.qty,
                    referenceId: returnRecord.id,
                    referenceType: 'return',
                    transactionDate: returnDate,
                    performedById: user.id,
                    notes: `Returned by ${user.firstName} ${user.lastName} - Condition: ${condition}`,
                });
                await transactionRepo.save(returnTransaction);
                console.log(`    ↩ Return: ${data.qty}x ${item.name} - ${condition}`);
            }
        }
        console.log('\n⚙️  Creating Stock Adjustments...');
        const adjustments = [
            { itemIdx: 0, qty: -5, reason: 'Damaged during storage' },
            { itemIdx: 17, qty: -3, reason: 'Lost items during inventory count' },
            { itemIdx: 10, qty: 10, reason: 'Found additional stock in warehouse' },
        ];
        for (const adj of adjustments) {
            const item = items[adj.itemIdx];
            item.totalStock += adj.qty;
            item.availableStock += adj.qty;
            await itemRepo.save(item);
            const transaction = transactionRepo.create({
                itemId: item.id,
                type: inventory_transaction_entity_1.InventoryTransactionType.ADJUSTMENT,
                quantity: Math.abs(adj.qty),
                referenceType: 'manual',
                transactionDate: new Date(),
                performedById: users[0].id,
                notes: adj.reason,
            });
            await transactionRepo.save(transaction);
            console.log(`  ✓ Adjustment: ${adj.qty > 0 ? '+' : ''}${adj.qty}x ${item.name} - ${adj.reason}`);
        }
        console.log('\n\n📊 FINAL STOCK SUMMARY');
        console.log('═══════════════════════════════════════════════════════════════════════════');
        console.log('Item Name'.padEnd(40) + 'Total'.padEnd(10) + 'Available'.padEnd(12) + 'Min'.padEnd(8) + 'Status');
        console.log('───────────────────────────────────────────────────────────────────────────');
        const finalItems = await itemRepo.find({ order: { name: 'ASC' } });
        let lowStockCount = 0;
        for (const item of finalItems) {
            const isLowStock = item.availableStock <= item.minStockLevel;
            if (isLowStock)
                lowStockCount++;
            const status = isLowStock ? '⚠️  LOW STOCK' : '✓ OK';
            console.log(item.name.padEnd(40) +
                item.totalStock.toString().padEnd(10) +
                item.availableStock.toString().padEnd(12) +
                item.minStockLevel.toString().padEnd(8) +
                status);
        }
        console.log('═══════════════════════════════════════════════════════════════════════════');
        console.log(`\n⚠️  Low Stock Alerts: ${lowStockCount} items`);
        console.log('\n\n🔍 VALIDATION SUMMARY');
        console.log('═══════════════════════════════════════════════════════════════════════════');
        const totalCategories = await categoryRepo.count();
        const totalItems = await itemRepo.count();
        const totalPurchases = await purchaseRepo.count();
        const totalAssignments = await assignmentRepo.count();
        const totalReturns = await returnRepo.count();
        const totalTransactions = await transactionRepo.count();
        const activeAssignments = await assignmentRepo.count({ where: { status: inventory_assignment_entity_1.InventoryAssignmentStatus.ASSIGNED } });
        const returnedAssignments = await assignmentRepo.count({ where: { status: inventory_assignment_entity_1.InventoryAssignmentStatus.RETURNED } });
        console.log(`Categories Created:      ${totalCategories}`);
        console.log(`Items Created:           ${totalItems}`);
        console.log(`Purchases Recorded:      ${totalPurchases}`);
        console.log(`Total Assignments:       ${totalAssignments}`);
        console.log(`  - Active:              ${activeAssignments}`);
        console.log(`  - Returned:            ${returnedAssignments}`);
        console.log(`Returns Processed:       ${totalReturns}`);
        console.log(`Transaction Entries:     ${totalTransactions}`);
        console.log(`Low Stock Items:         ${lowStockCount}`);
        console.log('\n✅ Inventory data seeding completed successfully!');
        console.log('\n💡 TIP: Run the following SQL to verify stock consistency:');
        console.log(`
    SELECT 
      ii.name,
      ii.total_stock,
      ii.available_stock,
      (SELECT COALESCE(SUM(quantity), 0) FROM inventory_purchases WHERE item_id = ii.id) as total_purchased,
      (SELECT COALESCE(SUM(quantity), 0) FROM inventory_assignments WHERE item_id = ii.id AND status = 'assigned') as total_assigned
    FROM inventory_items ii
    ORDER BY ii.name;
    `);
        await AppDataSource.destroy();
    }
    catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}
seedInventoryData();
//# sourceMappingURL=seed-inventory-data.js.map