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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditEventsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_event_entity_1 = require("../entities/audit-event.entity");
let AuditEventsService = class AuditEventsService {
    constructor(auditRepo) {
        this.auditRepo = auditRepo;
    }
    async logEvent(data) {
        const event = this.auditRepo.create({
            ...data,
            metadata: data.metadata || {},
        });
        return this.auditRepo.save(event);
    }
    async findAll(query) {
        const page = query.page || 1;
        const limit = query.limit || 50;
        const skip = (page - 1) * limit;
        const qb = this.auditRepo
            .createQueryBuilder('ae')
            .leftJoinAndSelect('ae.actor', 'actor')
            .skip(skip)
            .take(limit)
            .orderBy('ae.createdAt', 'DESC');
        if (query.action)
            qb.andWhere('ae.action = :action', { action: query.action });
        if (query.entityType)
            qb.andWhere('ae.entityType = :et', { et: query.entityType });
        if (query.entityId)
            qb.andWhere('ae.entityId = :eid', { eid: query.entityId });
        if (query.actorId)
            qb.andWhere('ae.actorId = :aid', { aid: query.actorId });
        if (query.startDate)
            qb.andWhere('ae.createdAt >= :start', { start: query.startDate });
        if (query.endDate)
            qb.andWhere('ae.createdAt <= :end', { end: query.endDate });
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }
    async getEntityTimeline(entityType, entityId) {
        return this.auditRepo.find({
            where: { entityType, entityId },
            relations: ['actor'],
            order: { createdAt: 'DESC' },
        });
    }
};
exports.AuditEventsService = AuditEventsService;
exports.AuditEventsService = AuditEventsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(audit_event_entity_1.AuditEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AuditEventsService);
//# sourceMappingURL=audit-events.service.js.map