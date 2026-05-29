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
exports.LicenseHistory = exports.LicenseAction = void 0;
const typeorm_1 = require("typeorm");
const license_entity_1 = require("./license.entity");
const user_entity_1 = require("./user.entity");
var LicenseAction;
(function (LicenseAction) {
    LicenseAction["CREATED"] = "created";
    LicenseAction["UPDATED"] = "updated";
    LicenseAction["ASSIGNED"] = "assigned";
    LicenseAction["UNASSIGNED"] = "unassigned";
    LicenseAction["RENEWED"] = "renewed";
    LicenseAction["AUDITED"] = "audited";
    LicenseAction["SEAT_ADJUSTMENT"] = "seat_adjustment";
})(LicenseAction || (exports.LicenseAction = LicenseAction = {}));
let LicenseHistory = class LicenseHistory {
};
exports.LicenseHistory = LicenseHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], LicenseHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'license_id' }),
    __metadata("design:type", Number)
], LicenseHistory.prototype, "licenseId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => license_entity_1.License, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'license_id' }),
    __metadata("design:type", license_entity_1.License)
], LicenseHistory.prototype, "license", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: LicenseAction }),
    __metadata("design:type", String)
], LicenseHistory.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'performed_by_id', nullable: true }),
    __metadata("design:type", Number)
], LicenseHistory.prototype, "performedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'performed_by_id' }),
    __metadata("design:type", user_entity_1.User)
], LicenseHistory.prototype, "performedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assigned_to_id', nullable: true }),
    __metadata("design:type", Number)
], LicenseHistory.prototype, "assignedToId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_to_id' }),
    __metadata("design:type", user_entity_1.User)
], LicenseHistory.prototype, "assignedTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], LicenseHistory.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'action_date' }),
    __metadata("design:type", Date)
], LicenseHistory.prototype, "actionDate", void 0);
exports.LicenseHistory = LicenseHistory = __decorate([
    (0, typeorm_1.Entity)('license_history')
], LicenseHistory);
//# sourceMappingURL=license-history.entity.js.map