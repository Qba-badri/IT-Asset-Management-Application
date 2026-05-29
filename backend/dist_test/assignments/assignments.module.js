"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const assignments_controller_1 = require("./assignments.controller");
const assignments_service_1 = require("./assignments.service");
const assignment_entity_1 = require("../entities/assignment.entity");
const return_transaction_entity_1 = require("../entities/return-transaction.entity");
const catalog_item_entity_1 = require("../entities/catalog-item.entity");
const asset_unit_entity_1 = require("../entities/asset-unit.entity");
const stock_by_location_entity_1 = require("../entities/stock-by-location.entity");
const stock_ledger_entity_1 = require("../entities/stock-ledger.entity");
const audit_event_entity_1 = require("../entities/audit-event.entity");
const user_entity_1 = require("../entities/user.entity");
const stock_module_1 = require("../stock/stock.module");
let AssignmentsModule = class AssignmentsModule {
};
exports.AssignmentsModule = AssignmentsModule;
exports.AssignmentsModule = AssignmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                assignment_entity_1.Assignment,
                return_transaction_entity_1.ReturnTransaction,
                catalog_item_entity_1.CatalogItem,
                asset_unit_entity_1.AssetUnit,
                stock_by_location_entity_1.StockByLocation,
                stock_ledger_entity_1.StockLedger,
                audit_event_entity_1.AuditEvent,
                user_entity_1.User,
            ]),
            stock_module_1.StockModule,
        ],
        controllers: [assignments_controller_1.AssignmentsController],
        providers: [assignments_service_1.AssignmentsService],
        exports: [assignments_service_1.AssignmentsService],
    })
], AssignmentsModule);
//# sourceMappingURL=assignments.module.js.map