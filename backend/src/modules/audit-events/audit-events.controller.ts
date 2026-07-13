import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuditEventsService, AuditEventQueryDto } from './audit-events.service';

@Controller('api/audit-events')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditEventsController {
  constructor(private readonly auditEventsService: AuditEventsService) {}

  /**
   * Paginated, filterable list of all audit events.
   * Requires: users.view permission (admins / managers).
   */
  @Get()
  @Permissions('users.view')
  findAll(@Query() query: AuditEventQueryDto) {
    return this.auditEventsService.findAll(query);
  }

  /**
   * Returns the last 10 events performed by the currently authenticated user.
   * Accessible by all authenticated users (no extra permission needed).
   */
  @Get('my-activity')
  @Permissions('users.view')
  getMyActivity(@Req() req: any, @Query() query: AuditEventQueryDto) {
    return this.auditEventsService.findByActor(req.user.id, {
      ...query,
      limit: query.limit || 10,
    });
  }

  /**
   * All activity for a specific user — used by the User Management Activity Logs tab.
   * Requires: users.manage permission (admin only).
   */
  @Get('user/:userId')
  @Permissions('users.manage')
  getUserActivity(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: AuditEventQueryDto,
  ) {
    return this.auditEventsService.findByActor(userId, query);
  }

  /**
   * CSV export of all audit events matching the current filters.
   * Returns a JSON array suitable for client-side CSV serialization.
   * Requires: users.manage permission to prevent bulk data exfiltration.
   */
  @Get('export')
  @Permissions('users.manage')
  async exportCsv(
    @Query() query: AuditEventQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const events = await this.auditEventsService.exportAll(query);
    res.setHeader('Content-Type', 'application/json');
    return events;
  }

  /**
   * Timeline of events for a specific entity.
   */
  @Get('entity/:entityType/:entityId')
  @Permissions('users.view')
  getEntityTimeline(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseIntPipe) entityId: number,
  ) {
    return this.auditEventsService.getEntityTimeline(entityType, entityId);
  }
}
