import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditLogsController {
    constructor(private readonly auditLogsService: AuditLogsService) { }

    @Get('recent')
    @Permissions('analytics.view')
    async getRecent(@Query('limit') limit: number = 10) {
        return this.auditLogsService.findRecent(limit);
    }

    @Get('entity')
    @Permissions('analytics.view')
    async getEntityHistory(
        @Query('type') type: string,
        @Query('id', ParseIntPipe) id: number,
    ) {
        return this.auditLogsService.findByEntity(type, id);
    }
}
