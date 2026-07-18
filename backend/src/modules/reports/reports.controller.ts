import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ReportsService, ReportQueryDto } from './reports.service';

@Controller('api/reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('ledger')
  @Permissions('reports.view')
  getLedgerReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getLedgerReport(query);
  }

  @Get('writeoffs')
  @Permissions('reports.view')
  getWriteOffsReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getWriteOffsReport(query);
  }

  @Get('asset-history/:assetUnitId')
  @Permissions('reports.view')
  getAssetHistory(@Param('assetUnitId', ParseIntPipe) assetUnitId: number) {
    return this.reportsService.getAssetHistory(assetUnitId);
  }

  @Get('dashboard-summary')
  @Permissions('reports.view')
  getDashboardSummary() {
    return this.reportsService.getDashboardSummary();
  }
}
