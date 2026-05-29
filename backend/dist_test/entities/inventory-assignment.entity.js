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
exports.InventoryAssignment = exports.InventoryAssignmentStatus = void 0;
const typeorm_1 = require("typeorm");
const inventory_item_entity_1 = require("./inventory-item.entity");
const user_entity_1 = require("./user.entity");
var InventoryAssignmentStatus;
(function (InventoryAssignmentStatus) {
    InventoryAssignmentStatus["ASSIGNED"] = "assigned";
    InventoryAssignmentStatus["RETURNED"] = "returned";
    InventoryAssignmentStatus["CLOSED"] = "closed";
})(InventoryAssignmentStatus || (exports.InventoryAssignmentStatus = InventoryAssignmentStatus = {}));
let InventoryAssignment = class InventoryAssignment {
};
exports.InventoryAssignment = InventoryAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], InventoryAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'int' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], InventoryAssignment.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], InventoryAssignment.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], InventoryAssignment.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'item_id', type: 'int' }),
    __metadata("design:type", Number)
], InventoryAssignment.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => inventory_item_entity_1.InventoryItem, (item) => item.assignments),
    (0, typeorm_1.JoinColumn)({ name: 'item_id' }),
    __metadata("design:type", inventory_item_entity_1.InventoryItem)
], InventoryAssignment.prototype, "item", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], InventoryAssignment.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assignment_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], InventoryAssignment.prototype, "assignmentDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expected_return_date', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], InventoryAssignment.prototype, "expectedReturnDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: InventoryAssignmentStatus,
        default: InventoryAssignmentStatus.ASSIGNED,
    }),
    __metadata("design:type", String)
], InventoryAssignment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], InventoryAssignment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], InventoryAssignment.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at', nullable: true }),
    __metadata("design:type", Date)
], InventoryAssignment.prototype, "deletedAt", void 0);
exports.InventoryAssignment = InventoryAssignment = __decorate([
    (0, typeorm_1.Entity)('inventory_assignments')
], InventoryAssignment);
//# sourceMappingURL=inventory-assignment.entity.js.map