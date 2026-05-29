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
exports.InventoryTransaction = exports.InventoryTransactionType = void 0;
const typeorm_1 = require("typeorm");
const inventory_item_entity_1 = require("./inventory-item.entity");
const user_entity_1 = require("./user.entity");
var InventoryTransactionType;
(function (InventoryTransactionType) {
    InventoryTransactionType["IN"] = "IN";
    InventoryTransactionType["OUT"] = "OUT";
    InventoryTransactionType["RETURN"] = "RETURN";
    InventoryTransactionType["ADJUSTMENT"] = "ADJUSTMENT";
})(InventoryTransactionType || (exports.InventoryTransactionType = InventoryTransactionType = {}));
let InventoryTransaction = class InventoryTransaction {
};
exports.InventoryTransaction = InventoryTransaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], InventoryTransaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'item_id', type: 'int' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], InventoryTransaction.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => inventory_item_entity_1.InventoryItem, (item) => item.transactions),
    (0, typeorm_1.JoinColumn)({ name: 'item_id' }),
    __metadata("design:type", inventory_item_entity_1.InventoryItem)
], InventoryTransaction.prototype, "item", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: InventoryTransactionType,
    }),
    __metadata("design:type", String)
], InventoryTransaction.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], InventoryTransaction.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reference_id', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], InventoryTransaction.prototype, "referenceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reference_type', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], InventoryTransaction.prototype, "referenceType", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'transaction_date' }),
    __metadata("design:type", Date)
], InventoryTransaction.prototype, "transactionDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'performed_by_id', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], InventoryTransaction.prototype, "performedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'performed_by_id' }),
    __metadata("design:type", user_entity_1.User)
], InventoryTransaction.prototype, "performedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], InventoryTransaction.prototype, "notes", void 0);
exports.InventoryTransaction = InventoryTransaction = __decorate([
    (0, typeorm_1.Entity)('inventory_transactions')
], InventoryTransaction);
//# sourceMappingURL=inventory-transaction.entity.js.map