/**
 * @file dashboard.controller.ts
 * @description REST controller exposing all 20 dashboard KPI endpoints.
 *
 * ## Endpoint → KPI Mapping
 * | Endpoint                          | KPIs Served              |
 * |-----------------------------------|--------------------------|
 * | GET /api/dashboard/global-summary | KPI 1                    |
 * | GET /api/dashboard/assets         | KPI 2, 3, 5              |
 * | GET /api/dashboard/licenses       | KPI 13, 14, 15           |
 * | GET /api/dashboard/inventory-kpi  | KPI 6, 7, 8              |
 * | GET /api/dashboard/assignments-kpi| KPI 9, 10, 11, 12        |
 * | GET /api/dashboard/serialized-units-kpi | KPI 4             |
 * | GET /api/dashboard/asset-financial-kpi  | KPI 17, 18, 19    |
 * | GET /api/dashboard/audit-activity-kpi   | KPI 20            |
 * | GET /api/dashboard/users          | KPI 16                   |
 * | GET /api/dashboard/alerts         | Aggregated critical alerts|
 * | GET /api/dashboard/stock-movement | Stock movement bar chart  |
 * | GET /api/dashboard/license-utilization | Per-software KPI 13|
 *
 * ## Adding a New KPI Endpoint
 * 1. Add a method to AnalyticsService.
 * 2. Add a @Get() method here, following the try/catch pattern.
 * 3. Register any new entities in analytics.module.ts.
 * 4. Add a typed call in dashboardService.ts (frontend).
 */

import {
  Controller, Get, Query, UseGuards,
  Logger, InternalServerErrorException, Req,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Any authenticated user may load the dashboard; the AnalyticsService scopes
// every KPI to the user's data-scope tier (global / department / self) based
// on their dashboard.view.* permissions, so a Standard User sees only their
// own assigned assets and nothing organization-wide.
@Controller('api/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  // ── KPI 1: Total assets, totals across all domains ──
  @Get('global-summary')
  async getGlobalSummary(@Query() filters: any, @Req() req: any) {
    try {
      return await this.analyticsService.getGlobalSummary(filters, req.user);
    } catch (error) {
      this.logger.error(`Failed to get global summary: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }

  // ── KPI 2, 3, 5: Asset utilization, status breakdown, warranty alerts ──
  @Get('assets')
  async getAssetStats(@Query() filters: any, @Req() req: any) {
    try {
      return await this.analyticsService.getAssetStats(filters, req.user);
    } catch (error) {
      this.logger.error(`Failed to get asset stats: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }

  // ── KPI 4: Serialized asset unit lifecycle breakdown ──
  @Get('serialized-units-kpi')
  async getSerializedUnitKpis(@Query() filters: any, @Req() req: any) {
    try {
      return await this.analyticsService.getSerializedUnitKpis(filters, req.user);
    } catch (error) {
      this.logger.error(`Failed to get serialized unit KPIs: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }

  // ── KPI 6, 7, 8: Inventory below-min, spend, turnover ──
  @Get('inventory-kpi')
  async getInventoryKpis(@Query() filters: any, @Req() req: any) {
    try {
      return await this.analyticsService.getInventoryKpis(filters, req.user);
    } catch (error) {
      this.logger.error(`Failed to get inventory KPIs: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }

  // ── KPI 9, 10, 11, 12: Assignments — active, overdue, return rate, damage ──
  @Get('assignments-kpi')
  async getAssignmentKpis(@Query() filters: any, @Req() req: any) {
    try {
      return await this.analyticsService.getAssignmentKpis(filters, req.user);
    } catch (error) {
      this.logger.error(`Failed to get assignment KPIs: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }

  // ── KPI 13, 14, 15: License seat utilization, expiry tiers, annual spend ──
  @Get('licenses')
  async getLicenseStats(@Query() filters: any, @Req() req: any) {
    try {
      return await this.analyticsService.getLicenseStats(filters, req.user);
    } catch (error) {
      this.logger.error(`Failed to get license stats: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }

  // ── KPI 16: Active users vs. assigned assets ratio ──
  @Get('users')
  async getUserStats(@Query() filters: any, @Req() req: any) {
    try {
      return await this.analyticsService.getUserStats(filters, req.user);
    } catch (error) {
      this.logger.error(`Failed to get user stats: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }

  // ── KPI 17, 18, 19: New registrations, book value, rented MRC ──
  @Get('asset-financial-kpi')
  async getAssetFinancialKpis(@Query() filters: any, @Req() req: any) {
    try {
      return await this.analyticsService.getAssetFinancialKpis(filters, req.user);
    } catch (error) {
      this.logger.error(`Failed to get asset financial KPIs: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }

  // ── KPI 20: System activity last 24 hours ──
  @Get('audit-activity-kpi')
  async getAuditActivityKpis(@Req() req: any) {
    try {
      return await this.analyticsService.getAuditActivityKpis(req.user);
    } catch (error) {
      this.logger.error(`Failed to get audit activity KPIs: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }

  // ── Aggregated critical alert counts (header badge) ──
  @Get('alerts')
  async getAlerts(@Query() filters: any, @Req() req: any) {
    try {
      return await this.analyticsService.getAlerts(filters, req.user);
    } catch (error) {
      this.logger.error(`Failed to get alerts: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }

  // ── Stock movement bar chart ──
  @Get('stock-movement')
  async getStockMovement(@Query() filters: any, @Req() req: any) {
    try {
      return await this.analyticsService.getStockMovement(filters, req.user);
    } catch (error) {
      this.logger.error(`Failed to get stock movement: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }

  // ── Per-software license utilization table ──
  @Get('license-utilization')
  async getLicenseUtilization(@Query() filters: any, @Req() req: any) {
    try {
      return await this.analyticsService.getLicenseUtilization(filters, req.user);
    } catch (error) {
      this.logger.error(`Failed to get license utilization: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }

  // ── Recent activity feed (legacy audit_log) ──
  @Get('recent-activity')
  async getRecentActivity(@Query() filters: any, @Req() req: any) {
    try {
      return await this.analyticsService.getRecentActivity(filters, req.user);
    } catch (error) {
      this.logger.error(`Failed to get recent activity: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }

  // ── Legacy inventory endpoint (backward compat) ──
  @Get('inventory')
  async getInventoryStats(@Query() filters: any, @Req() req: any) {
    try {
      return await this.analyticsService.getInventoryStats(filters, req.user);
    } catch (error) {
      this.logger.error(`Failed to get inventory stats: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }
}
