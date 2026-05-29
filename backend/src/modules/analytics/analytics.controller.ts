import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService, DashboardFilters } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Get('summary')
  async getGlobalSummary(@Query() filters: DashboardFilters) {
    return this.analyticsService.getGlobalSummary(filters);
  }

  @Get('assets')
  async getAssetStats(@Query() filters: DashboardFilters) {
    return this.analyticsService.getAssetStats(filters);
  }

  @Get('licenses')
  async getLicenseStats(@Query() filters: DashboardFilters) {
    return this.analyticsService.getLicenseStats(filters);
  }

  @Get('inventory')
  async getInventoryStats(@Query() filters: DashboardFilters) {
    return this.analyticsService.getInventoryStats(filters);
  }

  @Get('users')
  async getUserStats(@Query() filters: DashboardFilters) {
    return this.analyticsService.getUserStats(filters);
  }

  @Get('alerts')
  async getAlerts(@Query() filters: DashboardFilters) {
    return this.analyticsService.getAlerts(filters);
  }

  @Get('activity')
  async getRecentActivity(@Query() filters: DashboardFilters) {
    return this.analyticsService.getRecentActivity(filters);
  }

  @Get('stock-movement')
  async getStockMovement(@Query() filters: DashboardFilters) {
    return this.analyticsService.getStockMovement(filters);
  }

  @Get('license-utilization')
  async getLicenseUtilization(@Query() filters: DashboardFilters) {
    return this.analyticsService.getLicenseUtilization(filters);
  }

  /* --- Legacy Reports (Maintain if needed) --- */

  @Get('dashboard')
  async getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('reports/refresh')
  async getRefreshReport() {
    return this.analyticsService.getAssetRefreshReport();
  }

  @Get('reports/depreciation')
  async getDepreciationReport() {
    return this.analyticsService.getDepreciationReport();
  }
}
