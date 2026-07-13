import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditReportController } from './audit-report.controller';
import { AuditReportService } from './audit-report.service';
import { AuditEvent } from '../../entities/audit-event.entity';
import { LicenseHistory } from '../../entities/license-history.entity';
import { InventoryTransaction } from '../../entities/inventory-transaction.entity';
import { Asset } from '../../entities/asset.entity';
import { InventoryAssignment } from '../../entities/inventory-assignment.entity';
import { InventoryReturn } from '../../entities/inventory-return.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditEvent, LicenseHistory, InventoryTransaction, Asset, InventoryAssignment, InventoryReturn]),
  ],
  controllers: [AuditReportController],
  providers: [AuditReportService],
})
export class AuditReportModule {}
