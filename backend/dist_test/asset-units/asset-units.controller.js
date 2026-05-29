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
exports.AssetUnitsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const asset_units_service_1 = require("./asset-units.service");
const asset_unit_dto_1 = require("./dto/asset-unit.dto");
let AssetUnitsController = class AssetUnitsController {
    constructor(assetUnitsService) {
        this.assetUnitsService = assetUnitsService;
    }
    create(dto) {
        return this.assetUnitsService.create(dto);
    }
    findAll(query) {
        return this.assetUnitsService.findAll(query);
    }
    findOne(id) {
        return this.assetUnitsService.findOne(id);
    }
    findByTag(assetTag) {
        return this.assetUnitsService.findByAssetTag(assetTag);
    }
    update(id, dto) {
        return this.assetUnitsService.update(id, dto);
    }
};
exports.AssetUnitsController = AssetUnitsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [asset_unit_dto_1.CreateAssetUnitDto]),
    __metadata("design:returntype", void 0)
], AssetUnitsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [asset_unit_dto_1.AssetUnitQueryDto]),
    __metadata("design:returntype", void 0)
], AssetUnitsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AssetUnitsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('tag/:assetTag'),
    __param(0, (0, common_1.Param)('assetTag')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AssetUnitsController.prototype, "findByTag", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, asset_unit_dto_1.UpdateAssetUnitDto]),
    __metadata("design:returntype", void 0)
], AssetUnitsController.prototype, "update", null);
exports.AssetUnitsController = AssetUnitsController = __decorate([
    (0, common_1.Controller)('api/asset-units'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [asset_units_service_1.AssetUnitsService])
], AssetUnitsController);
//# sourceMappingURL=asset-units.controller.js.map