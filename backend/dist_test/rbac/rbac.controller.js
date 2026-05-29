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
exports.RbacController = void 0;
const common_1 = require("@nestjs/common");
const rbac_service_1 = require("./rbac.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
let RbacController = class RbacController {
    constructor(rbacService) {
        this.rbacService = rbacService;
    }
    async getRoles() {
        return this.rbacService.findAllRoles();
    }
    async createRole(body) {
        return this.rbacService.createRole(body.name, body.description, body.permissionIds || []);
    }
    async updateRole(id, body) {
        return this.rbacService.updateRole(id, body.name, body.description, body.permissionIds || []);
    }
    async deleteRole(id) {
        await this.rbacService.deleteRole(id);
        return { message: 'Role deleted successfully' };
    }
    async getPermissions() {
        return this.rbacService.findAllPermissions();
    }
    async createPermission(body) {
        return this.rbacService.createPermission(body.slug, body.module, body.description);
    }
    async updatePermission(id, body) {
        return this.rbacService.updatePermission(id, body.slug, body.module, body.description);
    }
    async deletePermission(id) {
        await this.rbacService.deletePermission(id);
        return { message: 'Permission deleted successfully' };
    }
};
exports.RbacController = RbacController;
__decorate([
    (0, common_1.Get)('roles'),
    (0, permissions_decorator_1.Permissions)('roles.view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "getRoles", null);
__decorate([
    (0, common_1.Post)('roles'),
    (0, permissions_decorator_1.Permissions)('roles.manage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "createRole", null);
__decorate([
    (0, common_1.Put)('roles/:id'),
    (0, permissions_decorator_1.Permissions)('roles.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Delete)('roles/:id'),
    (0, permissions_decorator_1.Permissions)('roles.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "deleteRole", null);
__decorate([
    (0, common_1.Get)('permissions'),
    (0, permissions_decorator_1.Permissions)('roles.view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "getPermissions", null);
__decorate([
    (0, common_1.Post)('permissions'),
    (0, permissions_decorator_1.Permissions)('roles.manage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "createPermission", null);
__decorate([
    (0, common_1.Put)('permissions/:id'),
    (0, permissions_decorator_1.Permissions)('roles.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "updatePermission", null);
__decorate([
    (0, common_1.Delete)('permissions/:id'),
    (0, permissions_decorator_1.Permissions)('roles.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], RbacController.prototype, "deletePermission", null);
exports.RbacController = RbacController = __decorate([
    (0, common_1.Controller)('rbac'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [rbac_service_1.RbacService])
], RbacController);
//# sourceMappingURL=rbac.controller.js.map