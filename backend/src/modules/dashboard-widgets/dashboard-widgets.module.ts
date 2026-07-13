import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardWidgetsController } from './dashboard-widgets.controller';
import { DashboardWidgetsService } from './dashboard-widgets.service';
import { AssetHistory } from '../../entities/asset-history.entity';
import { LicenseAssignment } from '../../entities/license-assignment.entity';
import { InventoryAssignment } from '../../entities/inventory-assignment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssetHistory, LicenseAssignment, InventoryAssignment]),
  ],
  controllers: [DashboardWidgetsController],
  providers: [DashboardWidgetsService],
})
export class DashboardWidgetsModule {}
