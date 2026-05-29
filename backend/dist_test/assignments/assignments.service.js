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
exports.AssignmentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const assignment_entity_1 = require("../entities/assignment.entity");
const return_transaction_entity_1 = require("../entities/return-transaction.entity");
const catalog_item_entity_1 = require("../entities/catalog-item.entity");
const asset_unit_entity_1 = require("../entities/asset-unit.entity");
const stock_ledger_entity_1 = require("../entities/stock-ledger.entity");
const audit_event_entity_1 = require("../entities/audit-event.entity");
const stock_service_1 = require("../stock/stock.service");
let AssignmentsService = class AssignmentsService {
    constructor(assignmentRepo, returnRepo, catalogRepo, assetUnitRepo, auditRepo, stockService, dataSource) {
        this.assignmentRepo = assignmentRepo;
        this.returnRepo = returnRepo;
        this.catalogRepo = catalogRepo;
        this.assetUnitRepo = assetUnitRepo;
        this.auditRepo = auditRepo;
        this.stockService = stockService;
        this.dataSource = dataSource;
    }
    async issue(dto, actorId) {
        const catalog = await this.catalogRepo.findOne({
            where: { id: dto.catalogItemId },
        });
        if (!catalog)
            throw new common_1.NotFoundException(`Catalog item #${dto.catalogItemId} not found`);
        if (catalog.trackMode === catalog_item_entity_1.TrackMode.SERIALIZED) {
            return this.issueSerialized(dto, catalog, actorId);
        }
        else {
            return this.issueBulk(dto, catalog, actorId);
        }
    }
    async issueSerialized(dto, catalog, actorId) {
        if (!dto.assetUnitId) {
            throw new common_1.BadRequestException('assetUnitId is required for serialized items');
        }
        return this.dataSource.transaction(async (manager) => {
            const unit = await manager.findOne(asset_unit_entity_1.AssetUnit, {
                where: { id: dto.assetUnitId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!unit)
                throw new common_1.NotFoundException(`Asset unit #${dto.assetUnitId} not found`);
            if (unit.catalogItemId !== catalog.id) {
                throw new common_1.BadRequestException('Asset unit does not belong to the specified catalog item');
            }
            if (unit.status !== asset_unit_entity_1.AssetUnitStatus.IN_STOCK) {
                throw new common_1.ConflictException(`Asset unit ${unit.assetTag} is not available (status: ${unit.status})`);
            }
            unit.status = asset_unit_entity_1.AssetUnitStatus.ASSIGNED;
            await manager.save(asset_unit_entity_1.AssetUnit, unit);
            const assignment = manager.create(assignment_entity_1.Assignment, {
                catalogItemId: catalog.id,
                assetUnitId: unit.id,
                assigneeId: dto.assigneeId,
                assignedById: actorId,
                locationId: dto.locationId || unit.locationId,
                departmentId: dto.departmentId,
                quantity: 1,
                returnedQuantity: 0,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
                status: assignment_entity_1.AssignmentStatus.ACTIVE,
                notes: dto.notes,
            });
            const saved = await manager.save(assignment_entity_1.Assignment, assignment);
            const audit = manager.create(audit_event_entity_1.AuditEvent, {
                action: audit_event_entity_1.AuditAction.ISSUE,
                entityType: 'assignment',
                entityId: saved.id,
                actorId,
                metadata: {
                    catalogItemId: catalog.id,
                    catalogItemSku: catalog.sku,
                    catalogItemName: catalog.name,
                    assetUnitId: unit.id,
                    assetTag: unit.assetTag,
                    assigneeId: dto.assigneeId,
                    returnPolicy: catalog.returnPolicy,
                    trackMode: catalog.trackMode,
                    dueDate: dto.dueDate,
                },
            });
            await manager.save(audit_event_entity_1.AuditEvent, audit);
            return saved;
        });
    }
    async issueBulk(dto, catalog, actorId) {
        const quantity = dto.quantity || 1;
        if (!dto.locationId) {
            throw new common_1.BadRequestException('locationId is required for BulkQty items');
        }
        return this.dataSource.transaction(async (manager) => {
            const assignment = manager.create(assignment_entity_1.Assignment, {
                catalogItemId: catalog.id,
                assetUnitId: null,
                assigneeId: dto.assigneeId,
                assignedById: actorId,
                locationId: dto.locationId,
                departmentId: dto.departmentId,
                quantity,
                returnedQuantity: 0,
                dueDate: catalog.returnPolicy === catalog_item_entity_1.ReturnPolicy.RETURNABLE && dto.dueDate
                    ? new Date(dto.dueDate)
                    : null,
                status: assignment_entity_1.AssignmentStatus.ACTIVE,
                notes: dto.notes,
            });
            const saved = await manager.save(assignment_entity_1.Assignment, assignment);
            await this.stockService.deductStockInTransaction(manager, catalog.id, dto.locationId, quantity, stock_ledger_entity_1.LedgerReason.ISSUE, 'assignment', saved.id, actorId, `Issued ${quantity} x ${catalog.sku} to employee #${dto.assigneeId}`);
            const audit = manager.create(audit_event_entity_1.AuditEvent, {
                action: audit_event_entity_1.AuditAction.ISSUE,
                entityType: 'assignment',
                entityId: saved.id,
                actorId,
                metadata: {
                    catalogItemId: catalog.id,
                    catalogItemSku: catalog.sku,
                    catalogItemName: catalog.name,
                    assigneeId: dto.assigneeId,
                    quantity,
                    locationId: dto.locationId,
                    returnPolicy: catalog.returnPolicy,
                    trackMode: catalog.trackMode,
                    dueDate: dto.dueDate,
                },
            });
            await manager.save(audit_event_entity_1.AuditEvent, audit);
            return saved;
        });
    }
    async processReturn(dto, actorId) {
        const assignment = await this.assignmentRepo.findOne({
            where: { id: dto.assignmentId },
            relations: ['catalogItem', 'assetUnit'],
        });
        if (!assignment)
            throw new common_1.NotFoundException(`Assignment #${dto.assignmentId} not found`);
        if (assignment.catalogItem.returnPolicy === catalog_item_entity_1.ReturnPolicy.CONSUMABLE) {
            throw new common_1.BadRequestException('Consumable items cannot be returned');
        }
        if (assignment.catalogItem.returnPolicy === catalog_item_entity_1.ReturnPolicy.ASSIGN_ONCE) {
            throw new common_1.BadRequestException('Permanently assigned items cannot be returned');
        }
        if (assignment.status === assignment_entity_1.AssignmentStatus.RETURNED) {
            throw new common_1.BadRequestException('Assignment is already fully returned');
        }
        if (assignment.status === assignment_entity_1.AssignmentStatus.WRITTEN_OFF) {
            throw new common_1.BadRequestException('Assignment has been written off');
        }
        const returnQty = dto.quantity || 1;
        const remaining = assignment.quantity - assignment.returnedQuantity;
        if (returnQty > remaining) {
            throw new common_1.BadRequestException(`Cannot return ${returnQty} — only ${remaining} items remain to be returned`);
        }
        return this.dataSource.transaction(async (manager) => {
            const rt = manager.create(return_transaction_entity_1.ReturnTransaction, {
                assignmentId: assignment.id,
                quantity: returnQty,
                conditionOnReturn: dto.condition || asset_unit_entity_1.AssetCondition.GOOD,
                returnedById: assignment.assigneeId,
                processedById: actorId,
                notes: dto.notes,
            });
            const savedReturn = await manager.save(return_transaction_entity_1.ReturnTransaction, rt);
            assignment.returnedQuantity += returnQty;
            if (assignment.returnedQuantity >= assignment.quantity) {
                assignment.status = assignment_entity_1.AssignmentStatus.RETURNED;
            }
            else {
                assignment.status = assignment_entity_1.AssignmentStatus.PARTIALLY_RETURNED;
            }
            await manager.save(assignment_entity_1.Assignment, assignment);
            if (assignment.assetUnit) {
                const unit = await manager.findOne(asset_unit_entity_1.AssetUnit, {
                    where: { id: assignment.assetUnitId },
                    lock: { mode: 'pessimistic_write' },
                });
                if (unit) {
                    unit.status = asset_unit_entity_1.AssetUnitStatus.IN_STOCK;
                    unit.condition = dto.condition || asset_unit_entity_1.AssetCondition.GOOD;
                    await manager.save(asset_unit_entity_1.AssetUnit, unit);
                }
            }
            if (assignment.catalogItem.trackMode === catalog_item_entity_1.TrackMode.BULK_QTY) {
                const returnLocationId = dto.returnToLocationId || assignment.locationId;
                await this.stockService.addStockInTransaction(manager, assignment.catalogItemId, returnLocationId, returnQty, stock_ledger_entity_1.LedgerReason.RETURN, 'return_transaction', savedReturn.id, actorId, `Returned ${returnQty} x ${assignment.catalogItem.sku}`);
            }
            const auditAction = returnQty < remaining ? audit_event_entity_1.AuditAction.PARTIAL_RETURN : audit_event_entity_1.AuditAction.RETURN;
            const audit = manager.create(audit_event_entity_1.AuditEvent, {
                action: auditAction,
                entityType: 'return_transaction',
                entityId: savedReturn.id,
                actorId,
                metadata: {
                    assignmentId: assignment.id,
                    catalogItemId: assignment.catalogItemId,
                    catalogItemSku: assignment.catalogItem.sku,
                    assetUnitId: assignment.assetUnitId,
                    returnedQuantity: returnQty,
                    totalReturned: assignment.returnedQuantity,
                    totalIssued: assignment.quantity,
                    condition: dto.condition,
                    assignmentStatus: assignment.status,
                },
            });
            await manager.save(audit_event_entity_1.AuditEvent, audit);
            return savedReturn;
        });
    }
    async transfer(dto, actorId) {
        const assignment = await this.assignmentRepo.findOne({
            where: { id: dto.assignmentId },
            relations: ['catalogItem', 'assetUnit'],
        });
        if (!assignment)
            throw new common_1.NotFoundException(`Assignment #${dto.assignmentId} not found`);
        if (assignment.status !== assignment_entity_1.AssignmentStatus.ACTIVE) {
            throw new common_1.BadRequestException('Only active assignments can be transferred');
        }
        return this.dataSource.transaction(async (manager) => {
            const metadata = {
                assignmentId: assignment.id,
                catalogItemId: assignment.catalogItemId,
            };
            if (dto.toAssigneeId) {
                metadata.fromAssigneeId = assignment.assigneeId;
                metadata.toAssigneeId = dto.toAssigneeId;
                assignment.assigneeId = dto.toAssigneeId;
            }
            if (dto.toLocationId &&
                assignment.catalogItem.trackMode === catalog_item_entity_1.TrackMode.BULK_QTY) {
                const remaining = assignment.quantity - assignment.returnedQuantity;
                metadata.fromLocationId = assignment.locationId;
                metadata.toLocationId = dto.toLocationId;
                await this.stockService.deductStockInTransaction(manager, assignment.catalogItemId, assignment.locationId, remaining, stock_ledger_entity_1.LedgerReason.TRANSFER_OUT, 'assignment', assignment.id, actorId, `Transfer out to location #${dto.toLocationId}`);
                await this.stockService.addStockInTransaction(manager, assignment.catalogItemId, dto.toLocationId, remaining, stock_ledger_entity_1.LedgerReason.TRANSFER_IN, 'assignment', assignment.id, actorId, `Transfer in from location #${assignment.locationId}`);
                assignment.locationId = dto.toLocationId;
            }
            if (dto.toLocationId && assignment.assetUnit) {
                const unit = await manager.findOne(asset_unit_entity_1.AssetUnit, {
                    where: { id: assignment.assetUnitId },
                });
                if (unit) {
                    metadata.fromLocationId = unit.locationId;
                    metadata.toLocationId = dto.toLocationId;
                    unit.locationId = dto.toLocationId;
                    await manager.save(asset_unit_entity_1.AssetUnit, unit);
                }
            }
            assignment.notes = dto.notes
                ? `${assignment.notes || ''}\n[Transfer] ${dto.notes}`.trim()
                : assignment.notes;
            await manager.save(assignment_entity_1.Assignment, assignment);
            const audit = manager.create(audit_event_entity_1.AuditEvent, {
                action: audit_event_entity_1.AuditAction.TRANSFER,
                entityType: 'assignment',
                entityId: assignment.id,
                actorId,
                metadata,
            });
            await manager.save(audit_event_entity_1.AuditEvent, audit);
            return assignment;
        });
    }
    async writeOff(dto, actorId) {
        const assignment = await this.assignmentRepo.findOne({
            where: { id: dto.assignmentId },
            relations: ['catalogItem', 'assetUnit'],
        });
        if (!assignment)
            throw new common_1.NotFoundException(`Assignment #${dto.assignmentId} not found`);
        if ([assignment_entity_1.AssignmentStatus.RETURNED, assignment_entity_1.AssignmentStatus.WRITTEN_OFF].includes(assignment.status)) {
            throw new common_1.BadRequestException(`Assignment is already ${assignment.status}`);
        }
        return this.dataSource.transaction(async (manager) => {
            assignment.status = assignment_entity_1.AssignmentStatus.WRITTEN_OFF;
            await manager.save(assignment_entity_1.Assignment, assignment);
            if (assignment.assetUnit) {
                const unit = await manager.findOne(asset_unit_entity_1.AssetUnit, {
                    where: { id: assignment.assetUnitId },
                });
                if (unit) {
                    unit.status = asset_unit_entity_1.AssetUnitStatus.WRITTEN_OFF;
                    await manager.save(asset_unit_entity_1.AssetUnit, unit);
                }
            }
            if (assignment.catalogItem.trackMode === catalog_item_entity_1.TrackMode.BULK_QTY &&
                assignment.locationId) {
                const remaining = assignment.quantity - assignment.returnedQuantity;
                if (remaining > 0) {
                    const ledger = manager.create(stock_ledger_entity_1.StockLedger, {
                        catalogItemId: assignment.catalogItemId,
                        locationId: assignment.locationId,
                        quantityChange: 0,
                        runningBalance: 0,
                        reason: stock_ledger_entity_1.LedgerReason.WRITE_OFF,
                        referenceType: 'assignment',
                        referenceId: assignment.id,
                        notes: `Write-off: ${dto.reason}`,
                        createdById: actorId,
                    });
                    await manager.save(stock_ledger_entity_1.StockLedger, ledger);
                }
            }
            const audit = manager.create(audit_event_entity_1.AuditEvent, {
                action: audit_event_entity_1.AuditAction.WRITE_OFF,
                entityType: 'assignment',
                entityId: assignment.id,
                actorId,
                metadata: {
                    catalogItemId: assignment.catalogItemId,
                    assetUnitId: assignment.assetUnitId,
                    reason: dto.reason,
                    approvedById: dto.approvedById,
                    remainingQuantity: assignment.quantity - assignment.returnedQuantity,
                },
            });
            await manager.save(audit_event_entity_1.AuditEvent, audit);
            return assignment;
        });
    }
    async getHoldings(query) {
        const page = query.page || 1;
        const limit = query.limit || 25;
        const skip = (page - 1) * limit;
        const qb = this.assignmentRepo
            .createQueryBuilder('a')
            .leftJoinAndSelect('a.catalogItem', 'ci')
            .leftJoinAndSelect('a.assetUnit', 'au')
            .leftJoinAndSelect('a.assignee', 'assignee')
            .leftJoinAndSelect('a.department', 'dept')
            .skip(skip)
            .take(limit)
            .orderBy('a.createdAt', 'DESC');
        const status = query.status || assignment_entity_1.AssignmentStatus.ACTIVE;
        qb.andWhere('a.status IN (:...statuses)', {
            statuses: status === assignment_entity_1.AssignmentStatus.ACTIVE
                ? [
                    assignment_entity_1.AssignmentStatus.ACTIVE,
                    assignment_entity_1.AssignmentStatus.PARTIALLY_RETURNED,
                    assignment_entity_1.AssignmentStatus.OVERDUE,
                ]
                : [status],
        });
        if (query.assigneeId)
            qb.andWhere('a.assigneeId = :uid', { uid: query.assigneeId });
        if (query.departmentId)
            qb.andWhere('a.departmentId = :deptId', { deptId: query.departmentId });
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }
    async getOverdue(query) {
        const page = query.page || 1;
        const limit = query.limit || 25;
        const skip = (page - 1) * limit;
        const now = new Date();
        const qb = this.assignmentRepo
            .createQueryBuilder('a')
            .leftJoinAndSelect('a.catalogItem', 'ci')
            .leftJoinAndSelect('a.assetUnit', 'au')
            .leftJoinAndSelect('a.assignee', 'assignee')
            .where('a.dueDate IS NOT NULL')
            .andWhere('a.dueDate < :now', { now })
            .andWhere('a.status IN (:...statuses)', {
            statuses: [
                assignment_entity_1.AssignmentStatus.ACTIVE,
                assignment_entity_1.AssignmentStatus.PARTIALLY_RETURNED,
                assignment_entity_1.AssignmentStatus.OVERDUE,
            ],
        })
            .skip(skip)
            .take(limit)
            .orderBy('a.dueDate', 'ASC');
        if (query.assigneeId)
            qb.andWhere('a.assigneeId = :uid', { uid: query.assigneeId });
        if (query.departmentId)
            qb.andWhere('a.departmentId = :deptId', { deptId: query.departmentId });
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }
    async findOne(id) {
        const assignment = await this.assignmentRepo.findOne({
            where: { id },
            relations: [
                'catalogItem',
                'assetUnit',
                'assignee',
                'assignedBy',
                'department',
                'returnTransactions',
            ],
        });
        if (!assignment)
            throw new common_1.NotFoundException(`Assignment #${id} not found`);
        return assignment;
    }
};
exports.AssignmentsService = AssignmentsService;
exports.AssignmentsService = AssignmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(assignment_entity_1.Assignment)),
    __param(1, (0, typeorm_1.InjectRepository)(return_transaction_entity_1.ReturnTransaction)),
    __param(2, (0, typeorm_1.InjectRepository)(catalog_item_entity_1.CatalogItem)),
    __param(3, (0, typeorm_1.InjectRepository)(asset_unit_entity_1.AssetUnit)),
    __param(4, (0, typeorm_1.InjectRepository)(audit_event_entity_1.AuditEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        stock_service_1.StockService,
        typeorm_2.DataSource])
], AssignmentsService);
//# sourceMappingURL=assignments.service.js.map