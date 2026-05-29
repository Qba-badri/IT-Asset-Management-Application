"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const analytics_service_1 = require("./analytics.service");
const analytics_controller_1 = require("./analytics.controller");
const dashboard_controller_1 = require("./dashboard.controller");
const asset_entity_1 = require("../entities/asset.entity");
const stock_by_location_entity_1 = require("../entities/stock-by-location.entity");
const catalog_item_entity_1 = require("../entities/catalog-item.entity");
const license_entity_1 = require("../entities/license.entity");
const user_entity_1 = require("../entities/user.entity");
const asset_unit_entity_1 = require("../entities/asset-unit.entity");
const inventory_item_entity_1 = require("../entities/inventory-item.entity");
const purchase_order_entity_1 = require("../entities/purchase-order.entity");
const assignment_entity_1 = require("../entities/assignment.entity");
const vendor_entity_1 = require("../entities/vendor.entity");
let AnalyticsModule = class AnalyticsModule {
};
exports.AnalyticsModule = AnalyticsModule;
exports.AnalyticsModule = AnalyticsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                asset_entity_1.Asset,
                stock_by_location_entity_1.StockByLocation,
                catalog_item_entity_1.CatalogItem,
                license_entity_1.License,
                user_entity_1.User,
                asset_unit_entity_1.AssetUnit,
                inventory_item_entity_1.InventoryItem,
                purchase_order_entity_1.PurchaseOrder,
                assignment_entity_1.Assignment,
                vendor_entity_1.Vendor,
            ]),
        ],
        providers: [analytics_service_1.AnalyticsService],
        controllers: [analytics_controller_1.AnalyticsController, dashboard_controller_1.DashboardController],
    })
], AnalyticsModule);
//# sourceMappingURL=analytics.module.js.map