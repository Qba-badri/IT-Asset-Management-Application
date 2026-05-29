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
exports.Asset = exports.AcquisitionType = exports.AssetCondition = exports.AssetCategory = exports.AssetStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const asset_photo_entity_1 = require("./asset-photo.entity");
const brand_entity_1 = require("./brand.entity");
const vendor_entity_1 = require("./vendor.entity");
var AssetStatus;
(function (AssetStatus) {
    AssetStatus["AVAILABLE"] = "available";
    AssetStatus["DEPLOYED"] = "deployed";
    AssetStatus["MAINTENANCE"] = "maintenance";
    AssetStatus["REPAIR"] = "repair";
    AssetStatus["DISPOSED"] = "disposed";
    AssetStatus["LOST"] = "lost";
    AssetStatus["STOLEN"] = "stolen";
})(AssetStatus || (exports.AssetStatus = AssetStatus = {}));
var AssetCategory;
(function (AssetCategory) {
    AssetCategory["LAPTOP"] = "laptop";
    AssetCategory["DESKTOP"] = "desktop";
    AssetCategory["MOBILE"] = "mobile";
    AssetCategory["TABLET"] = "tablet";
    AssetCategory["PRINTER"] = "printer";
    AssetCategory["MONITOR"] = "monitor";
    AssetCategory["NETWORK"] = "network";
    AssetCategory["SERVER"] = "server";
    AssetCategory["OTHER"] = "other";
})(AssetCategory || (exports.AssetCategory = AssetCategory = {}));
var AssetCondition;
(function (AssetCondition) {
    AssetCondition["NEW"] = "new";
    AssetCondition["EXCELLENT"] = "excellent";
    AssetCondition["GOOD"] = "good";
    AssetCondition["FAIR"] = "fair";
    AssetCondition["POOR"] = "poor";
})(AssetCondition || (exports.AssetCondition = AssetCondition = {}));
var AcquisitionType;
(function (AcquisitionType) {
    AcquisitionType["PURCHASED"] = "purchased";
    AcquisitionType["RENTED"] = "rented";
})(AcquisitionType || (exports.AcquisitionType = AcquisitionType = {}));
let Asset = class Asset {
};
exports.Asset = Asset;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Asset.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'asset_tag', unique: true }),
    __metadata("design:type", String)
], Asset.prototype, "assetTag", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Asset.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "hostname", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], Asset.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "brand", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'brand_id', nullable: true }),
    __metadata("design:type", Number)
], Asset.prototype, "brandId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => brand_entity_1.Brand, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'brand_id' }),
    __metadata("design:type", brand_entity_1.Brand)
], Asset.prototype, "brandObj", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "vendor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vendor_id', nullable: true }),
    __metadata("design:type", Number)
], Asset.prototype, "vendorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vendor_entity_1.Vendor, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'vendor_id' }),
    __metadata("design:type", vendor_entity_1.Vendor)
], Asset.prototype, "vendorObj", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'received_from_vendor_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Asset.prototype, "receivedFromVendorDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'vendor_monthly_rent',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Number)
], Asset.prototype, "vendorMonthlyRent", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "model", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'serial_number', nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "serialNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: AssetStatus.AVAILABLE }),
    __metadata("design:type", String)
], Asset.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: AssetCondition.GOOD }),
    __metadata("design:type", String)
], Asset.prototype, "condition", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'acquisition_type',
        type: 'varchar',
        length: 20,
        default: AcquisitionType.PURCHASED
    }),
    __metadata("design:type", String)
], Asset.prototype, "acquisitionType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'purchase_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Asset.prototype, "purchaseDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'purchase_cost',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Number)
], Asset.prototype, "purchaseCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'warranty_expiry', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Asset.prototype, "warrantyExpiry", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'warranty_start', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Asset.prototype, "warrantyStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'warranty_type', nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "warrantyType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'po_number', nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "poNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invoice_number', nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "invoiceNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cost_center', nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "costCenter", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'business_owner_id', nullable: true }),
    __metadata("design:type", Number)
], Asset.prototype, "businessOwnerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'business_owner_id' }),
    __metadata("design:type", user_entity_1.User)
], Asset.prototype, "businessOwner", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assigned_to_id', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Asset.prototype, "assignedToId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_to_id' }),
    __metadata("design:type", user_entity_1.User)
], Asset.prototype, "assignedTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deployment_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Asset.prototype, "deploymentDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "site", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "building", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "floor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'room_desk', nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "roomDesk", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_maintenance_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Asset.prototype, "lastMaintenanceDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'next_maintenance_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Asset.prototype, "nextMaintenanceDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'maintenance_notes', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "maintenanceNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'maintenance_cycle_days', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Asset.prototype, "maintenanceCycleDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'useful_life_years', type: 'int', default: 3 }),
    __metadata("design:type", Number)
], Asset.prototype, "usefulLifeYears", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'salvage_value',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Number)
], Asset.prototype, "salvageValue", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'current_value',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Number)
], Asset.prototype, "currentValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'disposal_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Asset.prototype, "disposalDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'disposal_method', nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "disposalMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'disposal_notes', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "disposalNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Asset.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Asset.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Asset.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => asset_photo_entity_1.AssetPhoto, (photo) => photo.asset),
    __metadata("design:type", Array)
], Asset.prototype, "photos", void 0);
exports.Asset = Asset = __decorate([
    (0, typeorm_1.Entity)('assets')
], Asset);
//# sourceMappingURL=asset.entity.js.map