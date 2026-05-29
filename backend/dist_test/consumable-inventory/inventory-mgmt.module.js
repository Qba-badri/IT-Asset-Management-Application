"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryManagementModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const inventory_mgmt_controller_1 = require("./inventory-mgmt.controller");
const inventory_mgmt_service_1 = require("./inventory-mgmt.service");
const inventory_category_entity_1 = require("../entities/inventory-category.entity");
const inventory_item_entity_1 = require("../entities/inventory-item.entity");
const inventory_purchase_entity_1 = require("../entities/inventory-purchase.entity");
const inventory_assignment_entity_1 = require("../entities/inventory-assignment.entity");
const inventory_return_entity_1 = require("../entities/inventory-return.entity");
const inventory_transaction_entity_1 = require("../entities/inventory-transaction.entity");
const auth_module_1 = require("../auth/auth.module");
let InventoryManagementModule = class InventoryManagementModule {
};
exports.InventoryManagementModule = InventoryManagementModule;
exports.InventoryManagementModule = InventoryManagementModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                inventory_category_entity_1.InventoryCategory,
                inventory_item_entity_1.InventoryItem,
                inventory_purchase_entity_1.InventoryPurchase,
                inventory_assignment_entity_1.InventoryAssignment,
                inventory_return_entity_1.InventoryReturn,
                inventory_transaction_entity_1.InventoryTransaction,
            ]),
            auth_module_1.AuthModule,
        ],
        controllers: [inventory_mgmt_controller_1.InventoryManagementController],
        providers: [inventory_mgmt_service_1.InventoryManagementService],
        exports: [inventory_mgmt_service_1.InventoryManagementService],
    })
], InventoryManagementModule);
//# sourceMappingURL=inventory-mgmt.module.js.map