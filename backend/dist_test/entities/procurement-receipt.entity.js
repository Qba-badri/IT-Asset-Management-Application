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
exports.ProcurementReceipt = exports.ReceiptStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const purchase_order_entity_1 = require("./purchase-order.entity");
const procurement_receipt_line_entity_1 = require("./procurement-receipt-line.entity");
const location_entity_1 = require("./location.entity");
const vendor_entity_1 = require("./vendor.entity");
var ReceiptStatus;
(function (ReceiptStatus) {
    ReceiptStatus["DRAFT"] = "draft";
    ReceiptStatus["POSTED"] = "posted";
    ReceiptStatus["CANCELLED"] = "cancelled";
})(ReceiptStatus || (exports.ReceiptStatus = ReceiptStatus = {}));
let ProcurementReceipt = class ProcurementReceipt {
};
exports.ProcurementReceipt = ProcurementReceipt;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ProcurementReceipt.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'receipt_number', unique: true }),
    __metadata("design:type", String)
], ProcurementReceipt.prototype, "receiptNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invoice_number', nullable: true }),
    __metadata("design:type", String)
], ProcurementReceipt.prototype, "invoiceNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vendor_id', nullable: true }),
    __metadata("design:type", Number)
], ProcurementReceipt.prototype, "vendorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vendor_entity_1.Vendor),
    (0, typeorm_1.JoinColumn)({ name: 'vendor_id' }),
    __metadata("design:type", vendor_entity_1.Vendor)
], ProcurementReceipt.prototype, "vendor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'po_id', nullable: true }),
    __metadata("design:type", Number)
], ProcurementReceipt.prototype, "poId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => purchase_order_entity_1.PurchaseOrder, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'po_id' }),
    __metadata("design:type", purchase_order_entity_1.PurchaseOrder)
], ProcurementReceipt.prototype, "purchaseOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], ProcurementReceipt.prototype, "receiptDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'location_id', nullable: true }),
    __metadata("design:type", Number)
], ProcurementReceipt.prototype, "locationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => location_entity_1.Location),
    (0, typeorm_1.JoinColumn)({ name: 'location_id' }),
    __metadata("design:type", location_entity_1.Location)
], ProcurementReceipt.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ReceiptStatus,
        default: ReceiptStatus.DRAFT,
    }),
    __metadata("design:type", String)
], ProcurementReceipt.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'received_by_id' }),
    __metadata("design:type", Number)
], ProcurementReceipt.prototype, "receivedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'received_by_id' }),
    __metadata("design:type", user_entity_1.User)
], ProcurementReceipt.prototype, "receivedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ProcurementReceipt.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10, default: 'USD' }),
    __metadata("design:type", String)
], ProcurementReceipt.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => procurement_receipt_line_entity_1.ProcurementReceiptLine, (line) => line.receipt, { cascade: true }),
    __metadata("design:type", Array)
], ProcurementReceipt.prototype, "lines", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ProcurementReceipt.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ProcurementReceipt.prototype, "updatedAt", void 0);
exports.ProcurementReceipt = ProcurementReceipt = __decorate([
    (0, typeorm_1.Entity)('procurement_receipts')
], ProcurementReceipt);
//# sourceMappingURL=procurement-receipt.entity.js.map