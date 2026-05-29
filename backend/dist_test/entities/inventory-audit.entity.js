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
exports.InventoryAuditDetail = exports.InventoryAudit = exports.AuditStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const inventory_item_entity_1 = require("./inventory-item.entity");
var AuditStatus;
(function (AuditStatus) {
    AuditStatus["IN_PROGRESS"] = "in_progress";
    AuditStatus["COMPLETED"] = "completed";
})(AuditStatus || (exports.AuditStatus = AuditStatus = {}));
let InventoryAudit = class InventoryAudit {
};
exports.InventoryAudit = InventoryAudit;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], InventoryAudit.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'audit_date',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], InventoryAudit.prototype, "auditDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'auditor_id' }),
    __metadata("design:type", Number)
], InventoryAudit.prototype, "auditorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'auditor_id' }),
    __metadata("design:type", user_entity_1.User)
], InventoryAudit.prototype, "auditor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AuditStatus, default: AuditStatus.IN_PROGRESS }),
    __metadata("design:type", String)
], InventoryAudit.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], InventoryAudit.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => InventoryAuditDetail, (detail) => detail.audit, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], InventoryAudit.prototype, "details", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], InventoryAudit.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], InventoryAudit.prototype, "updatedAt", void 0);
exports.InventoryAudit = InventoryAudit = __decorate([
    (0, typeorm_1.Entity)('inventory_audits')
], InventoryAudit);
let InventoryAuditDetail = class InventoryAuditDetail {
};
exports.InventoryAuditDetail = InventoryAuditDetail;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], InventoryAuditDetail.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'audit_id' }),
    __metadata("design:type", Number)
], InventoryAuditDetail.prototype, "auditId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => InventoryAudit, (audit) => audit.details, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'audit_id' }),
    __metadata("design:type", InventoryAudit)
], InventoryAuditDetail.prototype, "audit", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'item_id' }),
    __metadata("design:type", Number)
], InventoryAuditDetail.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => inventory_item_entity_1.InventoryItem),
    (0, typeorm_1.JoinColumn)({ name: 'item_id' }),
    __metadata("design:type", inventory_item_entity_1.InventoryItem)
], InventoryAuditDetail.prototype, "item", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'system_quantity' }),
    __metadata("design:type", Number)
], InventoryAuditDetail.prototype, "systemQuantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'physical_quantity' }),
    __metadata("design:type", Number)
], InventoryAuditDetail.prototype, "physicalQuantity", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], InventoryAuditDetail.prototype, "variance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], InventoryAuditDetail.prototype, "notes", void 0);
exports.InventoryAuditDetail = InventoryAuditDetail = __decorate([
    (0, typeorm_1.Entity)('inventory_audit_details')
], InventoryAuditDetail);
//# sourceMappingURL=inventory-audit.entity.js.map