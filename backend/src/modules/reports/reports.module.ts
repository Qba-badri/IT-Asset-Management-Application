import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { StockLedger } from '../../entities/stock-ledger.entity';
import { AuditEvent } from '../../entities/audit-event.entity';
import { Assignment } from '../../entities/assignment.entity';
import { AssetUnit } from '../../entities/asset-unit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockLedger, AuditEvent, Assignment, AssetUnit]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
