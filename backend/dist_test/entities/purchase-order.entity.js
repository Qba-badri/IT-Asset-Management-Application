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
exports.PurchaseOrder = exports.POStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const procurement_request_entity_1 = require("./procurement-request.entity");
var POStatus;
(function (POStatus) {
    POStatus["DRAFT"] = "draft";
    POStatus["ISSUED"] = "issued";
    POStatus["CANCELLED"] = "cancelled";
    POStatus["COMPLETED"] = "completed";
})(POStatus || (exports.POStatus = POStatus = {}));
let PurchaseOrder = class PurchaseOrder {
};
exports.PurchaseOrder = PurchaseOrder;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PurchaseOrder.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'po_number', unique: true }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "poNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'request_id' }),
    __metadata("design:type", Number)
], PurchaseOrder.prototype, "requestId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => procurement_request_entity_1.ProcurementRequest),
    (0, typeorm_1.JoinColumn)({ name: 'request_id' }),
    __metadata("design:type", procurement_request_entity_1.ProcurementRequest)
], PurchaseOrder.prototype, "request", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vendor_name' }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "vendorName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], PurchaseOrder.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: POStatus, default: POStatus.DRAFT }),
    __metadata("design:type", String)
], PurchaseOrder.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by_id' }),
    __metadata("design:type", Number)
], PurchaseOrder.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by_id' }),
    __metadata("design:type", user_entity_1.User)
], PurchaseOrder.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PurchaseOrder.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], PurchaseOrder.prototype, "updatedAt", void 0);
exports.PurchaseOrder = PurchaseOrder = __decorate([
    (0, typeorm_1.Entity)('purchase_orders')
], PurchaseOrder);
//# sourceMappingURL=purchase-order.entity.js.map