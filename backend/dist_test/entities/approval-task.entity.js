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
exports.ApprovalTask = exports.ApprovalStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var ApprovalStatus;
(function (ApprovalStatus) {
    ApprovalStatus["PENDING"] = "pending";
    ApprovalStatus["APPROVED"] = "approved";
    ApprovalStatus["REJECTED"] = "rejected";
    ApprovalStatus["SENT_BACK"] = "sent_back";
})(ApprovalStatus || (exports.ApprovalStatus = ApprovalStatus = {}));
let ApprovalTask = class ApprovalTask {
};
exports.ApprovalTask = ApprovalTask;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ApprovalTask.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_entity_type' }),
    __metadata("design:type", String)
], ApprovalTask.prototype, "targetEntityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_entity_id' }),
    __metadata("design:type", Number)
], ApprovalTask.prototype, "targetEntityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'approver_id', nullable: true }),
    __metadata("design:type", Number)
], ApprovalTask.prototype, "approverId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'approver_id' }),
    __metadata("design:type", user_entity_1.User)
], ApprovalTask.prototype, "approver", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'approver_role_id', nullable: true }),
    __metadata("design:type", Number)
], ApprovalTask.prototype, "approverRoleId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ApprovalStatus,
        default: ApprovalStatus.PENDING,
    }),
    __metadata("design:type", String)
], ApprovalTask.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ApprovalTask.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], ApprovalTask.prototype, "sequence", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_current', default: false }),
    __metadata("design:type", Boolean)
], ApprovalTask.prototype, "isCurrent", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ApprovalTask.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ApprovalTask.prototype, "updatedAt", void 0);
exports.ApprovalTask = ApprovalTask = __decorate([
    (0, typeorm_1.Entity)('approval_tasks')
], ApprovalTask);
//# sourceMappingURL=approval-task.entity.js.map