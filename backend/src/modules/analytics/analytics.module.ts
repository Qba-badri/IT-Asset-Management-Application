/**
 * @file analytics.module.ts
 * @description NestJS module for dashboard analytics.
 *
 * ## Registered Entities
 * All entities required by AnalyticsService must be listed here.
 * If you add a new repository injection to AnalyticsService,
 * add the corresponding entity to the TypeOrmModule.forFeature array.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { DashboardController } from './dashboard.controller';
import { Asset } from '../../entities/asset.entity';
import { AssetUnit } from '../../entities/asset-unit.entity';
import { StockByLocation } from '../../entities/stock-by-location.entity';
import { CatalogItem } from '../../entities/catalog-item.entity';
import { License } from '../../entities/license.entity';
import { User } from '../../entities/user.entity';
import { InventoryItem } from '../../entities/inventory-item.entity';
import { InventoryPurchase } from '../../entities/inventory-purchase.entity';       // KPI 7
import { InventoryTransaction } from '../../entities/inventory-transaction.entity'; // KPI 8
import { Assignment } from '../../entities/assignment.entity';
import { ReturnTransaction } from '../../entities/return-transaction.entity';       // KPI 11, 12
import { InventoryAssignment } from '../../entities/inventory-assignment.entity';   // KPI 9, 10, 11
import { InventoryReturn } from '../../entities/inventory-return.entity';           // KPI 11, 12
import { AssetHistory } from '../../entities/asset-history.entity';
import { StockLedger } from '../../entities/stock-ledger.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { AuditEvent } from '../../entities/audit-event.entity';                     // KPI 20
import { SettingsModule } from '../settings/settings.module';
import { CurrenciesModule } from '../currencies/currencies.module';

@Module({
  imports: [
    SettingsModule,
    CurrenciesModule,
    TypeOrmModule.forFeature([
      Asset,
      AssetUnit,
      StockByLocation,
      CatalogItem,
      License,
      User,
      InventoryItem,
      InventoryPurchase,      // KPI 7 — inventory purchase spend
      InventoryTransaction,   // KPI 8 — inventory turnover
      Assignment,
      ReturnTransaction,      // KPI 11, 12 — return rate & damage
      InventoryAssignment,    // KPI 9, 10, 11 — bulk assignment KPIs
      InventoryReturn,        // KPI 11, 12 — bulk returns & condition
      AssetHistory,
      StockLedger,
      AuditLog,
      AuditEvent,             // KPI 20 — system activity feed
    ]),
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController, DashboardController],
})
export class AnalyticsModule {}
