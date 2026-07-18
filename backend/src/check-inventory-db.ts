import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'IT Asset Management',
    synchronize: false,
    entities: [__dirname + '/entities/*.entity{.ts,.js}'],
});

async function checkInventoryData() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected\n');

        // Check inventory_items
        const itemsCount = await AppDataSource.getRepository('InventoryItem').count();
        console.log(`📦 Inventory Items: ${itemsCount} records`);

        if (itemsCount > 0) {
            const sampleItems = await AppDataSource.getRepository('InventoryItem').find({
                select: ['id', 'name', 'totalStock', 'availableStock'],
                take: 5
            });
            console.log('\nSample Items:');
            console.table(sampleItems);
        }

        // Check inventory_purchases
        const purchasesCount = await AppDataSource.getRepository('InventoryPurchase').count();
        console.log(`\n🛒 Inventory Purchases: ${purchasesCount} records`);

        if (purchasesCount > 0) {
            const samplePurchases = await AppDataSource.getRepository('InventoryPurchase').find({
                select: ['id', 'vendorName', 'quantity', 'purchaseDate'],
                take: 5
            });
            console.log('\nSample Purchases:');
            console.table(samplePurchases);
        }

        // Check inventory_categories
        const categoriesCount = await AppDataSource.getRepository('InventoryCategory').count();
        console.log(`\n📁 Inventory Categories: ${categoriesCount} records`);

        // Check inventory_assignments
        const assignmentsCount = await AppDataSource.getRepository('InventoryAssignment').count();
        console.log(`\n👥 Inventory Assignments: ${assignmentsCount} records`);

        // Check inventory_transactions
        const transactionsCount = await AppDataSource.getRepository('InventoryTransaction').count();
        console.log(`\n📝 Inventory Transactions: ${transactionsCount} records`);

        // Test the actual query the service uses
        console.log('\n\n🔍 Testing Service Queries:\n');

        const itemsWithCategory = await AppDataSource.getRepository('InventoryItem')
            .createQueryBuilder('i')
            .leftJoinAndSelect('i.category', 'c')
            .select(['i.id', 'i.name', 'i.totalStock', 'i.availableStock', 'c.name'])
            .take(5)
            .getMany();
        
        const mappedItemsWithCategory = itemsWithCategory.map((item: any) => ({
            id: item.id,
            name: item.name,
            total_stock: item.totalStock,
            available_stock: item.availableStock,
            category_name: item.category?.name
        }));
        console.log('Items with Category (Service Query):');
        console.table(mappedItemsWithCategory);

        const purchasesWithItem = await AppDataSource.getRepository('InventoryPurchase')
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.item', 'i')
            .select(['p.id', 'p.vendorName', 'p.quantity', 'p.purchaseDate', 'i.name'])
            .orderBy('p.purchaseDate', 'DESC')
            .take(5)
            .getMany();
            
        const mappedPurchasesWithItem = purchasesWithItem.map((purchase: any) => ({
            id: purchase.id,
            vendor_name: purchase.vendorName,
            quantity: purchase.quantity,
            purchase_date: purchase.purchaseDate,
            item_name: purchase.item?.name
        }));
        console.log('\nPurchases with Item (Service Query):');
        console.table(mappedPurchasesWithItem);

        await AppDataSource.destroy();
        console.log('\n✅ Database check complete!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkInventoryData();
