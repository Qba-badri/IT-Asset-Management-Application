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
exports.LicensePlan = void 0;
const typeorm_1 = require("typeorm");
const vendor_entity_1 = require("./vendor.entity");
let LicensePlan = class LicensePlan {
};
exports.LicensePlan = LicensePlan;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], LicensePlan.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LicensePlan.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_family', nullable: true }),
    __metadata("design:type", String)
], LicensePlan.prototype, "productFamily", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vendor_id' }),
    __metadata("design:type", Number)
], LicensePlan.prototype, "vendorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vendor_entity_1.Vendor, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'vendor_id' }),
    __metadata("design:type", vendor_entity_1.Vendor)
], LicensePlan.prototype, "vendor", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], LicensePlan.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], LicensePlan.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], LicensePlan.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], LicensePlan.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], LicensePlan.prototype, "updatedAt", void 0);
exports.LicensePlan = LicensePlan = __decorate([
    (0, typeorm_1.Entity)('license_plans')
], LicensePlan);
//# sourceMappingURL=license-plan.entity.js.map