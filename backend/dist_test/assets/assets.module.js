"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const assets_controller_1 = require("./assets.controller");
const assets_service_1 = require("./assets.service");
const asset_entity_1 = require("../entities/asset.entity");
const asset_history_entity_1 = require("../entities/asset-history.entity");
const asset_photo_entity_1 = require("../entities/asset-photo.entity");
const user_entity_1 = require("../entities/user.entity");
const category_entity_1 = require("../entities/category.entity");
const brand_entity_1 = require("../entities/brand.entity");
const vendor_entity_1 = require("../entities/vendor.entity");
let AssetsModule = class AssetsModule {
};
exports.AssetsModule = AssetsModule;
exports.AssetsModule = AssetsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([asset_entity_1.Asset, asset_history_entity_1.AssetHistory, asset_photo_entity_1.AssetPhoto, user_entity_1.User, category_entity_1.Category, brand_entity_1.Brand, vendor_entity_1.Vendor])],
        controllers: [assets_controller_1.AssetsController],
        providers: [assets_service_1.AssetsService],
        exports: [assets_service_1.AssetsService],
    })
], AssetsModule);
//# sourceMappingURL=assets.module.js.map