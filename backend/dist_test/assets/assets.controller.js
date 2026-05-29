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
exports.AssetsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const assets_service_1 = require("./assets.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const asset_dto_1 = require("./dto/asset.dto");
let AssetsController = class AssetsController {
    constructor(assetsService) {
        this.assetsService = assetsService;
    }
    async findAll() {
        return this.assetsService.findAll();
    }
    async getStatistics() {
        return this.assetsService.getStatistics();
    }
    async findOne(id) {
        return this.assetsService.findOne(id);
    }
    async getHistory(id) {
        return this.assetsService.getHistory(id);
    }
    async create(body) {
        return this.assetsService.create(body, body.performedBy);
    }
    async update(id, body) {
        return this.assetsService.update(id, body, body.performedBy);
    }
    async deploy(id, body) {
        return this.assetsService.deploy(id, body, body.performedBy);
    }
    async undeploy(id, performedBy) {
        return this.assetsService.undeploy(id, performedBy);
    }
    async scheduleMaintenance(id, body, performedBy) {
        return this.assetsService.scheduleMaintenance(id, body, performedBy);
    }
    async completeMaintenance(id, performedBy) {
        return this.assetsService.completeMaintenance(id, performedBy);
    }
    async calculateDepreciation(id, performedBy) {
        return this.assetsService.calculateDepreciation(id, performedBy);
    }
    async dispose(id, body, performedBy) {
        return this.assetsService.dispose(id, body, performedBy);
    }
    async uploadPhotos(id, files, body) {
        return this.assetsService.uploadPhotos(id, files, body);
    }
    async getPhotos(id) {
        return this.assetsService.getPhotos(id);
    }
    async deletePhoto(assetId, photoId) {
        await this.assetsService.deletePhoto(assetId, photoId);
        return { message: 'Photo deleted successfully' };
    }
    async delete(id) {
        await this.assetsService.delete(id);
        return { message: 'Asset deleted successfully' };
    }
};
exports.AssetsController = AssetsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('assets.view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, permissions_decorator_1.Permissions)('assets.view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('assets.view'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    (0, permissions_decorator_1.Permissions)('assets.view'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('assets.create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [asset_dto_1.CreateAssetDto]),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.Permissions)('assets.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, asset_dto_1.UpdateAssetDto]),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/deploy'),
    (0, permissions_decorator_1.Permissions)('assets.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, asset_dto_1.DeployAssetDto]),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "deploy", null);
__decorate([
    (0, common_1.Post)(':id/undeploy'),
    (0, permissions_decorator_1.Permissions)('assets.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('performedBy')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "undeploy", null);
__decorate([
    (0, common_1.Post)(':id/maintenance'),
    (0, permissions_decorator_1.Permissions)('assets.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Body)('performedBy')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, asset_dto_1.AssetMaintenanceDto, Number]),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "scheduleMaintenance", null);
__decorate([
    (0, common_1.Post)(':id/maintenance/complete'),
    (0, permissions_decorator_1.Permissions)('assets.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('performedBy')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "completeMaintenance", null);
__decorate([
    (0, common_1.Post)(':id/depreciation'),
    (0, permissions_decorator_1.Permissions)('assets.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('performedBy')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "calculateDepreciation", null);
__decorate([
    (0, common_1.Post)(':id/dispose'),
    (0, permissions_decorator_1.Permissions)('assets.manage'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Body)('performedBy')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, asset_dto_1.AssetDisposeDto, Number]),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "dispose", null);
__decorate([
    (0, common_1.Post)(':id/photos'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('photos', 10, {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/assets',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = (0, path_1.extname)(file.originalname);
                cb(null, `asset-${req.params.id}-${uniqueSuffix}${ext}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                cb(null, true);
            }
            else {
                cb(new Error('Only image files are allowed!'), false);
            }
        },
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.UploadedFiles)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Array, Object]),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "uploadPhotos", null);
__decorate([
    (0, common_1.Get)(':id/photos'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "getPhotos", null);
__decorate([
    (0, common_1.Delete)(':assetId/photos/:photoId'),
    __param(0, (0, common_1.Param)('assetId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('photoId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "deletePhoto", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('assets.delete'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "delete", null);
exports.AssetsController = AssetsController = __decorate([
    (0, common_1.Controller)('assets'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [assets_service_1.AssetsService])
], AssetsController);
//# sourceMappingURL=assets.controller.js.map