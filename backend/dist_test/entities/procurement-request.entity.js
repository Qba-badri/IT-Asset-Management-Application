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
exports.ProcurementRequest = exports.ProcurementPriority = exports.ProcurementStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const inventory_item_entity_1 = require("./inventory-item.entity");
var ProcurementStatus;
(function (ProcurementStatus) {
    ProcurementStatus["PENDING"] = "pending";
    ProcurementStatus["APPROVED"] = "approved";
    ProcurementStatus["REJECTED"] = "rejected";
    ProcurementStatus["ORDERED"] = "ordered";
    ProcurementStatus["RECEIVED"] = "received";
})(ProcurementStatus || (exports.ProcurementStatus = ProcurementStatus = {}));
var ProcurementPriority;
(function (ProcurementPriority) {
    ProcurementPriority["LOW"] = "low";
    ProcurementPriority["MEDIUM"] = "medium";
    ProcurementPriority["HIGH"] = "high";
    ProcurementPriority["URGENT"] = "urgent";
})(ProcurementPriority || (exports.ProcurementPriority = ProcurementPriority = {}));
let ProcurementRequest = class ProcurementRequest {
};
exports.ProcurementRequest = ProcurementRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ProcurementRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'item_name' }),
    __metadata("design:type", String)
], ProcurementRequest.prototype, "itemName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ProcurementRequest.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ProcurementRequest.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'estimated_cost',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Number)
], ProcurementRequest.prototype, "estimatedCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'item_id', nullable: true }),
    __metadata("design:type", Number)
], ProcurementRequest.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => inventory_item_entity_1.InventoryItem, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'item_id' }),
    __metadata("design:type", inventory_item_entity_1.InventoryItem)
], ProcurementRequest.prototype, "item", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ProcurementStatus,
        default: ProcurementStatus.PENDING,
    }),
    __metadata("design:type", String)
], ProcurementRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ProcurementPriority,
        default: ProcurementPriority.MEDIUM,
    }),
    __metadata("design:type", String)
], ProcurementRequest.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'requester_id' }),
    __metadata("design:type", Number)
], ProcurementRequest.prototype, "requesterId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'requester_id' }),
    __metadata("design:type", user_entity_1.User)
], ProcurementRequest.prototype, "requester", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'approver_id', nullable: true }),
    __metadata("design:type", Number)
], ProcurementRequest.prototype, "approverId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'approver_id' }),
    __metadata("design:type", user_entity_1.User)
], ProcurementRequest.prototype, "approver", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ProcurementRequest.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ProcurementRequest.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ProcurementRequest.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ProcurementRequest.prototype, "updatedAt", void 0);
exports.ProcurementRequest = ProcurementRequest = __decorate([
    (0, typeorm_1.Entity)('procurement_requests')
], ProcurementRequest);
//# sourceMappingURL=procurement-request.entity.js.map