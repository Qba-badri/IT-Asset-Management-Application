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
exports.MasterController = void 0;
const common_1 = require("@nestjs/common");
const master_service_1 = require("./master.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let MasterController = class MasterController {
    constructor(masterService) {
        this.masterService = masterService;
    }
    async getBrands() {
        return this.masterService.findAllBrands();
    }
    async createBrand(data) {
        return this.masterService.createBrand(data);
    }
    async updateBrand(id, data) {
        return this.masterService.updateBrand(id, data);
    }
    async deleteBrand(id) {
        return this.masterService.deleteBrand(id);
    }
    async getVendors() {
        return this.masterService.findAllVendors();
    }
    async createVendor(data) {
        return this.masterService.createVendor(data);
    }
    async updateVendor(id, data) {
        return this.masterService.updateVendor(id, data);
    }
    async deleteVendor(id) {
        return this.masterService.deleteVendor(id);
    }
    async getVendorPlans(id) {
        return this.masterService.findPlansByVendor(id);
    }
    async getPlans() {
        return this.masterService.findAllPlans();
    }
    async createPlan(data) {
        return this.masterService.createPlan(data);
    }
    async updatePlan(id, data) {
        return this.masterService.updatePlan(id, data);
    }
    async deletePlan(id) {
        return this.masterService.deletePlan(id);
    }
    async getLookups(type) {
        if (type) {
            return this.masterService.findLookupsByType(type);
        }
        return this.masterService.findAllLookups();
    }
    async createLookup(data) {
        return this.masterService.createLookup(data);
    }
    async updateLookup(id, data) {
        return this.masterService.updateLookup(id, data);
    }
    async deleteLookup(id) {
        return this.masterService.deleteLookup(id);
    }
};
exports.MasterController = MasterController;
__decorate([
    (0, common_1.Get)('brands'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MasterController.prototype, "getBrands", null);
__decorate([
    (0, common_1.Post)('brands'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MasterController.prototype, "createBrand", null);
__decorate([
    (0, common_1.Put)('brands/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], MasterController.prototype, "updateBrand", null);
__decorate([
    (0, common_1.Delete)('brands/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MasterController.prototype, "deleteBrand", null);
__decorate([
    (0, common_1.Get)('vendors'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MasterController.prototype, "getVendors", null);
__decorate([
    (0, common_1.Post)('vendors'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MasterController.prototype, "createVendor", null);
__decorate([
    (0, common_1.Put)('vendors/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], MasterController.prototype, "updateVendor", null);
__decorate([
    (0, common_1.Delete)('vendors/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MasterController.prototype, "deleteVendor", null);
__decorate([
    (0, common_1.Get)('vendors/:id/plans'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MasterController.prototype, "getVendorPlans", null);
__decorate([
    (0, common_1.Get)('plans'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MasterController.prototype, "getPlans", null);
__decorate([
    (0, common_1.Post)('plans'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MasterController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Put)('plans/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], MasterController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Delete)('plans/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MasterController.prototype, "deletePlan", null);
__decorate([
    (0, common_1.Get)('lookups'),
    __param(0, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MasterController.prototype, "getLookups", null);
__decorate([
    (0, common_1.Post)('lookups'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MasterController.prototype, "createLookup", null);
__decorate([
    (0, common_1.Put)('lookups/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], MasterController.prototype, "updateLookup", null);
__decorate([
    (0, common_1.Delete)('lookups/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MasterController.prototype, "deleteLookup", null);
exports.MasterController = MasterController = __decorate([
    (0, common_1.Controller)('masters'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [master_service_1.MasterService])
], MasterController);
//# sourceMappingURL=master.controller.js.map