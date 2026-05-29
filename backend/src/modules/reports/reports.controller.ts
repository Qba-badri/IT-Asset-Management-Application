import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService, ReportQueryDto } from './reports.service';

@Controller('api/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('ledger')
  getLedgerReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getLedgerReport(query);
  }

  @Get('writeoffs')
  getWriteOffsReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getWriteOffsReport(query);
  }

  @Get('asset-history/:assetUnitId')
  getAssetHistory(@Param('assetUnitId', ParseIntPipe) assetUnitId: number) {
    return this.reportsService.getAssetHistory(assetUnitId);
  }

  @Get('dashboard-summary')
  getDashboardSummary() {
    return this.reportsService.getDashboardSummary();
  }
}
