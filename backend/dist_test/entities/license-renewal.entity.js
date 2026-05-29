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
exports.LicenseRenewal = void 0;
const typeorm_1 = require("typeorm");
const license_entity_1 = require("./license.entity");
let LicenseRenewal = class LicenseRenewal {
};
exports.LicenseRenewal = LicenseRenewal;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], LicenseRenewal.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'license_id' }),
    __metadata("design:type", Number)
], LicenseRenewal.prototype, "licenseId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => license_entity_1.License, (license) => license.renewals, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'license_id' }),
    __metadata("design:type", license_entity_1.License)
], LicenseRenewal.prototype, "license", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'old_expiry_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], LicenseRenewal.prototype, "oldExpiryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'new_expiry_date', type: 'date' }),
    __metadata("design:type", Date)
], LicenseRenewal.prototype, "newExpiryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cost_change', type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], LicenseRenewal.prototype, "costChange", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], LicenseRenewal.prototype, "remarks", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'renewed_by', nullable: true }),
    __metadata("design:type", Number)
], LicenseRenewal.prototype, "renewedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'renewed_at' }),
    __metadata("design:type", Date)
], LicenseRenewal.prototype, "renewedAt", void 0);
exports.LicenseRenewal = LicenseRenewal = __decorate([
    (0, typeorm_1.Entity)('license_renewals')
], LicenseRenewal);
//# sourceMappingURL=license-renewal.entity.js.map