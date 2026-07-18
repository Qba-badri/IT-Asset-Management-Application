import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { Asset, AssetStatus, AssetCondition, AssetCategory, AcquisitionType } from './entities/asset.entity';
import { License } from './entities/license.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Brand } from './entities/brand.entity';
import { Vendor } from './entities/vendor.entity';
import { Category } from './entities/category.entity';
import { Department } from './entities/department.entity';
import { Location } from './entities/location.entity';
import { AssetPhoto } from './entities/asset-photo.entity';
import { AssetHistory } from './entities/asset-history.entity';
import { Assignment } from './entities/assignment.entity';
import { LicenseAssignment } from './entities/license-assignment.entity';
import { LicenseRenewal } from './entities/license-renewal.entity';
import { LicensePlan } from './entities/license-plan.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { Lookup } from './entities/lookup.entity';
import { CatalogItem, ReturnPolicy, TrackMode } from './entities/catalog-item.entity';
import { AssetUnit } from './entities/asset-unit.entity';
import { InventoryAudit, InventoryAuditDetail } from './entities/inventory-audit.entity';
import { StockByLocation } from './entities/stock-by-location.entity';
import { StockLedger } from './entities/stock-ledger.entity';
import { ReturnTransaction } from './entities/return-transaction.entity';
import { AuditEvent } from './entities/audit-event.entity';
import { LicenseHistory } from './entities/license-history.entity';
import { InventoryCategory } from './entities/inventory-category.entity';
import { InventoryPurchase } from './entities/inventory-purchase.entity';
import { InventoryAssignment } from './entities/inventory-assignment.entity';
import { InventoryReturn } from './entities/inventory-return.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';

dotenv.config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'IT Asset Management',
    entities: [
        User, Role, Permission, PasswordResetToken,
        Asset, AssetPhoto, AssetHistory, Assignment,
        License, LicenseAssignment, LicenseRenewal, LicensePlan,
        InventoryItem, AuditLog, Brand, Vendor, Category, Department, Location,
        Lookup, CatalogItem,
        InventoryAudit, InventoryAuditDetail, StockByLocation, StockLedger, AssetUnit,
        ReturnTransaction, AuditEvent, LicenseHistory,
        InventoryCategory, InventoryPurchase, InventoryAssignment, InventoryReturn, InventoryTransaction
    ],
});

async function clearData() {
    try {
        await AppDataSource.initialize();
        console.log('🔗 Database connected for data clearance.');

        // Entities that hold configuration/master data (to be kept)
        // These are the actual table names as TypeORM generates them.
        const configEntities = [
            'users', 'roles', 'permissions', 'role_permissions', 
            'brands', 'vendors', 'categories', 'departments', 'locations', 
            'lookups', 'catalog_items', 'inventory_categories', 'system_settings'
        ];

        const entitiesToClear = AppDataSource.entityMetadatas.filter(e => !configEntities.includes(e.tableName));
        
        for (const entity of entitiesToClear) {
            console.log(`Clearing table: ${entity.tableName}...`);
            await AppDataSource.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE`);
        }

        console.log('✅ Operational data cleared successfully! Configuration details remain.');
    } catch (error) {
        console.error('❌ Error clearing data:', error);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

clearData();
