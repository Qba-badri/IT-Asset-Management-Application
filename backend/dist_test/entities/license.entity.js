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
exports.License = void 0;
const typeorm_1 = require("typeorm");
const license_assignment_entity_1 = require("./license-assignment.entity");
const license_renewal_entity_1 = require("./license-renewal.entity");
const vendor_entity_1 = require("./vendor.entity");
const license_plan_entity_1 = require("./license-plan.entity");
let License = class License {
};
exports.License = License;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], License.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'software_name' }),
    __metadata("design:type", String)
], License.prototype, "softwareName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], License.prototype, "vendor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vendor_id', nullable: true }),
    __metadata("design:type", Number)
], License.prototype, "vendorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => vendor_entity_1.Vendor, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'vendor_id' }),
    __metadata("design:type", vendor_entity_1.Vendor)
], License.prototype, "vendorObj", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'saas_sub' }),
    __metadata("design:type", String)
], License.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'user' }),
    __metadata("design:type", String)
], License.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'plan_name', nullable: true }),
    __metadata("design:type", String)
], License.prototype, "planName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'license_plan_id', nullable: true }),
    __metadata("design:type", Number)
], License.prototype, "licensePlanId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => license_plan_entity_1.LicensePlan, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'license_plan_id' }),
    __metadata("design:type", license_plan_entity_1.LicensePlan)
], License.prototype, "licensePlan", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_key', nullable: true }),
    __metadata("design:type", String)
], License.prototype, "productKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contract_id', nullable: true }),
    __metadata("design:type", String)
], License.prototype, "contractId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tenant_id', nullable: true }),
    __metadata("design:type", String)
], License.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_seats', default: 1 }),
    __metadata("design:type", Number)
], License.prototype, "totalSeats", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'used_seats', default: 0 }),
    __metadata("design:type", Number)
], License.prototype, "usedSeats", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cloud_mode', default: true }),
    __metadata("design:type", Boolean)
], License.prototype, "cloudMode", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'unit_price',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", Number)
], License.prototype, "unitPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'total_cost',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
        nullable: true,
    }),
    __metadata("design:type", Number)
], License.prototype, "totalCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'currency', length: 3, default: 'USD' }),
    __metadata("design:type", String)
], License.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'billing_frequency',
        default: 'monthly',
    }),
    __metadata("design:type", String)
], License.prototype, "billingFrequency", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'commitment_term', nullable: true }),
    __metadata("design:type", String)
], License.prototype, "commitmentTerm", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'purchase_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], License.prototype, "purchaseDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expiry_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], License.prototype, "expiryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'next_renewal_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], License.prototype, "nextRenewalDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notice_period_days', default: 30 }),
    __metadata("design:type", Number)
], License.prototype, "noticePeriodDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'renewal_status', nullable: true }),
    __metadata("design:type", String)
], License.prototype, "renewalStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'compliance_risk', nullable: true }),
    __metadata("design:type", String)
], License.prototype, "complianceRisk", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], License.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => license_assignment_entity_1.LicenseAssignment, (assignment) => assignment.license),
    __metadata("design:type", Array)
], License.prototype, "assignments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => license_renewal_entity_1.LicenseRenewal, (renewal) => renewal.license),
    __metadata("design:type", Array)
], License.prototype, "renewals", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], License.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], License.prototype, "updatedAt", void 0);
exports.License = License = __decorate([
    (0, typeorm_1.Entity)('licenses')
], License);
//# sourceMappingURL=license.entity.js.map