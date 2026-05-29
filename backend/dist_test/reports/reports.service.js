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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stock_ledger_entity_1 = require("../entities/stock-ledger.entity");
const audit_event_entity_1 = require("../entities/audit-event.entity");
const assignment_entity_1 = require("../entities/assignment.entity");
const asset_unit_entity_1 = require("../entities/asset-unit.entity");
let ReportsService = class ReportsService {
    constructor(ledgerRepo, auditRepo, assignmentRepo, assetUnitRepo) {
        this.ledgerRepo = ledgerRepo;
        this.auditRepo = auditRepo;
        this.assignmentRepo = assignmentRepo;
        this.assetUnitRepo = assetUnitRepo;
    }
    async getLedgerReport(query) {
        const page = query.page || 1;
        const limit = query.limit || 50;
        const qb = this.ledgerRepo
            .createQueryBuilder('sl')
            .leftJoinAndSelect('sl.catalogItem', 'ci')
            .leftJoinAndSelect('sl.location', 'loc')
            .leftJoinAndSelect('sl.createdBy', 'user')
            .orderBy('sl.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        if (query.startDate)
            qb.andWhere('sl.createdAt >= :start', { start: query.startDate });
        if (query.endDate)
            qb.andWhere('sl.createdAt <= :end', { end: query.endDate });
        if (query.catalogItemId)
            qb.andWhere('sl.catalogItemId = :cid', { cid: query.catalogItemId });
        if (query.locationId)
            qb.andWhere('sl.locationId = :lid', { lid: query.locationId });
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }
    async getWriteOffsReport(query) {
        const page = query.page || 1;
        const limit = query.limit || 50;
        const qb = this.assignmentRepo
            .createQueryBuilder('a')
            .leftJoinAndSelect('a.catalogItem', 'ci')
            .leftJoinAndSelect('a.assetUnit', 'au')
            .leftJoinAndSelect('a.assignee', 'assignee')
            .where('a.status = :status', { status: assignment_entity_1.AssignmentStatus.WRITTEN_OFF })
            .orderBy('a.updatedAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        if (query.startDate)
            qb.andWhere('a.updatedAt >= :start', { start: query.startDate });
        if (query.endDate)
            qb.andWhere('a.updatedAt <= :end', { end: query.endDate });
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }
    async getAssetHistory(assetUnitId) {
        const events = await this.auditRepo
            .createQueryBuilder('ae')
            .leftJoinAndSelect('ae.actor', 'actor')
            .where("ae.metadata->>'assetUnitId' = :id", { id: String(assetUnitId) })
            .orWhere("ae.entityType = 'asset_unit' AND ae.entityId = :eid", {
            eid: assetUnitId,
        })
            .orderBy('ae.createdAt', 'DESC')
            .getMany();
        const unit = await this.assetUnitRepo.findOne({
            where: { id: assetUnitId },
            relations: ['catalogItem', 'location'],
        });
        const assignments = await this.assignmentRepo.find({
            where: { assetUnitId },
            relations: ['assignee', 'returnTransactions'],
            order: { createdAt: 'DESC' },
        });
        return { unit, assignments, events };
    }
    async getDashboardSummary() {
        const totalAssetUnits = await this.assetUnitRepo.count();
        const activeAssignments = await this.assignmentRepo.count({
            where: { status: assignment_entity_1.AssignmentStatus.ACTIVE },
        });
        const overdueAssignments = await this.assignmentRepo
            .createQueryBuilder('a')
            .where('a.dueDate IS NOT NULL')
            .andWhere('a.dueDate < :now', { now: new Date() })
            .andWhere('a.status IN (:...s)', {
            s: [
                assignment_entity_1.AssignmentStatus.ACTIVE,
                assignment_entity_1.AssignmentStatus.PARTIALLY_RETURNED,
                assignment_entity_1.AssignmentStatus.OVERDUE,
            ],
        })
            .getCount();
        const recentEvents = await this.auditRepo.find({
            relations: ['actor'],
            order: { createdAt: 'DESC' },
            take: 10,
        });
        return {
            totalAssetUnits,
            activeAssignments,
            overdueAssignments,
            recentEvents,
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(stock_ledger_entity_1.StockLedger)),
    __param(1, (0, typeorm_1.InjectRepository)(audit_event_entity_1.AuditEvent)),
    __param(2, (0, typeorm_1.InjectRepository)(assignment_entity_1.Assignment)),
    __param(3, (0, typeorm_1.InjectRepository)(asset_unit_entity_1.AssetUnit)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ReportsService);
//# sourceMappingURL=reports.service.js.map