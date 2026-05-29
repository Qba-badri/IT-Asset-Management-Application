"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DashboardController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const analytics_service_1 = require("./analytics.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let DashboardController = DashboardController_1 = class DashboardController {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
        this.logger = new common_1.Logger(DashboardController_1.name);
    }
    async getGlobalSummary() {
        try {
            return await this.analyticsService.getGlobalSummary();
        }
        catch (error) {
            this.logger.error(`Failed to get global summary: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async getAssetStats() {
        try {
            return await this.analyticsService.getAssetStats();
        }
        catch (error) {
            this.logger.error(`Failed to get asset stats: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async getLicenseStats() {
        try {
            return await this.analyticsService.getLicenseStats();
        }
        catch (error) {
            this.logger.error(`Failed to get license stats: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async getInventoryStats() {
        try {
            return await this.analyticsService.getInventoryStats();
        }
        catch (error) {
            this.logger.error(`Failed to get inventory stats: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async getProcurementStats() {
        try {
            return await this.analyticsService.getProcurementStats();
        }
        catch (error) {
            this.logger.error(`Failed to get procurement stats: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async getUserStats() {
        try {
            return await this.analyticsService.getUserStats();
        }
        catch (error) {
            this.logger.error(`Failed to get user stats: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async getAlerts() {
        try {
            return await this.analyticsService.getAlerts();
        }
        catch (error) {
            this.logger.error(`Failed to get alerts: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('global-summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getGlobalSummary", null);
__decorate([
    (0, common_1.Get)('assets'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getAssetStats", null);
__decorate([
    (0, common_1.Get)('licenses'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getLicenseStats", null);
__decorate([
    (0, common_1.Get)('inventory'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getInventoryStats", null);
__decorate([
    (0, common_1.Get)('procurement'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getProcurementStats", null);
__decorate([
    (0, common_1.Get)('users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getUserStats", null);
__decorate([
    (0, common_1.Get)('alerts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getAlerts", null);
exports.DashboardController = DashboardController = DashboardController_1 = __decorate([
    (0, common_1.Controller)('api/dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map