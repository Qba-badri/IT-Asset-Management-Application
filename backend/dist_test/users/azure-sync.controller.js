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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureSyncController = void 0;
const common_1 = require("@nestjs/common");
const azure_sync_service_1 = require("./azure-sync.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let AzureSyncController = class AzureSyncController {
    constructor(azureSyncService) {
        this.azureSyncService = azureSyncService;
    }
    async syncAzureUsers() {
        return await this.azureSyncService.syncUsers();
    }
    async getSyncStatus() {
        return {
            message: 'Service is ready for synchronization',
        };
    }
};
exports.AzureSyncController = AzureSyncController;
__decorate([
    (0, common_1.Post)('azure'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AzureSyncController.prototype, "syncAzureUsers", null);
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AzureSyncController.prototype, "getSyncStatus", null);
exports.AzureSyncController = AzureSyncController = __decorate([
    (0, common_1.Controller)('users/sync'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [azure_sync_service_1.AzureSyncService])
], AzureSyncController);
//# sourceMappingURL=azure-sync.controller.js.map