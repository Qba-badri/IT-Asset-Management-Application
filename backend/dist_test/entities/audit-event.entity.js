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
exports.AuditEvent = exports.AuditAction = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var AuditAction;
(function (AuditAction) {
    AuditAction["ISSUE"] = "issue";
    AuditAction["RETURN"] = "return";
    AuditAction["PARTIAL_RETURN"] = "partial_return";
    AuditAction["TRANSFER"] = "transfer";
    AuditAction["REPAIR_START"] = "repair_start";
    AuditAction["REPAIR_END"] = "repair_end";
    AuditAction["LOST"] = "lost";
    AuditAction["WRITE_OFF"] = "write_off";
    AuditAction["ADJUST"] = "adjust";
    AuditAction["DISPOSE"] = "dispose";
    AuditAction["CREATE"] = "create";
    AuditAction["UPDATE"] = "update";
    AuditAction["DELETE"] = "delete";
    AuditAction["LOGIN"] = "login";
    AuditAction["APPROVAL"] = "approval";
    AuditAction["REJECTION"] = "rejection";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
let AuditEvent = class AuditEvent {
};
exports.AuditEvent = AuditEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], AuditEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AuditAction }),
    __metadata("design:type", String)
], AuditEvent.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], AuditEvent.prototype, "entityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], AuditEvent.prototype, "entityId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'actorId' }),
    __metadata("design:type", user_entity_1.User)
], AuditEvent.prototype, "actor", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], AuditEvent.prototype, "actorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: '{}' }),
    __metadata("design:type", Object)
], AuditEvent.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], AuditEvent.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AuditEvent.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AuditEvent.prototype, "createdAt", void 0);
exports.AuditEvent = AuditEvent = __decorate([
    (0, typeorm_1.Entity)('audit_events'),
    (0, typeorm_1.Index)(['action']),
    (0, typeorm_1.Index)(['entityType', 'entityId']),
    (0, typeorm_1.Index)(['actorId']),
    (0, typeorm_1.Index)(['createdAt']),
    (0, typeorm_1.Index)(['entityType', 'createdAt'])
], AuditEvent);
//# sourceMappingURL=audit-event.entity.js.map