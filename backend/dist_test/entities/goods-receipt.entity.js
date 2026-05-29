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
exports.GoodsReceipt = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const purchase_order_entity_1 = require("./purchase-order.entity");
let GoodsReceipt = class GoodsReceipt {
};
exports.GoodsReceipt = GoodsReceipt;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], GoodsReceipt.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'grn_number', unique: true }),
    __metadata("design:type", String)
], GoodsReceipt.prototype, "grnNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'po_id' }),
    __metadata("design:type", Number)
], GoodsReceipt.prototype, "poId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => purchase_order_entity_1.PurchaseOrder),
    (0, typeorm_1.JoinColumn)({ name: 'po_id' }),
    __metadata("design:type", purchase_order_entity_1.PurchaseOrder)
], GoodsReceipt.prototype, "purchaseOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'received_quantity' }),
    __metadata("design:type", Number)
], GoodsReceipt.prototype, "receivedQuantity", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'received_date',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], GoodsReceipt.prototype, "receivedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'received_by_id' }),
    __metadata("design:type", Number)
], GoodsReceipt.prototype, "receivedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'received_by_id' }),
    __metadata("design:type", user_entity_1.User)
], GoodsReceipt.prototype, "receivedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], GoodsReceipt.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assets_created', default: false }),
    __metadata("design:type", Boolean)
], GoodsReceipt.prototype, "assetsCreated", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], GoodsReceipt.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], GoodsReceipt.prototype, "updatedAt", void 0);
exports.GoodsReceipt = GoodsReceipt = __decorate([
    (0, typeorm_1.Entity)('goods_receipts')
], GoodsReceipt);
//# sourceMappingURL=goods-receipt.entity.js.map