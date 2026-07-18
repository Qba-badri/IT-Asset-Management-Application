import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService, DashboardFilters } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

// Reports page. Access requires reports.view, but the data is still scoped to
// the caller's dashboard.view.* tier: a Manager (department tier) sees only
// their department, while global-tier roles (Admin/IT/Helpdesk/Auditor) see
// everything. Consistent with the /api/dashboard scoping.
@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('reports.view')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Get('summary')
  async getGlobalSummary(@Query() filters: DashboardFilters, @Req() req: any) {
    return this.analyticsService.getGlobalSummary(filters, req.user);
  }

  @Get('assets')
  async getAssetStats(@Query() filters: DashboardFilters, @Req() req: any) {
    return this.analyticsService.getAssetStats(filters, req.user);
  }

  @Get('licenses')
  async getLicenseStats(@Query() filters: DashboardFilters, @Req() req: any) {
    return this.analyticsService.getLicenseStats(filters, req.user);
  }

  @Get('inventory')
  async getInventoryStats(@Query() filters: DashboardFilters, @Req() req: any) {
    return this.analyticsService.getInventoryStats(filters, req.user);
  }

  @Get('users')
  async getUserStats(@Query() filters: DashboardFilters, @Req() req: any) {
    return this.analyticsService.getUserStats(filters, req.user);
  }

  @Get('alerts')
  async getAlerts(@Query() filters: DashboardFilters, @Req() req: any) {
    return this.analyticsService.getAlerts(filters, req.user);
  }

  @Get('activity')
  async getRecentActivity(@Query() filters: DashboardFilters, @Req() req: any) {
    return this.analyticsService.getRecentActivity(filters, req.user);
  }

  @Get('stock-movement')
  async getStockMovement(@Query() filters: DashboardFilters, @Req() req: any) {
    return this.analyticsService.getStockMovement(filters, req.user);
  }

  @Get('license-utilization')
  async getLicenseUtilization(@Query() filters: DashboardFilters, @Req() req: any) {
    return this.analyticsService.getLicenseUtilization(filters, req.user);
  }

  /* --- Legacy Reports (Maintain if needed) --- */

  @Get('dashboard')
  async getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('reports/refresh')
  @Permissions('reports.view')
  async getRefreshReport() {
    return this.analyticsService.getAssetRefreshReport();
  }

  @Get('reports/depreciation')
  @Permissions('reports.view')
  async getDepreciationReport() {
    return this.analyticsService.getDepreciationReport();
  }
}
