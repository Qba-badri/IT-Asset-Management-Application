"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetUnitsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const asset_units_controller_1 = require("./asset-units.controller");
const asset_units_service_1 = require("./asset-units.service");
const asset_unit_entity_1 = require("../entities/asset-unit.entity");
const catalog_item_entity_1 = require("../entities/catalog-item.entity");
let AssetUnitsModule = class AssetUnitsModule {
};
exports.AssetUnitsModule = AssetUnitsModule;
exports.AssetUnitsModule = AssetUnitsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([asset_unit_entity_1.AssetUnit, catalog_item_entity_1.CatalogItem])],
        controllers: [asset_units_controller_1.AssetUnitsController],
        providers: [asset_units_service_1.AssetUnitsService],
        exports: [asset_units_service_1.AssetUnitsService],
    })
], AssetUnitsModule);
//# sourceMappingURL=asset-units.module.js.map