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
exports.InventoryManagementController = void 0;
const common_1 = require("@nestjs/common");
const inventory_mgmt_service_1 = require("./inventory-mgmt.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const inventory_mgmt_dto_1 = require("./dto/inventory-mgmt.dto");
let InventoryManagementController = class InventoryManagementController {
    constructor(service) {
        this.service = service;
    }
    async getDashboard() {
        return this.service.getDashboardStats();
    }
    async createCategory(dto) {
        return this.service.createCategory(dto);
    }
    async getCategories() {
        return this.service.findAllCategories();
    }
    async getCategory(id) {
        return this.service.findOneCategory(id);
    }
    async updateCategory(id, dto) {
        return this.service.updateCategory(id, dto);
    }
    async deleteCategory(id) {
        return this.service.deleteCategory(id);
    }
    async createItem(dto) {
        return this.service.createItem(dto);
    }
    async getItems() {
        return this.service.findAllItems();
    }
    async getItem(id) {
        return this.service.findOneItem(id);
    }
    async updateItem(id, dto) {
        return this.service.updateItem(id, dto);
    }
    async deleteItem(id) {
        return this.service.deleteItem(id);
    }
    async createPurchase(dto, req) {
        return this.service.createPurchase(dto, req.user.id);
    }
    async getPurchases() {
        return this.service.getPurchases();
    }
    async createAssignment(dto, req) {
        return this.service.createAssignment(dto, req.user.id);
    }
    async getAssignments(userId, req) {
        const userRole = req.user.role?.name;
        const currentUserId = req.user.id;
        if (userRole !== 'Admin' && userRole !== 'Manager') {
            return this.service.getAssignments(currentUserId);
        }
        return this.service.getAssignments(userId ? parseInt(userId) : undefined);
    }
    async returnAssignment(id, dto, req) {
        return this.service.returnAssignment(id, dto, req.user.id);
    }
    async createReturn(dto, req) {
        return this.service.createReturn(dto, req.user.id);
    }
    async getTransactions(itemId) {
        return this.service.getStockHistory(itemId ? parseInt(itemId) : undefined);
    }
};
exports.InventoryManagementController = InventoryManagementController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, permissions_decorator_1.Permissions)('inventory-mgmt.view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryManagementController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Post)('categories'),
    (0, permissions_decorator_1.Permissions)('inventory-mgmt.manage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_mgmt_dto_1.CreateInventoryCategoryDto]),
    __metadata("design:returntype", Promise)
], InventoryManagementController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Get)('categories'),
    (0, permissions_decorator_1.Permissions)('inventory-mgmt.view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryManagementController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Get)('categories/:id'),
    (0, permissions_decorator_1.Permissions)('inventory-mgmt.view'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], InventoryManagementController.prototype, "getCategory", null);
__decorate([
    (0, common_1.Put)('categories/:id'),
    (0, permissions_decorator_1.Permissions)('inventory-mgmt.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, inventory_mgmt_dto_1.CreateInventoryCategoryDto]),
    __metadata("design:returntype", Promise)
], InventoryManagementController.prototype, "updateCategory", null);
__decorate([
    (0, common_1.Delete)('categories/:id'),
    (0, permissions_decorator_1.Permissions)('inventory-mgmt.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], InventoryManagementController.prototype, "deleteCategory", null);
__decorate([
    (0, common_1.Post)('items'),
    (0, permissions_decorator_1.Permissions)('inventory-mgmt.manage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_mgmt_dto_1.CreateInventoryItemDto]),
    __metadata("design:returntype", Promise)
], InventoryManagementController.prototype, "createItem", null);
__decorate([
    (0, common_1.Get)('items'),
    (0, permissions_decorator_1.Permissions)('inventory-mgmt.view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryManagementController.prototype, "getItems", null);
__decorate([
    (0, common_1.Get)('items/:id'),
    (0, permissions_decorator_1.Permissions)('inventory-mgmt.view'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], InventoryManagementController.prototype, "getItem", null);
__decorate([
    (0, common_1.Put)('items/:id'),
    (0, permissions_decorator_1.Permissions)('inventory-mgmt.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, inventory_mgmt_dto_1.CreateInventoryItemDto]),
    __metadata("design:returntype", Promise)
], InventoryManagementController.prototype, "updateItem", null);
__decorate([
    (0, common_1.Delete)('items/:id'),
    (0, permissions_decorator_1.Permissions)('inventory-mgmt.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], InventoryManagementController.prototype, "deleteItem", null);
__decorate([
    (0, common_1.Post)('purchases'),
    (0, permissions_decorator_1.Permissions)('inventory-mgmt.manage'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_mgmt_dto_1.CreateInventoryPurchaseDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryManagementController.prototype, "createPurchase", null);
__decorate([
    (0, common_1.Get)('purchases'),
    (0, permissions_decorator_1.Permissions)('inventory-mgmt.view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryManagementController.prototype, "getPurchases", null);
__decorate([
    (0, common_1.Post)('assignments'),
    (0, permissions_decorator_1.Permissions)('inventory-mgmt.manage'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_mgmt_dto_1.CreateInventoryAssignmentDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryManagementController.prototype, "createAssignment", null);
__decorate([
    (0, common_1.Get)('assignments'),
    (0, permissions_decorator_1.Permissions)('inventory-mgmt.view'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryManagementController.prototype, "getAssignments", null);
__decorate([
    (0, common_1.Post)('assignments/:id/return'),
    (0, permissions_decorator_1.Permissions)('inventory-mgmt.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], InventoryManagementController.prototype, "returnAssignment", null);
__decorate([
    (0, common_1.Post)('returns'),
    (0, permissions_decorator_1.Permissions)('inventory-mgmt.manage'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_mgmt_dto_1.CreateInventoryReturnDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryManagementController.prototype, "createReturn", null);
__decorate([
    (0, common_1.Get)('transactions'),
    (0, permissions_decorator_1.Permissions)('inventory-mgmt.view'),
    __param(0, (0, common_1.Query)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryManagementController.prototype, "getTransactions", null);
exports.InventoryManagementController = InventoryManagementController = __decorate([
    (0, common_1.Controller)('api/inventory-management'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [inventory_mgmt_service_1.InventoryManagementService])
], InventoryManagementController);
//# sourceMappingURL=inventory-mgmt.controller.js.map