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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicensesController = void 0;
const common_1 = require("@nestjs/common");
const licenses_service_1 = require("./licenses.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const license_dto_1 = require("./dto/license.dto");
const common_2 = require("@nestjs/common");
let LicensesController = class LicensesController {
    constructor(licensesService) {
        this.licensesService = licensesService;
    }
    async findAll() {
        return this.licensesService.findAll();
    }
    async getStatistics() {
        return this.licensesService.getStatistics();
    }
    async findOne(id) {
        return this.licensesService.findOne(id);
    }
    async create(data) {
        return this.licensesService.create(data);
    }
    async update(id, data) {
        return this.licensesService.update(id, data);
    }
    async findByUser(userId) {
        return this.licensesService.findUserAssignments(userId);
    }
    async assign(id, data) {
        return this.licensesService.assignLicense(id, data.userId, data.notes);
    }
    async unassign(id, reason) {
        return this.licensesService.unassignLicense(id, reason);
    }
    async delete(id) {
        return this.licensesService.delete(id);
    }
    async renew(id, data, req) {
        return this.licensesService.renewLicense(id, data, req.user?.id);
    }
    async getHistory(id) {
        return this.licensesService.findHistory(id);
    }
    async adjustSeats(id, data, req) {
        return this.licensesService.adjustSeats(id, data, req.user?.id);
    }
};
exports.LicensesController = LicensesController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('licenses.view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LicensesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, permissions_decorator_1.Permissions)('licenses.view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LicensesController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('licenses.view'),
    __param(0, (0, common_1.Param)('id', common_2.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], LicensesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('licenses.create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [license_dto_1.CreateLicenseDto]),
    __metadata("design:returntype", Promise)
], LicensesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.Permissions)('licenses.manage'),
    __param(0, (0, common_1.Param)('id', common_2.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, license_dto_1.UpdateLicenseDto]),
    __metadata("design:returntype", Promise)
], LicensesController.prototype, "update", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, permissions_decorator_1.Permissions)('licenses.view'),
    __param(0, (0, common_1.Param)('userId', common_2.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], LicensesController.prototype, "findByUser", null);
__decorate([
    (0, common_1.Post)(':id/assign'),
    (0, permissions_decorator_1.Permissions)('licenses.manage'),
    __param(0, (0, common_1.Param)('id', common_2.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, license_dto_1.AssignLicenseDto]),
    __metadata("design:returntype", Promise)
], LicensesController.prototype, "assign", null);
__decorate([
    (0, common_1.Delete)('assignments/:id'),
    (0, permissions_decorator_1.Permissions)('licenses.manage'),
    __param(0, (0, common_1.Param)('id', common_2.ParseIntPipe)),
    __param(1, (0, common_1.Query)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], LicensesController.prototype, "unassign", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('licenses.delete'),
    __param(0, (0, common_1.Param)('id', common_2.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], LicensesController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/renew'),
    (0, permissions_decorator_1.Permissions)('licenses.manage'),
    __param(0, (0, common_1.Param)('id', common_2.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, license_dto_1.RenewLicenseDto, Object]),
    __metadata("design:returntype", Promise)
], LicensesController.prototype, "renew", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    (0, permissions_decorator_1.Permissions)('licenses.view'),
    __param(0, (0, common_1.Param)('id', common_2.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], LicensesController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Patch)(':id/adjust-seats'),
    (0, permissions_decorator_1.Permissions)('licenses.manage'),
    __param(0, (0, common_1.Param)('id', common_2.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, license_dto_1.AdjustSeatsDto, Object]),
    __metadata("design:returntype", Promise)
], LicensesController.prototype, "adjustSeats", null);
exports.LicensesController = LicensesController = __decorate([
    (0, common_1.Controller)('licenses'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [licenses_service_1.LicensesService])
], LicensesController);
//# sourceMappingURL=licenses.controller.js.map