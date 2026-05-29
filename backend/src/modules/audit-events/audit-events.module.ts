import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditEventsController } from './audit-events.controller';
import { AuditEventsService } from './audit-events.service';
import { AuditEvent } from '../../entities/audit-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditEvent])],
  controllers: [AuditEventsController],
  providers: [AuditEventsService],
  exports: [AuditEventsService],
})
export class AuditEventsModule {}
