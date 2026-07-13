import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardWidgetsService } from './dashboard-widgets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('api/dashboard-widgets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardWidgetsController {
  constructor(private readonly service: DashboardWidgetsService) {}

  @Get('recent-assets')
  @Permissions('assets.view')
  async getRecentAssets(@Query('limit') limit?: string) {
    return this.service.getRecentAssetAssignments(limit ? parseInt(limit, 10) : undefined);
  }

  @Get('recent-licenses')
  @Permissions('licenses.view')
  async getRecentLicenses(@Query('limit') limit?: string) {
    return this.service.getRecentLicenseAssignments(limit ? parseInt(limit, 10) : undefined);
  }

  @Get('recent-inventory')
  @Permissions('inventory-mgmt.view')
  async getRecentInventory(@Query('limit') limit?: string) {
    return this.service.getRecentInventoryAssignments(limit ? parseInt(limit, 10) : undefined);
  }
}
