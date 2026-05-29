import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'IT Asset Management',
    synchronize: false,
    entities: [__dirname + '/entities/*.entity{.ts,.js}'],
});

async function addInventoryPermissions() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        // Add permissions using TypeORM
        const permissionRepo = AppDataSource.getRepository('Permission');
        const permissions = [
            { slug: 'inventory-mgmt.view', module: 'Inventory', description: 'View Inventory Management' },
            { slug: 'inventory-mgmt.manage', module: 'Inventory', description: 'Manage Inventory Management' }
        ];

        for (const p of permissions) {
            const exists = await permissionRepo.findOne({ where: { slug: p.slug } });
            if (!exists) {
                await permissionRepo.save(permissionRepo.create(p));
            }
        }
        console.log('✅ Permissions created');

        // Assign to Admin role
        const roleRepo = AppDataSource.getRepository('Role');
        const adminRole: any = await roleRepo.findOne({ 
            where: { name: 'Admin' }, 
            relations: ['permissions'] 
        });

        if (adminRole) {
            const inventoryPerms = await permissionRepo.find({ where: { module: 'Inventory' } });
            
            const existingPermIds = adminRole.permissions.map((p: any) => p.id);
            const newPerms = inventoryPerms.filter((p: any) => !existingPermIds.includes(p.id));
            
            if (newPerms.length > 0) {
                adminRole.permissions = [...adminRole.permissions, ...newPerms];
                await roleRepo.save(adminRole);
            }
        }
        console.log('✅ Permissions assigned to Admin role');

        // Verify
        const updatedAdmin: any = await roleRepo.findOne({ 
            where: { name: 'Admin' }, 
            relations: ['permissions'] 
        });
        
        const result = updatedAdmin?.permissions
            .filter((p: any) => p.module === 'Inventory')
            .map((p: any) => ({
                role: 'Admin',
                permission: p.slug,
                module: p.module
            })) || [];

        console.log('\n📋 Inventory Permissions:');
        console.table(result);

        await AppDataSource.destroy();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

addInventoryPermissions();
