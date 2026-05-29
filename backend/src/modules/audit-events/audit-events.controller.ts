import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditEventsService, AuditEventQueryDto } from './audit-events.service';

@Controller('api/audit-events')
@UseGuards(JwtAuthGuard)
export class AuditEventsController {
  constructor(private readonly auditEventsService: AuditEventsService) {}

  @Get()
  findAll(@Query() query: AuditEventQueryDto) {
    return this.auditEventsService.findAll(query);
  }

  @Get('my-activity')
  getMyActivity(@Req() req: any) {
    // Return last 10 security-related events for the user
    return this.auditEventsService.findAll({
      actorId: req.user.id,
      limit: 10,
    });
  }

  @Get('entity/:entityType/:entityId')
  getEntityTimeline(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseIntPipe) entityId: number,
  ) {
    return this.auditEventsService.getEntityTimeline(entityType, entityId);
  }
}
