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
exports.Assignment = exports.AssignmentStatus = void 0;
const typeorm_1 = require("typeorm");
const catalog_item_entity_1 = require("./catalog-item.entity");
const asset_unit_entity_1 = require("./asset-unit.entity");
const return_transaction_entity_1 = require("./return-transaction.entity");
const location_entity_1 = require("./location.entity");
const department_entity_1 = require("./department.entity");
const user_entity_1 = require("./user.entity");
var AssignmentStatus;
(function (AssignmentStatus) {
    AssignmentStatus["ACTIVE"] = "active";
    AssignmentStatus["RETURNED"] = "returned";
    AssignmentStatus["PARTIALLY_RETURNED"] = "partially_returned";
    AssignmentStatus["OVERDUE"] = "overdue";
    AssignmentStatus["WRITTEN_OFF"] = "written_off";
})(AssignmentStatus || (exports.AssignmentStatus = AssignmentStatus = {}));
let Assignment = class Assignment {
};
exports.Assignment = Assignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Assignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => catalog_item_entity_1.CatalogItem, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'catalogItemId' }),
    __metadata("design:type", catalog_item_entity_1.CatalogItem)
], Assignment.prototype, "catalogItem", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Assignment.prototype, "catalogItemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => asset_unit_entity_1.AssetUnit, { nullable: true, eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'assetUnitId' }),
    __metadata("design:type", asset_unit_entity_1.AssetUnit)
], Assignment.prototype, "assetUnit", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Assignment.prototype, "assetUnitId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'assigneeId' }),
    __metadata("design:type", user_entity_1.User)
], Assignment.prototype, "assignee", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Assignment.prototype, "assigneeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'assignedById' }),
    __metadata("design:type", user_entity_1.User)
], Assignment.prototype, "assignedBy", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Assignment.prototype, "assignedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => location_entity_1.Location, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'locationId' }),
    __metadata("design:type", location_entity_1.Location)
], Assignment.prototype, "issuedFromLocation", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Assignment.prototype, "locationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => department_entity_1.Department, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'departmentId' }),
    __metadata("design:type", department_entity_1.Department)
], Assignment.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Assignment.prototype, "departmentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], Assignment.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Assignment.prototype, "returnedQuantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Assignment.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AssignmentStatus,
        default: AssignmentStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], Assignment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Assignment.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => return_transaction_entity_1.ReturnTransaction, (rt) => rt.assignment),
    __metadata("design:type", Array)
], Assignment.prototype, "returnTransactions", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Assignment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Assignment.prototype, "updatedAt", void 0);
exports.Assignment = Assignment = __decorate([
    (0, typeorm_1.Entity)('assignments'),
    (0, typeorm_1.Index)(['assigneeId', 'status']),
    (0, typeorm_1.Index)(['catalogItemId']),
    (0, typeorm_1.Index)(['assetUnitId']),
    (0, typeorm_1.Index)(['dueDate']),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Check)('"quantity" > 0')
], Assignment);
//# sourceMappingURL=assignment.entity.js.map