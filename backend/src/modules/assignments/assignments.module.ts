import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { Assignment } from '../../entities/assignment.entity';
import { ReturnTransaction } from '../../entities/return-transaction.entity';
import { CatalogItem } from '../../entities/catalog-item.entity';
import { AssetUnit } from '../../entities/asset-unit.entity';
import { StockByLocation } from '../../entities/stock-by-location.entity';
import { StockLedger } from '../../entities/stock-ledger.entity';
import { AuditEvent } from '../../entities/audit-event.entity';
import { User } from '../../entities/user.entity';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Assignment,
      ReturnTransaction,
      CatalogItem,
      AssetUnit,
      StockByLocation,
      StockLedger,
      AuditEvent,
      User,
    ]),
    StockModule,
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
