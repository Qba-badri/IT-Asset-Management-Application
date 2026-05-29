import { Controller, Get, Query, UseGuards, Logger, InternalServerErrorException, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
    private readonly logger = new Logger(DashboardController.name);

    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('global-summary')
    async getGlobalSummary(@Query() filters: any, @Req() req: any) {
        try {
            return await this.analyticsService.getGlobalSummary(filters, req.user);
        } catch (error) {
            this.logger.error(`Failed to get global summary: ${error.message}`, error.stack);
            throw new InternalServerErrorException(error.message);
        }
    }

    @Get('assets')
    async getAssetStats(@Query() filters: any, @Req() req: any) {
        try {
            return await this.analyticsService.getAssetStats(filters, req.user);
        } catch (error) {
            this.logger.error(`Failed to get asset stats: ${error.message}`, error.stack);
            throw new InternalServerErrorException(error.message);
        }
    }

    @Get('licenses')
    async getLicenseStats(@Query() filters: any, @Req() req: any) {
        try {
            return await this.analyticsService.getLicenseStats(filters, req.user);
        } catch (error) {
            this.logger.error(`Failed to get license stats: ${error.message}`, error.stack);
            throw new InternalServerErrorException(error.message);
        }
    }

    @Get('inventory')
    async getInventoryStats(@Query() filters: any, @Req() req: any) {
        try {
            return await this.analyticsService.getInventoryStats(filters, req.user);
        } catch (error) {
            this.logger.error(`Failed to get inventory stats: ${error.message}`, error.stack);
            throw new InternalServerErrorException(error.message);
        }
    }


    @Get('users')
    async getUserStats(@Query() filters: any) {
        try {
            return await this.analyticsService.getUserStats(filters);
        } catch (error) {
            this.logger.error(`Failed to get user stats: ${error.message}`, error.stack);
            throw new InternalServerErrorException(error.message);
        }
    }

    @Get('alerts')
    async getAlerts(@Query() filters: any, @Req() req: any) {
        try {
            return await this.analyticsService.getAlerts(filters, req.user);
        } catch (error) {
            this.logger.error(`Failed to get alerts: ${error.message}`, error.stack);
            throw new InternalServerErrorException(error.message);
        }
    }

    @Get('recent-activity')
    async getRecentActivity(@Query() filters: any, @Req() req: any) {
        try {
            return await this.analyticsService.getRecentActivity(filters, req.user);
        } catch (error) {
            this.logger.error(`Failed to get recent activity: ${error.message}`, error.stack);
            throw new InternalServerErrorException(error.message);
        }
    }

    @Get('stock-movement')
    async getStockMovement(@Query() filters: any, @Req() req: any) {
        try {
            return await this.analyticsService.getStockMovement(filters, req.user);
        } catch (error) {
            this.logger.error(`Failed to get stock movement: ${error.message}`, error.stack);
            throw new InternalServerErrorException(error.message);
        }
    }

    @Get('license-utilization')
    async getLicenseUtilization(@Query() filters: any, @Req() req: any) {
        try {
            return await this.analyticsService.getLicenseUtilization(filters, req.user);
        } catch (error) {
            this.logger.error(`Failed to get license utilization: ${error.message}`, error.stack);
            throw new InternalServerErrorException(error.message);
        }
    }
}
