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
exports.CatalogItem = exports.TrackMode = exports.ReturnPolicy = void 0;
const typeorm_1 = require("typeorm");
const category_entity_1 = require("./category.entity");
var ReturnPolicy;
(function (ReturnPolicy) {
    ReturnPolicy["RETURNABLE"] = "returnable";
    ReturnPolicy["CONSUMABLE"] = "consumable";
    ReturnPolicy["ASSIGN_ONCE"] = "assign_once";
})(ReturnPolicy || (exports.ReturnPolicy = ReturnPolicy = {}));
var TrackMode;
(function (TrackMode) {
    TrackMode["SERIALIZED"] = "serialized";
    TrackMode["BULK_QTY"] = "bulk_qty";
})(TrackMode || (exports.TrackMode = TrackMode = {}));
let CatalogItem = class CatalogItem {
};
exports.CatalogItem = CatalogItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], CatalogItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, unique: true }),
    __metadata("design:type", String)
], CatalogItem.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300 }),
    __metadata("design:type", String)
], CatalogItem.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CatalogItem.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => category_entity_1.Category, { nullable: true, eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'categoryId' }),
    __metadata("design:type", category_entity_1.Category)
], CatalogItem.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], CatalogItem.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ReturnPolicy }),
    __metadata("design:type", String)
], CatalogItem.prototype, "returnPolicy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: TrackMode }),
    __metadata("design:type", String)
], CatalogItem.prototype, "trackMode", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, default: 'each' }),
    __metadata("design:type", String)
], CatalogItem.prototype, "unitOfMeasure", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CatalogItem.prototype, "reorderPoint", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], CatalogItem.prototype, "brand", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], CatalogItem.prototype, "model", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], CatalogItem.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], CatalogItem.prototype, "unitCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], CatalogItem.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CatalogItem.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CatalogItem.prototype, "updatedAt", void 0);
exports.CatalogItem = CatalogItem = __decorate([
    (0, typeorm_1.Entity)('catalog_items'),
    (0, typeorm_1.Index)(['sku'], { unique: true }),
    (0, typeorm_1.Index)(['returnPolicy']),
    (0, typeorm_1.Index)(['trackMode']),
    (0, typeorm_1.Index)(['isActive'])
], CatalogItem);
//# sourceMappingURL=catalog-item.entity.js.map