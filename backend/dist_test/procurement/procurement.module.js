"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcurementModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const procurement_controller_1 = require("./procurement.controller");
const workflow_controller_1 = require("./workflow.controller");
const procurement_service_1 = require("./procurement.service");
const workflow_service_1 = require("./workflow.service");
const procurement_request_entity_1 = require("../entities/procurement-request.entity");
const workflow_rule_entity_1 = require("../entities/workflow-rule.entity");
const approval_task_entity_1 = require("../entities/approval-task.entity");
const purchase_order_entity_1 = require("../entities/purchase-order.entity");
const goods_receipt_entity_1 = require("../entities/goods-receipt.entity");
const assets_module_1 = require("../assets/assets.module");
const audit_log_entity_1 = require("../entities/audit-log.entity");
let ProcurementModule = class ProcurementModule {
};
exports.ProcurementModule = ProcurementModule;
exports.ProcurementModule = ProcurementModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                procurement_request_entity_1.ProcurementRequest,
                workflow_rule_entity_1.WorkflowRule,
                approval_task_entity_1.ApprovalTask,
                purchase_order_entity_1.PurchaseOrder,
                goods_receipt_entity_1.GoodsReceipt,
                audit_log_entity_1.AuditLog,
            ]),
            assets_module_1.AssetsModule,
        ],
        controllers: [procurement_controller_1.ProcurementController, workflow_controller_1.WorkflowController],
        providers: [procurement_service_1.ProcurementService, workflow_service_1.WorkflowService],
        exports: [procurement_service_1.ProcurementService],
    })
], ProcurementModule);
//# sourceMappingURL=procurement.module.js.map