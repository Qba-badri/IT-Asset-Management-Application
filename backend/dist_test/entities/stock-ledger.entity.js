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
exports.StockLedger = exports.LedgerReason = void 0;
const typeorm_1 = require("typeorm");
const catalog_item_entity_1 = require("./catalog-item.entity");
const location_entity_1 = require("./location.entity");
const user_entity_1 = require("./user.entity");
var LedgerReason;
(function (LedgerReason) {
    LedgerReason["INITIAL_STOCK"] = "initial_stock";
    LedgerReason["PROCUREMENT"] = "procurement";
    LedgerReason["ISSUE"] = "issue";
    LedgerReason["RETURN"] = "return";
    LedgerReason["TRANSFER_IN"] = "transfer_in";
    LedgerReason["TRANSFER_OUT"] = "transfer_out";
    LedgerReason["ADJUSTMENT"] = "adjustment";
    LedgerReason["WRITE_OFF"] = "write_off";
    LedgerReason["LOST"] = "lost";
    LedgerReason["DISPOSED"] = "disposed";
})(LedgerReason || (exports.LedgerReason = LedgerReason = {}));
let StockLedger = class StockLedger {
};
exports.StockLedger = StockLedger;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], StockLedger.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => catalog_item_entity_1.CatalogItem),
    (0, typeorm_1.JoinColumn)({ name: 'catalogItemId' }),
    __metadata("design:type", catalog_item_entity_1.CatalogItem)
], StockLedger.prototype, "catalogItem", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], StockLedger.prototype, "catalogItemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => location_entity_1.Location),
    (0, typeorm_1.JoinColumn)({ name: 'locationId' }),
    __metadata("design:type", location_entity_1.Location)
], StockLedger.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], StockLedger.prototype, "locationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], StockLedger.prototype, "quantityChange", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], StockLedger.prototype, "runningBalance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: LedgerReason }),
    __metadata("design:type", String)
], StockLedger.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], StockLedger.prototype, "referenceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], StockLedger.prototype, "referenceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], StockLedger.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'createdById' }),
    __metadata("design:type", user_entity_1.User)
], StockLedger.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], StockLedger.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], StockLedger.prototype, "createdAt", void 0);
exports.StockLedger = StockLedger = __decorate([
    (0, typeorm_1.Entity)('stock_ledger'),
    (0, typeorm_1.Index)(['catalogItemId', 'locationId']),
    (0, typeorm_1.Index)(['createdAt']),
    (0, typeorm_1.Index)(['reason']),
    (0, typeorm_1.Index)(['referenceType', 'referenceId'])
], StockLedger);
//# sourceMappingURL=stock-ledger.entity.js.map