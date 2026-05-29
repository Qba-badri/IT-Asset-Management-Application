import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { StockByLocation } from '../../entities/stock-by-location.entity';
import { StockLedger } from '../../entities/stock-ledger.entity';
import { CatalogItem } from '../../entities/catalog-item.entity';
import { Location } from '../../entities/location.entity';
import { AuditEvent } from '../../entities/audit-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StockByLocation,
      StockLedger,
      CatalogItem,
      Location,
      AuditEvent,
    ]),
  ],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
