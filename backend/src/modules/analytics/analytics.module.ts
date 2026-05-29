import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { DashboardController } from './dashboard.controller';
import { Asset } from '../../entities/asset.entity';
import { StockByLocation } from '../../entities/stock-by-location.entity';
import { CatalogItem } from '../../entities/catalog-item.entity';
import { License } from '../../entities/license.entity';
import { User } from '../../entities/user.entity';
import { AssetUnit } from '../../entities/asset-unit.entity';
import { InventoryItem } from '../../entities/inventory-item.entity';
import { Assignment } from '../../entities/assignment.entity';
import { AssetHistory } from '../../entities/asset-history.entity';
import { StockLedger } from '../../entities/stock-ledger.entity';
import { AuditLog } from '../../entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Asset,
      StockByLocation,
      CatalogItem,
      License,
      User,
      AssetUnit,
      InventoryItem,
      Assignment,
      AssetHistory,
      StockLedger,
      AuditLog,
    ]),
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController, DashboardController],
})
export class AnalyticsModule { }
