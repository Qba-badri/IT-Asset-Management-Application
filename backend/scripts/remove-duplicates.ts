import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'it_asset_management',
});

async function removeDuplicates() {
    try {
        await AppDataSource.initialize();
        console.log('Database connection established');

        const queryRunner = AppDataSource.createQueryRunner();

        // 1. Find and remove duplicate inventory items
        console.log('\n=== Checking for duplicate inventory items ===');
        const duplicateItems = await queryRunner.query(`
            SELECT name, COUNT(*) as count 
            FROM inventory_items 
            WHERE deleted_at IS NULL
            GROUP BY name 
            HAVING COUNT(*) > 1
        `);

        if (duplicateItems.length > 0) {
            console.log('Found duplicate items:', duplicateItems);

            const deleteResult = await queryRunner.query(`
                DELETE FROM inventory_items
                WHERE id NOT IN (
                    SELECT MIN(id)
                    FROM inventory_items
                    WHERE deleted_at IS NULL
                    GROUP BY name
                )
                AND deleted_at IS NULL
            `);
            console.log(`Removed ${deleteResult[1]} duplicate item records`);
        } else {
            console.log('No duplicate items found');
        }

        // 2. Find and remove duplicate categories
        console.log('\n=== Checking for duplicate categories ===');
        const duplicateCategories = await queryRunner.query(`
            SELECT name, COUNT(*) as count 
            FROM inventory_categories 
            GROUP BY name 
            HAVING COUNT(*) > 1
        `);

        if (duplicateCategories.length > 0) {
            console.log('Found duplicate categories:', duplicateCategories);

            const deleteResult = await queryRunner.query(`
                DELETE FROM inventory_categories
                WHERE id NOT IN (
                    SELECT MIN(id)
                    FROM inventory_categories
                    GROUP BY name
                )
            `);
            console.log(`Removed ${deleteResult[1]} duplicate category records`);
        } else {
            console.log('No duplicate categories found');
        }

        // 3. Find and remove duplicate purchases
        console.log('\n=== Checking for duplicate purchases ===');
        const duplicatePurchases = await queryRunner.query(`
            SELECT invoice_number, item_id, COUNT(*) as count 
            FROM inventory_purchases 
            WHERE invoice_number IS NOT NULL
            GROUP BY invoice_number, item_id 
            HAVING COUNT(*) > 1
        `);

        if (duplicatePurchases.length > 0) {
            console.log('Found duplicate purchases:', duplicatePurchases);

            const deleteResult = await queryRunner.query(`
                DELETE FROM inventory_purchases
                WHERE id NOT IN (
                    SELECT MIN(id)
                    FROM inventory_purchases
                    WHERE invoice_number IS NOT NULL
                    GROUP BY invoice_number, item_id
                )
                AND invoice_number IS NOT NULL
            `);
            console.log(`Removed ${deleteResult[1]} duplicate purchase records`);
        } else {
            console.log('No duplicate purchases found');
        }

        // 4. Summary
        console.log('\n=== Summary ===');
        const summary = await queryRunner.query(`
            SELECT 'Items' as table_name, COUNT(*) as total_records FROM inventory_items WHERE deleted_at IS NULL
            UNION ALL
            SELECT 'Categories', COUNT(*) FROM inventory_categories
            UNION ALL
            SELECT 'Purchases', COUNT(*) FROM inventory_purchases
            UNION ALL
            SELECT 'Assignments', COUNT(*) FROM inventory_assignments
        `);
        console.table(summary);

        await queryRunner.release();
        await AppDataSource.destroy();

        console.log('\n✅ Duplicate removal completed successfully!');
    } catch (error) {
        console.error('❌ Error removing duplicates:', error);
        process.exit(1);
    }
}

removeDuplicates();
