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
exports.InventoryPurchase = void 0;
const typeorm_1 = require("typeorm");
const inventory_item_entity_1 = require("./inventory-item.entity");
let InventoryPurchase = class InventoryPurchase {
};
exports.InventoryPurchase = InventoryPurchase;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], InventoryPurchase.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vendor_name', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], InventoryPurchase.prototype, "vendorName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invoice_number', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], InventoryPurchase.prototype, "invoiceNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'purchase_date', type: 'timestamp' }),
    __metadata("design:type", Date)
], InventoryPurchase.prototype, "purchaseDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'item_id', type: 'int' }),
    __metadata("design:type", Number)
], InventoryPurchase.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => inventory_item_entity_1.InventoryItem),
    (0, typeorm_1.JoinColumn)({ name: 'item_id' }),
    __metadata("design:type", inventory_item_entity_1.InventoryItem)
], InventoryPurchase.prototype, "item", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], InventoryPurchase.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unit_cost', type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], InventoryPurchase.prototype, "unitCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_cost', type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], InventoryPurchase.prototype, "totalCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], InventoryPurchase.prototype, "remarks", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, default: 'USD' }),
    __metadata("design:type", String)
], InventoryPurchase.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], InventoryPurchase.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], InventoryPurchase.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at', nullable: true }),
    __metadata("design:type", Date)
], InventoryPurchase.prototype, "deletedAt", void 0);
exports.InventoryPurchase = InventoryPurchase = __decorate([
    (0, typeorm_1.Entity)('inventory_purchases')
], InventoryPurchase);
//# sourceMappingURL=inventory-purchase.entity.js.map