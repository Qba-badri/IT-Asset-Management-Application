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
exports.AssetHistory = exports.AssetAction = void 0;
const typeorm_1 = require("typeorm");
const asset_entity_1 = require("./asset.entity");
const user_entity_1 = require("./user.entity");
var AssetAction;
(function (AssetAction) {
    AssetAction["CREATED"] = "created";
    AssetAction["UPDATED"] = "updated";
    AssetAction["CHECKOUT"] = "checkout";
    AssetAction["CHECKIN"] = "checkin";
    AssetAction["MAINTENANCE_START"] = "maintenance_start";
    AssetAction["MAINTENANCE_END"] = "maintenance_end";
    AssetAction["DISPOSED"] = "disposed";
    AssetAction["LOCATION_CHANGE"] = "location_change";
    AssetAction["DEPRECIATION"] = "depreciation";
})(AssetAction || (exports.AssetAction = AssetAction = {}));
let AssetHistory = class AssetHistory {
};
exports.AssetHistory = AssetHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], AssetHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'asset_id' }),
    __metadata("design:type", Number)
], AssetHistory.prototype, "assetId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => asset_entity_1.Asset, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'asset_id' }),
    __metadata("design:type", asset_entity_1.Asset)
], AssetHistory.prototype, "asset", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AssetAction }),
    __metadata("design:type", String)
], AssetHistory.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'performed_by_id', nullable: true }),
    __metadata("design:type", Number)
], AssetHistory.prototype, "performedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'performed_by_id' }),
    __metadata("design:type", user_entity_1.User)
], AssetHistory.prototype, "performedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assigned_to_id', nullable: true }),
    __metadata("design:type", Number)
], AssetHistory.prototype, "assignedToId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_to_id' }),
    __metadata("design:type", user_entity_1.User)
], AssetHistory.prototype, "assignedTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AssetHistory.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AssetHistory.prototype, "changes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AssetHistory.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'action_date' }),
    __metadata("design:type", Date)
], AssetHistory.prototype, "actionDate", void 0);
exports.AssetHistory = AssetHistory = __decorate([
    (0, typeorm_1.Entity)('asset_history')
], AssetHistory);
//# sourceMappingURL=asset-history.entity.js.map