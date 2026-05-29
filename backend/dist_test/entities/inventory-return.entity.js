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
exports.InventoryReturn = void 0;
const typeorm_1 = require("typeorm");
const inventory_assignment_entity_1 = require("./inventory-assignment.entity");
const inventory_item_entity_1 = require("./inventory-item.entity");
const user_entity_1 = require("./user.entity");
let InventoryReturn = class InventoryReturn {
};
exports.InventoryReturn = InventoryReturn;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], InventoryReturn.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assignment_id', type: 'int' }),
    __metadata("design:type", Number)
], InventoryReturn.prototype, "assignmentId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => inventory_assignment_entity_1.InventoryAssignment),
    (0, typeorm_1.JoinColumn)({ name: 'assignment_id' }),
    __metadata("design:type", inventory_assignment_entity_1.InventoryAssignment)
], InventoryReturn.prototype, "assignment", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'item_id', type: 'int' }),
    __metadata("design:type", Number)
], InventoryReturn.prototype, "itemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => inventory_item_entity_1.InventoryItem),
    (0, typeorm_1.JoinColumn)({ name: 'item_id' }),
    __metadata("design:type", inventory_item_entity_1.InventoryItem)
], InventoryReturn.prototype, "item", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'return_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], InventoryReturn.prototype, "returnDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'item_condition', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], InventoryReturn.prototype, "condition", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'approved_by_id', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], InventoryReturn.prototype, "approvedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'approved_by_id' }),
    __metadata("design:type", user_entity_1.User)
], InventoryReturn.prototype, "approvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], InventoryReturn.prototype, "remarks", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], InventoryReturn.prototype, "createdAt", void 0);
exports.InventoryReturn = InventoryReturn = __decorate([
    (0, typeorm_1.Entity)('inventory_returns')
], InventoryReturn);
//# sourceMappingURL=inventory-return.entity.js.map