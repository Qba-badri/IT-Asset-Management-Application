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
exports.WorkflowRule = exports.WorkflowRuleType = void 0;
const typeorm_1 = require("typeorm");
var WorkflowRuleType;
(function (WorkflowRuleType) {
    WorkflowRuleType["PROCUREMENT"] = "procurement";
})(WorkflowRuleType || (exports.WorkflowRuleType = WorkflowRuleType = {}));
let WorkflowRule = class WorkflowRule {
};
exports.WorkflowRule = WorkflowRule;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], WorkflowRule.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WorkflowRule.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: WorkflowRuleType,
        default: WorkflowRuleType.PROCUREMENT,
    }),
    __metadata("design:type", String)
], WorkflowRule.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'min_amount',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", Number)
], WorkflowRule.prototype, "minAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'max_amount',
        type: 'decimal',
        precision: 12,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Number)
], WorkflowRule.prototype, "maxAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Array)
], WorkflowRule.prototype, "steps", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true, name: 'is_active' }),
    __metadata("design:type", Boolean)
], WorkflowRule.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], WorkflowRule.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], WorkflowRule.prototype, "updatedAt", void 0);
exports.WorkflowRule = WorkflowRule = __decorate([
    (0, typeorm_1.Entity)('workflow_rules')
], WorkflowRule);
//# sourceMappingURL=workflow-rule.entity.js.map