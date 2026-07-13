import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { RbacModule } from './modules/rbac/rbac.module';

import { UsersModule } from './modules/users/users.module';
import { AssetsModule } from './modules/assets/assets.module';
import { LicensesModule } from './modules/licenses/licenses.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CategoriesModule } from './modules/categories/categories.module';

// New domain modules
import { CatalogModule } from './modules/catalog/catalog.module';
import { AssetUnitsModule } from './modules/asset-units/asset-units.module';
import { StockModule } from './modules/stock/stock.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { AuditEventsModule } from './modules/audit-events/audit-events.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditReportModule } from './modules/audit-report/audit-report.module';
import { LocationsModule } from './modules/locations/locations.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { MasterModule } from './modules/master/master.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { SettingsModule } from './modules/settings/settings.module';

// Existing entities
import { User } from './entities/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { Asset } from './entities/asset.entity';
import { AssetHistory } from './entities/asset-history.entity';
import { AssetPhoto } from './entities/asset-photo.entity';
import { License } from './entities/license.entity';
import { LicenseAssignment } from './entities/license-assignment.entity';
import { LicenseRenewal } from './entities/license-renewal.entity';
import { LicensePlan } from './entities/license-plan.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import {
  InventoryAudit,
  InventoryAuditDetail,
} from './entities/inventory-audit.entity';
import { Category } from './entities/category.entity';

// New domain entities
import { CatalogItem } from './entities/catalog-item.entity';
import { AssetUnit } from './entities/asset-unit.entity';
import { StockByLocation } from './entities/stock-by-location.entity';
import { StockLedger } from './entities/stock-ledger.entity';
import { Assignment } from './entities/assignment.entity';
import { ReturnTransaction } from './entities/return-transaction.entity';
import { AuditEvent } from './entities/audit-event.entity';
import { Location } from './entities/location.entity';
import { Department } from './entities/department.entity';
import { Brand } from './entities/brand.entity';
import { Vendor } from './entities/vendor.entity';
import { Lookup } from './entities/lookup.entity';
import { LicenseHistory } from './entities/license-history.entity';
import { InventoryManagementModule } from './modules/consumable-inventory/inventory-mgmt.module';
import { InventoryCategory } from './entities/inventory-category.entity';
import { InventoryPurchase } from './entities/inventory-purchase.entity';
import { InventoryAssignment } from './entities/inventory-assignment.entity';
import { InventoryReturn } from './entities/inventory-return.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { SystemSetting } from './entities/system-setting.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'backend/.env'],
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: parseInt(configService.get('DB_PORT', '5432'), 10),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'IT Asset Management'),
        entities: [
          User,
          PasswordResetToken,
          AuditLog,
          Role,
          Permission,
          Asset,
          AssetHistory,
          AssetPhoto,
          License,
          LicenseAssignment,
          LicenseRenewal,
          LicensePlan,
          InventoryItem,
          InventoryAudit,
          InventoryAuditDetail,
          Category,
          // New domain entities
          CatalogItem,
          AssetUnit,
          StockByLocation,
          StockLedger,
          Assignment,
          ReturnTransaction,
          AuditEvent,
          Location,
          Department,
          Brand,
          Vendor,
          Lookup,
          LicenseHistory,
          InventoryCategory,
          InventoryPurchase,
          InventoryAssignment,
          InventoryReturn,
          InventoryTransaction,
          SystemSetting,
        ],
        synchronize: true,
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    RbacModule,
    UsersModule,
    AssetsModule,
    LicensesModule,
    AnalyticsModule,
    CategoriesModule,
    // New domain modules
    CatalogModule,
    AssetUnitsModule,
    StockModule,
    AssignmentsModule,
    AuditEventsModule,
    ReportsModule,
    AuditReportModule,
    LocationsModule,
    DepartmentsModule,
    MasterModule,
    AuditLogsModule,
    InventoryManagementModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
