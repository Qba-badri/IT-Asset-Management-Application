import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { StockByLocation } from '../../entities/stock-by-location.entity';
import { StockLedger, LedgerReason } from '../../entities/stock-ledger.entity';
import { CatalogItem, TrackMode } from '../../entities/catalog-item.entity';
import { AuditEvent, AuditAction } from '../../entities/audit-event.entity';
import {
  AdjustStockDto,
  InitialStockDto,
  StockQueryDto,
  LedgerQueryDto,
} from './dto/stock.dto';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockByLocation)
    private readonly stockRepo: Repository<StockByLocation>,
    @InjectRepository(StockLedger)
    private readonly ledgerRepo: Repository<StockLedger>,
    @InjectRepository(CatalogItem)
    private readonly catalogRepo: Repository<CatalogItem>,
    @InjectRepository(AuditEvent)
    private readonly auditRepo: Repository<AuditEvent>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Set initial stock for a BulkQty catalog item at a location.
   * Creates StockByLocation record and a StockLedger entry.
   */
  async initializeStock(
    dto: InitialStockDto,
    actorId: number,
  ): Promise<StockByLocation> {
    const catalog = await this.catalogRepo.findOne({
      where: { id: dto.catalogItemId },
    });
    if (!catalog)
      throw new NotFoundException(
        `Catalog item #${dto.catalogItemId} not found`,
      );
    if (catalog.trackMode !== TrackMode.BULK_QTY) {
      throw new BadRequestException(
        'Stock initialization is only for BulkQty items',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      let stock = await manager.findOne(StockByLocation, {
        where: { catalogItemId: dto.catalogItemId, locationId: dto.locationId },
      });

      if (stock) {
        throw new BadRequestException(
          'Stock already initialized at this location. Use adjust instead.',
        );
      }

      stock = manager.create(StockByLocation, {
        catalogItemId: dto.catalogItemId,
        locationId: dto.locationId,
        quantity: dto.quantity,
      });
      stock = await manager.save(StockByLocation, stock);

      // Ledger entry
      const ledger = manager.create(StockLedger, {
        catalogItemId: dto.catalogItemId,
        locationId: dto.locationId,
        quantityChange: dto.quantity,
        runningBalance: dto.quantity,
        reason: LedgerReason.INITIAL_STOCK,
        referenceType: 'stock_by_location',
        referenceId: stock.id,
        notes: dto.notes,
        createdById: actorId,
      });
      await manager.save(StockLedger, ledger);

      // Audit event
      const audit = manager.create(AuditEvent, {
        action: AuditAction.CREATE,
        entityType: 'stock',
        entityId: stock.id,
        actorId,
        metadata: {
          catalogItemId: dto.catalogItemId,
          locationId: dto.locationId,
          quantity: dto.quantity,
        },
      });
      await manager.save(AuditEvent, audit);

      return stock;
    });
  }

  /**
   * Admin-only stock adjustment. Writes both a StockLedger entry and AuditEvent.
   */
  async adjustStock(
    dto: AdjustStockDto,
    actorId: number,
  ): Promise<StockByLocation> {
    const catalog = await this.catalogRepo.findOne({
      where: { id: dto.catalogItemId },
    });
    if (!catalog)
      throw new NotFoundException(
        `Catalog item #${dto.catalogItemId} not found`,
      );
    if (catalog.trackMode !== TrackMode.BULK_QTY) {
      throw new BadRequestException(
        'Stock adjustment is only for BulkQty items',
      );
    }
    if (dto.newQuantity < 0) {
      throw new BadRequestException('Stock quantity cannot be negative');
    }

    return this.dataSource.transaction(async (manager) => {
      const stock = await manager.findOne(StockByLocation, {
        where: { catalogItemId: dto.catalogItemId, locationId: dto.locationId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!stock)
        throw new NotFoundException('Stock record not found at this location');

      const oldQty = stock.quantity;
      const quantityChange = dto.newQuantity - oldQty;
      stock.quantity = dto.newQuantity;
      await manager.save(StockByLocation, stock);

      // Ledger entry
      const ledger = manager.create(StockLedger, {
        catalogItemId: dto.catalogItemId,
        locationId: dto.locationId,
        quantityChange,
        runningBalance: dto.newQuantity,
        reason: LedgerReason.ADJUSTMENT,
        referenceType: 'adjustment',
        notes: dto.notes || dto.reason,
        createdById: actorId,
      });
      await manager.save(StockLedger, ledger);

      // Audit event
      const audit = manager.create(AuditEvent, {
        action: AuditAction.ADJUST,
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
      await manager.save(AuditEvent, audit);

      return stock;
    });
  }

  /**
   * Get stock levels across locations, optionally filtered.
   */
  async findAll(
    query: StockQueryDto,
  ): Promise<{ data: StockByLocation[]; total: number }> {
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

  /**
   * Get stock ledger entries (append-only history).
   */
  async getLedger(
    query: LedgerQueryDto,
  ): Promise<{ data: StockLedger[]; total: number }> {
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

  /**
   * Helper: deduct stock within a transaction manager.
   * Used by AssignmentService during issue.
   */
  async deductStockInTransaction(
    manager: any,
    catalogItemId: number,
    locationId: number,
    quantity: number,
    reason: LedgerReason,
    referenceType: string,
    referenceId: number,
    actorId: number,
    notes?: string,
  ): Promise<void> {
    const stock = await manager.findOne(StockByLocation, {
      where: { catalogItemId, locationId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!stock) throw new NotFoundException('Stock not found at this location');
    if (stock.quantity < quantity) {
      throw new BadRequestException(
        `Insufficient stock: available=${stock.quantity}, requested=${quantity}`,
      );
    }

    stock.quantity -= quantity;
    await manager.save(StockByLocation, stock);

    const ledger = manager.create(StockLedger, {
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
    await manager.save(StockLedger, ledger);
  }

  /**
   * Helper: add stock within a transaction manager.
   * Used by AssignmentService during return.
   */
  async addStockInTransaction(
    manager: any,
    catalogItemId: number,
    locationId: number,
    quantity: number,
    reason: LedgerReason,
    referenceType: string,
    referenceId: number,
    actorId: number,
    notes?: string,
  ): Promise<void> {
    let stock = await manager.findOne(StockByLocation, {
      where: { catalogItemId, locationId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!stock) {
      stock = manager.create(StockByLocation, {
        catalogItemId,
        locationId,
        quantity: 0,
      });
      stock = await manager.save(StockByLocation, stock);
    }

    stock.quantity += quantity;
    await manager.save(StockByLocation, stock);

    const ledger = manager.create(StockLedger, {
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
    await manager.save(StockLedger, ledger);
  }
}
