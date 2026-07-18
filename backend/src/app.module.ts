import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
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
import { DashboardWidgetsModule } from './modules/dashboard-widgets/dashboard-widgets.module';
import { LocationsModule } from './modules/locations/locations.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { MasterModule } from './modules/master/master.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

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
import { IntegrationSetting } from './entities/integration-setting.entity';
import { CurrencyRate } from './entities/currency-rate.entity';
import { CurrenciesModule } from './modules/currencies/currencies.module';
import { ValidationModule } from './common/validation/validation.module';
import { ValidationObservation } from './entities/validation-observation.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { NotificationRecipientConfig } from './entities/notification-recipient-config.entity';
import { NotificationTemplate } from './entities/notification-template.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'backend/.env'],
      expandVariables: true,
    }),
    // Global rate limiting, driven by the RATE_LIMIT_* env vars (TTL in seconds)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: parseInt(configService.get('RATE_LIMIT_TTL', '60'), 10) * 1000,
            limit: parseInt(configService.get('RATE_LIMIT_MAX', '300'), 10),
          },
        ],
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow('DB_HOST'),
        port: parseInt(configService.getOrThrow('DB_PORT'), 10),
        username: configService.getOrThrow('DB_USERNAME'),
        password: configService.getOrThrow('DB_PASSWORD'),
        database: configService.getOrThrow('DB_NAME'),
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
          IntegrationSetting,
          CurrencyRate,
          ValidationObservation,
          NotificationLog,
          NotificationRecipientConfig,
          NotificationTemplate,
        ],
        // Schema is managed by migrations (npm run migration:run).
        // DB_SYNCHRONIZE=true is a local-development-only escape hatch and is
        // refused in production by validateEnvironment().
        synchronize: configService.get('DB_SYNCHRONIZE') === 'true',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
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
    DashboardWidgetsModule,
    LocationsModule,
    DepartmentsModule,
    MasterModule,
    AuditLogsModule,
    InventoryManagementModule,
    SettingsModule,
    CurrenciesModule,
    ValidationModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule { }
