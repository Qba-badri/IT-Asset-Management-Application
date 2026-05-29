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
exports.StockService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stock_by_location_entity_1 = require("../entities/stock-by-location.entity");
const stock_ledger_entity_1 = require("../entities/stock-ledger.entity");
const catalog_item_entity_1 = require("../entities/catalog-item.entity");
const audit_event_entity_1 = require("../entities/audit-event.entity");
let StockService = class StockService {
    constructor(stockRepo, ledgerRepo, catalogRepo, auditRepo, dataSource) {
        this.stockRepo = stockRepo;
        this.ledgerRepo = ledgerRepo;
        this.catalogRepo = catalogRepo;
        this.auditRepo = auditRepo;
        this.dataSource = dataSource;
    }
    async initializeStock(dto, actorId) {
        const catalog = await this.catalogRepo.findOne({
            where: { id: dto.catalogItemId },
        });
        if (!catalog)
            throw new common_1.NotFoundException(`Catalog item #${dto.catalogItemId} not found`);
        if (catalog.trackMode !== catalog_item_entity_1.TrackMode.BULK_QTY) {
            throw new common_1.BadRequestException('Stock initialization is only for BulkQty items');
        }
        return this.dataSource.transaction(async (manager) => {
            let stock = await manager.findOne(stock_by_location_entity_1.StockByLocation, {
                where: { catalogItemId: dto.catalogItemId, locationId: dto.locationId },
            });
            if (stock) {
                throw new common_1.BadRequestException('Stock already initialized at this location. Use adjust instead.');
            }
            stock = manager.create(stock_by_location_entity_1.StockByLocation, {
                catalogItemId: dto.catalogItemId,
                locationId: dto.locationId,
                quantity: dto.quantity,
            });
            stock = await manager.save(stock_by_location_entity_1.StockByLocation, stock);
            const ledger = manager.create(stock_ledger_entity_1.StockLedger, {
                catalogItemId: dto.catalogItemId,
                locationId: dto.locationId,
                quantityChange: dto.quantity,
                runningBalance: dto.quantity,
                reason: stock_ledger_entity_1.LedgerReason.INITIAL_STOCK,
                referenceType: 'stock_by_location',
                referenceId: stock.id,
                notes: dto.notes,
                createdById: actorId,
            });
            await manager.save(stock_ledger_entity_1.StockLedger, ledger);
            const audit = manager.create(audit_event_entity_1.AuditEvent, {
                action: audit_event_entity_1.AuditAction.CREATE,
                entityType: 'stock',
                entityId: stock.id,
                actorId,
                metadata: {
                    catalogItemId: dto.catalogItemId,
                    locationId: dto.locationId,
                    quantity: dto.quantity,
                },
            });
            await manager.save(audit_event_entity_1.AuditEvent, audit);
            return stock;
        });
    }
    async adjustStock(dto, actorId) {
        const catalog = await this.catalogRepo.findOne({
            where: { id: dto.catalogItemId },
        });
        if (!catalog)
            throw new common_1.NotFoundException(`Catalog item #${dto.catalogItemId} not found`);
        if (catalog.trackMode !== catalog_item_entity_1.TrackMode.BULK_QTY) {
            throw new common_1.BadRequestException('Stock adjustment is only for BulkQty items');
        }
        if (dto.newQuantity < 0) {
            throw new common_1.BadRequestException('Stock quantity cannot be negative');
        }
        return this.dataSource.transaction(async (manager) => {
            const stock = await manager.findOne(stock_by_location_entity_1.StockByLocation, {
                where: { catalogItemId: dto.catalogItemId, locationId: dto.locationId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!stock)
                throw new common_1.NotFoundException('Stock record not found at this location');
            const oldQty = stock.quantity;
            const quantityChange = dto.newQuantity - oldQty;
            stock.quantity = dto.newQuantity;
            await manager.save(stock_by_location_entity_1.StockByLocation, stock);
            const ledger = manager.create(stock_ledger_entity_1.StockLedger, {
                catalogItemId: dto.catalogItemId,
                locationId: dto.locationId,
                quantityChange,
                runningBalance: dto.newQuantity,
                reason: stock_ledger_entity_1.LedgerReason.ADJUSTMENT,
                referenceType: 'adjustment',
                notes: dto.notes || dto.reason,
                createdById: actorId,
            });
            await manager.save(stock_ledger_entity_1.StockLedger, ledger);
            const audit = manager.create(audit_event_entity_1.AuditEvent, {
                action: audit_event_entity_1.AuditAction.ADJUST,
                entityType: 'stock',
                entityId: stock.id,
                actorId,
                metadata: {
                    catalogItemId: dto.catalogItemId,
                    locationId: dto.locationId,
                    oldQuantity: oldQty,
                    newQuantity: dto.newQuantity,
                    change: quantityChange,
                    reason: dto.reason,
                },
            });
            await manager.save(audit_event_entity_1.AuditEvent, audit);
            return stock;
        });
    }
    async findAll(query) {
        const page = query.page || 1;
        const limit = query.limit || 25;
        const skip = (page - 1) * limit;
        const qb = this.stockRepo
            .createQueryBuilder('s')
            .leftJoinAndSelect('s.catalogItem', 'ci')
            .leftJoinAndSelect('s.location', 'loc')
            .skip(skip)
            .take(limit)
            .orderBy('ci.name', 'ASC');
        if (query.catalogItemId)
            qb.andWhere('s.catalogItemId = :catId', { catId: query.catalogItemId });
        if (query.locationId)
            qb.andWhere('s.locationId = :locId', { locId: query.locationId });
        if (query.search) {
            qb.andWhere('(ci.name ILIKE :s OR ci.sku ILIKE :s)', {
                s: `%${query.search}%`,
            });
        }
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }
    async getLedger(query) {
        const page = query.page || 1;
        const limit = query.limit || 50;
        const skip = (page - 1) * limit;
        const qb = this.ledgerRepo
            .createQueryBuilder('sl')
            .leftJoinAndSelect('sl.catalogItem', 'ci')
            .leftJoinAndSelect('sl.location', 'loc')
            .leftJoinAndSelect('sl.createdBy', 'user')
            .skip(skip)
            .take(limit)
            .orderBy('sl.createdAt', 'DESC');
        if (query.catalogItemId)
            qb.andWhere('sl.catalogItemId = :catId', { catId: query.catalogItemId });
        if (query.locationId)
            qb.andWhere('sl.locationId = :locId', { locId: query.locationId });
        if (query.reason)
            qb.andWhere('sl.reason = :reason', { reason: query.reason });
        if (query.startDate)
            qb.andWhere('sl.createdAt >= :start', { start: query.startDate });
        if (query.endDate)
            qb.andWhere('sl.createdAt <= :end', { end: query.endDate });
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }
    async deductStockInTransaction(manager, catalogItemId, locationId, quantity, reason, referenceType, referenceId, actorId, notes) {
        const stock = await manager.findOne(stock_by_location_entity_1.StockByLocation, {
            where: { catalogItemId, locationId },
            lock: { mode: 'pessimistic_write' },
        });
        if (!stock)
            throw new common_1.NotFoundException('Stock not found at this location');
        if (stock.quantity < quantity) {
            throw new common_1.BadRequestException(`Insufficient stock: available=${stock.quantity}, requested=${quantity}`);
        }
        stock.quantity -= quantity;
        await manager.save(stock_by_location_entity_1.StockByLocation, stock);
        const ledger = manager.create(stock_ledger_entity_1.StockLedger, {
            catalogItemId,
            locationId,
            quantityChange: -quantity,
            runningBalance: stock.quantity,
            reason,
            referenceType,
            referenceId,
            notes,
            createdById: actorId,
        });
        await manager.save(stock_ledger_entity_1.StockLedger, ledger);
    }
    async addStockInTransaction(manager, catalogItemId, locationId, quantity, reason, referenceType, referenceId, actorId, notes) {
        let stock = await manager.findOne(stock_by_location_entity_1.StockByLocation, {
            where: { catalogItemId, locationId },
            lock: { mode: 'pessimistic_write' },
        });
        if (!stock) {
            stock = manager.create(stock_by_location_entity_1.StockByLocation, {
                catalogItemId,
                locationId,
                quantity: 0,
            });
            stock = await manager.save(stock_by_location_entity_1.StockByLocation, stock);
        }
        stock.quantity += quantity;
        await manager.save(stock_by_location_entity_1.StockByLocation, stock);
        const ledger = manager.create(stock_ledger_entity_1.StockLedger, {
            catalogItemId,
            locationId,
            quantityChange: quantity,
            runningBalance: stock.quantity,
            reason,
            referenceType,
            referenceId,
            notes,
            createdById: actorId,
        });
        await manager.save(stock_ledger_entity_1.StockLedger, ledger);
    }
};
exports.StockService = StockService;
exports.StockService = StockService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(stock_by_location_entity_1.StockByLocation)),
    __param(1, (0, typeorm_1.InjectRepository)(stock_ledger_entity_1.StockLedger)),
    __param(2, (0, typeorm_1.InjectRepository)(catalog_item_entity_1.CatalogItem)),
    __param(3, (0, typeorm_1.InjectRepository)(audit_event_entity_1.AuditEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], StockService);
//# sourceMappingURL=stock.service.js.map