import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from '../../entities/brand.entity';
import { Vendor } from '../../entities/vendor.entity';
import { Lookup } from '../../entities/lookup.entity';
import { LicensePlan } from '../../entities/license-plan.entity';
import { MasterController } from './master.controller';
import { MasterService } from './master.service';
import { AuditEventsModule } from '../audit-events/audit-events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Brand, Vendor, Lookup, LicensePlan]),
    AuditEventsModule,
  ],
  controllers: [MasterController],
  providers: [MasterService],
  exports: [MasterService],
})
export class MasterModule { }
