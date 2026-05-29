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
exports.AssetUnit = exports.AssetCondition = exports.AssetUnitStatus = void 0;
const typeorm_1 = require("typeorm");
const catalog_item_entity_1 = require("./catalog-item.entity");
const location_entity_1 = require("./location.entity");
var AssetUnitStatus;
(function (AssetUnitStatus) {
    AssetUnitStatus["IN_STOCK"] = "in_stock";
    AssetUnitStatus["ASSIGNED"] = "assigned";
    AssetUnitStatus["IN_MAINTENANCE"] = "in_maintenance";
    AssetUnitStatus["IN_REPAIR"] = "in_repair";
    AssetUnitStatus["LOST"] = "lost";
    AssetUnitStatus["WRITTEN_OFF"] = "written_off";
    AssetUnitStatus["DISPOSED"] = "disposed";
})(AssetUnitStatus || (exports.AssetUnitStatus = AssetUnitStatus = {}));
var AssetCondition;
(function (AssetCondition) {
    AssetCondition["NEW"] = "new";
    AssetCondition["EXCELLENT"] = "excellent";
    AssetCondition["GOOD"] = "good";
    AssetCondition["FAIR"] = "fair";
    AssetCondition["POOR"] = "poor";
    AssetCondition["DAMAGED"] = "damaged";
})(AssetCondition || (exports.AssetCondition = AssetCondition = {}));
let AssetUnit = class AssetUnit {
};
exports.AssetUnit = AssetUnit;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], AssetUnit.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, unique: true }),
    __metadata("design:type", String)
], AssetUnit.prototype, "assetTag", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => catalog_item_entity_1.CatalogItem, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'catalogItemId' }),
    __metadata("design:type", catalog_item_entity_1.CatalogItem)
], AssetUnit.prototype, "catalogItem", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], AssetUnit.prototype, "catalogItemId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], AssetUnit.prototype, "serialNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AssetUnitStatus,
        default: AssetUnitStatus.IN_STOCK,
    }),
    __metadata("design:type", String)
], AssetUnit.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AssetCondition, default: AssetCondition.NEW }),
    __metadata("design:type", String)
], AssetUnit.prototype, "condition", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => location_entity_1.Location, { nullable: true, eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'locationId' }),
    __metadata("design:type", location_entity_1.Location)
], AssetUnit.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], AssetUnit.prototype, "locationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], AssetUnit.prototype, "purchaseDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], AssetUnit.prototype, "purchaseCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true }),
    __metadata("design:type", String)
], AssetUnit.prototype, "vendor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], AssetUnit.prototype, "warrantyExpiry", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], AssetUnit.prototype, "usefulLifeYears", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], AssetUnit.prototype, "salvageValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AssetUnit.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AssetUnit.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AssetUnit.prototype, "updatedAt", void 0);
exports.AssetUnit = AssetUnit = __decorate([
    (0, typeorm_1.Entity)('asset_units'),
    (0, typeorm_1.Index)(['assetTag'], { unique: true }),
    (0, typeorm_1.Index)(['serialNumber']),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['catalogItemId', 'status'])
], AssetUnit);
//# sourceMappingURL=asset-unit.entity.js.map