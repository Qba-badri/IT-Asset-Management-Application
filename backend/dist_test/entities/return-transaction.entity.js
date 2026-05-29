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
exports.ReturnTransaction = void 0;
const typeorm_1 = require("typeorm");
const assignment_entity_1 = require("./assignment.entity");
const user_entity_1 = require("./user.entity");
const asset_unit_entity_1 = require("./asset-unit.entity");
let ReturnTransaction = class ReturnTransaction {
};
exports.ReturnTransaction = ReturnTransaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ReturnTransaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => assignment_entity_1.Assignment, (a) => a.returnTransactions),
    (0, typeorm_1.JoinColumn)({ name: 'assignmentId' }),
    __metadata("design:type", assignment_entity_1.Assignment)
], ReturnTransaction.prototype, "assignment", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ReturnTransaction.prototype, "assignmentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ReturnTransaction.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: asset_unit_entity_1.AssetCondition, default: asset_unit_entity_1.AssetCondition.GOOD }),
    __metadata("design:type", String)
], ReturnTransaction.prototype, "conditionOnReturn", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'returnedById' }),
    __metadata("design:type", user_entity_1.User)
], ReturnTransaction.prototype, "returnedBy", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ReturnTransaction.prototype, "returnedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'processedById' }),
    __metadata("design:type", user_entity_1.User)
], ReturnTransaction.prototype, "processedBy", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ReturnTransaction.prototype, "processedById", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ReturnTransaction.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ReturnTransaction.prototype, "createdAt", void 0);
exports.ReturnTransaction = ReturnTransaction = __decorate([
    (0, typeorm_1.Entity)('return_transactions'),
    (0, typeorm_1.Index)(['assignmentId']),
    (0, typeorm_1.Index)(['createdAt']),
    (0, typeorm_1.Check)('"quantity" > 0')
], ReturnTransaction);
//# sourceMappingURL=return-transaction.entity.js.map