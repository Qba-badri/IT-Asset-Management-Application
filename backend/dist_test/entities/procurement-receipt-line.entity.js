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
exports.ProcurementReceiptLine = void 0;
const typeorm_1 = require("typeorm");
const procurement_receipt_entity_1 = require("./procurement-receipt.entity");
const catalog_item_entity_1 = require("./catalog-item.entity");
let ProcurementReceiptLine = class ProcurementReceiptLine {
};
exports.ProcurementReceiptLine = ProcurementReceiptLine;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ProcurementReceiptLine.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'receipt_id' }),
    __metadata("design:type", Number)
], ProcurementReceiptLine.prototype, "receiptId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => procurement_receipt_entity_1.ProcurementReceipt, (receipt) => receipt.lines, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'receipt_id' }),
    __metadata("design:type", procurement_receipt_entity_1.ProcurementReceipt)
], ProcurementReceiptLine.prototype, "receipt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'catalog_item_id' }),
    __metadata("design:type", Number)
], ProcurementReceiptLine.prototype, "catalogItemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => catalog_item_entity_1.CatalogItem),
    (0, typeorm_1.JoinColumn)({ name: 'catalog_item_id' }),
    __metadata("design:type", catalog_item_entity_1.CatalogItem)
], ProcurementReceiptLine.prototype, "catalogItem", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ProcurementReceiptLine.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", Number)
], ProcurementReceiptLine.prototype, "unitCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ProcurementReceiptLine.prototype, "serialNumbers", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ProcurementReceiptLine.prototype, "assetTags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ProcurementReceiptLine.prototype, "notes", void 0);
exports.ProcurementReceiptLine = ProcurementReceiptLine = __decorate([
    (0, typeorm_1.Entity)('procurement_receipt_lines')
], ProcurementReceiptLine);
//# sourceMappingURL=procurement-receipt-line.entity.js.map