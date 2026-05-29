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
exports.ProcurementController = void 0;
const common_1 = require("@nestjs/common");
const procurement_service_1 = require("./procurement.service");
const workflow_service_1 = require("./workflow.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let ProcurementController = class ProcurementController {
    constructor(procurementService, workflowService) {
        this.procurementService = procurementService;
        this.workflowService = workflowService;
    }
    async createRequest(data, req) {
        return this.procurementService.createRequest(data, req.user.id);
    }
    async getAllRequests() {
        return this.procurementService.findAllRequests();
    }
    async getPendingTasks(req) {
        return this.workflowService.getPendingTasks(req.user.id, req.user.roleId);
    }
    async approveTask(id, data, req) {
        return this.procurementService.approveTask(id, req.user.id, data.comments);
    }
    async createPO(id, data, req) {
        return this.procurementService.createPO(id, data.vendorName, req.user.id);
    }
    async confirmReceipt(id, data, req) {
        return this.procurementService.confirmReceipt(id, data.quantity, data.notes, req.user.id);
    }
    async getRules() {
        return this.procurementService.findAllRules();
    }
    async createRule(data) {
        return this.procurementService.createRule(data);
    }
};
exports.ProcurementController = ProcurementController;
__decorate([
    (0, common_1.Post)('requests'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProcurementController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Get)('requests'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProcurementController.prototype, "getAllRequests", null);
__decorate([
    (0, common_1.Get)('tasks/pending'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProcurementController.prototype, "getPendingTasks", null);
__decorate([
    (0, common_1.Post)('tasks/:id/approve'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], ProcurementController.prototype, "approveTask", null);
__decorate([
    (0, common_1.Post)('requests/:id/po'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], ProcurementController.prototype, "createPO", null);
__decorate([
    (0, common_1.Post)('po/:id/grn'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], ProcurementController.prototype, "confirmReceipt", null);
__decorate([
    (0, common_1.Get)('rules'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProcurementController.prototype, "getRules", null);
__decorate([
    (0, common_1.Post)('rules'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProcurementController.prototype, "createRule", null);
exports.ProcurementController = ProcurementController = __decorate([
    (0, common_1.Controller)('procurement'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [procurement_service_1.ProcurementService,
        workflow_service_1.WorkflowService])
], ProcurementController);
//# sourceMappingURL=procurement.controller.js.map