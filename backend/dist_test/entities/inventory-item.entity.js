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
exports.InventoryItem = void 0;
const typeorm_1 = require("typeorm");
const inventory_category_entity_1 = require("./inventory-category.entity");
const inventory_transaction_entity_1 = require("./inventory-transaction.entity");
const inventory_assignment_entity_1 = require("./inventory-assignment.entity");
const inventory_purchase_entity_1 = require("./inventory-purchase.entity");
let InventoryItem = class InventoryItem {
};
exports.InventoryItem = InventoryItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], InventoryItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], InventoryItem.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'category_id', type: 'int' }),
    __metadata("design:type", Number)
], InventoryItem.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => inventory_category_entity_1.InventoryCategory, (category) => category.items),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", inventory_category_entity_1.InventoryCategory)
], InventoryItem.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_refundable', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], InventoryItem.prototype, "isRefundable", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_stock', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], InventoryItem.prototype, "totalStock", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'available_stock', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], InventoryItem.prototype, "availableStock", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'min_stock_level', type: 'int', default: 5 }),
    __metadata("design:type", Number)
], InventoryItem.prototype, "minStockLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], InventoryItem.prototype, "vendor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], InventoryItem.prototype, "supplier", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'active' }),
    __metadata("design:type", String)
], InventoryItem.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], InventoryItem.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], InventoryItem.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at', nullable: true }),
    __metadata("design:type", Date)
], InventoryItem.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => inventory_transaction_entity_1.InventoryTransaction, (tx) => tx.item),
    __metadata("design:type", Array)
], InventoryItem.prototype, "transactions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => inventory_assignment_entity_1.InventoryAssignment, (ca) => ca.item),
    __metadata("design:type", Array)
], InventoryItem.prototype, "assignments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => inventory_purchase_entity_1.InventoryPurchase, (p) => p.item),
    __metadata("design:type", Array)
], InventoryItem.prototype, "purchases", void 0);
exports.InventoryItem = InventoryItem = __decorate([
    (0, typeorm_1.Entity)('inventory_items')
], InventoryItem);
//# sourceMappingURL=inventory-item.entity.js.map