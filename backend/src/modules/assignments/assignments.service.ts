import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, LessThan, In } from 'typeorm';
import { Assignment, AssignmentStatus } from '../../entities/assignment.entity';
import { ReturnTransaction } from '../../entities/return-transaction.entity';
import {
  CatalogItem,
  ReturnPolicy,
  TrackMode,
} from '../../entities/catalog-item.entity';
import {
  AssetUnit,
  AssetUnitStatus,
  AssetCondition,
} from '../../entities/asset-unit.entity';
import { StockByLocation } from '../../entities/stock-by-location.entity';
import { StockLedger, LedgerReason } from '../../entities/stock-ledger.entity';
import { AuditEvent, AuditAction } from '../../entities/audit-event.entity';
import { StockService } from '../stock/stock.service';
import {
  IssueDto,
  ReturnDto,
  TransferDto,
  WriteOffDto,
  HoldingsQueryDto,
  OverdueQueryDto,
} from './dto/assignment.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private readonly assignmentRepo: Repository<Assignment>,
    @InjectRepository(ReturnTransaction)
    private readonly returnRepo: Repository<ReturnTransaction>,
    @InjectRepository(CatalogItem)
    private readonly catalogRepo: Repository<CatalogItem>,
    @InjectRepository(AssetUnit)
    private readonly assetUnitRepo: Repository<AssetUnit>,
    @InjectRepository(AuditEvent)
    private readonly auditRepo: Repository<AuditEvent>,
    private readonly stockService: StockService,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── ISSUE ──────────────────────────────────────────────────────

  async issue(dto: IssueDto, actorId: number): Promise<Assignment> {
    const catalog = await this.catalogRepo.findOne({
      where: { id: dto.catalogItemId },
    });
    if (!catalog)
      throw new NotFoundException(
        `Catalog item #${dto.catalogItemId} not found`,
      );

    // Validate based on TrackMode
    if (catalog.trackMode === TrackMode.SERIALIZED) {
      return this.issueSerialized(dto, catalog, actorId);
    } else {
      return this.issueBulk(dto, catalog, actorId);
    }
  }

  private async issueSerialized(
    dto: IssueDto,
    catalog: CatalogItem,
    actorId: number,
  ): Promise<Assignment> {
    if (!dto.assetUnitId) {
      throw new BadRequestException(
        'assetUnitId is required for serialized items',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // Lock and validate asset unit
      const unit = await manager.findOne(AssetUnit, {
        where: { id: dto.assetUnitId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!unit)
        throw new NotFoundException(`Asset unit #${dto.assetUnitId} not found`);
      if (unit.catalogItemId !== catalog.id) {
        throw new BadRequestException(
          'Asset unit does not belong to the specified catalog item',
        );
      }
      if (unit.status !== AssetUnitStatus.IN_STOCK) {
        throw new ConflictException(
          `Asset unit ${unit.assetTag} is not available (status: ${unit.status})`,
        );
      }

      // Update asset unit status
      unit.status = AssetUnitStatus.ASSIGNED;
      await manager.save(AssetUnit, unit);

      // Create assignment
      const assignment = manager.create(Assignment, {
        catalogItemId: catalog.id,
        assetUnitId: unit.id,
        assigneeId: dto.assigneeId,
        assignedById: actorId,
        locationId: dto.locationId || unit.locationId,
        departmentId: dto.departmentId,
        quantity: 1,
        returnedQuantity: 0,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        status: AssignmentStatus.ACTIVE,
        notes: dto.notes,
      });
      const saved = await manager.save(Assignment, assignment);

      // Audit event
      const audit = manager.create(AuditEvent, {
        action: AuditAction.ISSUE,
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
      await manager.save(AuditEvent, audit);

      return saved;
    }).then(async (saved) => {
      await this.notificationsService.notifyAssignment({
        assignedUserId: dto.assigneeId,
        departmentId: dto.departmentId,
        entityType: 'assignment',
        entityName: `${catalog.name} (unit #${dto.assetUnitId})`,
        action: 'assigned',
      });
      return saved;
    });
  }

  private async issueBulk(
    dto: IssueDto,
    catalog: CatalogItem,
    actorId: number,
  ): Promise<Assignment> {
    const quantity = dto.quantity || 1;
    if (!dto.locationId) {
      throw new BadRequestException('locationId is required for BulkQty items');
    }

    return this.dataSource.transaction(async (manager) => {
      // Create assignment
      const assignment = manager.create(Assignment, {
        catalogItemId: catalog.id,
        assetUnitId: null,
        assigneeId: dto.assigneeId,
        assignedById: actorId,
        locationId: dto.locationId,
        departmentId: dto.departmentId,
        quantity,
        returnedQuantity: 0,
        dueDate:
          catalog.returnPolicy === ReturnPolicy.RETURNABLE && dto.dueDate
            ? new Date(dto.dueDate)
            : null,
        status: AssignmentStatus.ACTIVE,
        notes: dto.notes,
      });
      const saved = await manager.save(Assignment, assignment);

      // Deduct stock
      await this.stockService.deductStockInTransaction(
        manager,
        catalog.id,
        dto.locationId,
        quantity,
        LedgerReason.ISSUE,
        'assignment',
        saved.id,
        actorId,
        `Issued ${quantity} x ${catalog.sku} to employee #${dto.assigneeId}`,
      );

      // Audit event
      const audit = manager.create(AuditEvent, {
        action: AuditAction.ISSUE,
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
      await manager.save(AuditEvent, audit);

      return saved;
    }).then(async (saved) => {
      await this.notificationsService.notifyAssignment({
        assignedUserId: dto.assigneeId,
        departmentId: dto.departmentId,
        entityType: 'assignment',
        entityName: `${catalog.name} x${quantity}`,
        action: 'assigned',
      });
      return saved;
    });
  }

  // ─── RETURN ─────────────────────────────────────────────────────

  async processReturn(
    dto: ReturnDto,
    actorId: number,
  ): Promise<ReturnTransaction> {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: dto.assignmentId },
      relations: ['catalogItem', 'assetUnit'],
    });
    if (!assignment)
      throw new NotFoundException(`Assignment #${dto.assignmentId} not found`);

    // Validate return policy
    if (assignment.catalogItem.returnPolicy === ReturnPolicy.CONSUMABLE) {
      throw new BadRequestException('Consumable items cannot be returned');
    }
    if (assignment.catalogItem.returnPolicy === ReturnPolicy.ASSIGN_ONCE) {
      throw new BadRequestException(
        'Permanently assigned items cannot be returned',
      );
    }
    if (assignment.status === AssignmentStatus.RETURNED) {
      throw new BadRequestException('Assignment is already fully returned');
    }
    if (assignment.status === AssignmentStatus.WRITTEN_OFF) {
      throw new BadRequestException('Assignment has been written off');
    }

    const returnQty = dto.quantity || 1;
    const remaining = assignment.quantity - assignment.returnedQuantity;

    if (returnQty > remaining) {
      throw new BadRequestException(
        `Cannot return ${returnQty} — only ${remaining} items remain to be returned`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // Create return transaction
      const rt = manager.create(ReturnTransaction, {
        assignmentId: assignment.id,
        quantity: returnQty,
        conditionOnReturn: dto.condition || AssetCondition.GOOD,
        returnedById: assignment.assigneeId,
        processedById: actorId,
        notes: dto.notes,
      });
      const savedReturn = await manager.save(ReturnTransaction, rt);

      // Update assignment
      assignment.returnedQuantity += returnQty;
      if (assignment.returnedQuantity >= assignment.quantity) {
        assignment.status = AssignmentStatus.RETURNED;
      } else {
        assignment.status = AssignmentStatus.PARTIALLY_RETURNED;
      }
      await manager.save(Assignment, assignment);

      // For serialized items, update asset unit status
      if (assignment.assetUnit) {
        const unit = await manager.findOne(AssetUnit, {
          where: { id: assignment.assetUnitId },
          lock: { mode: 'pessimistic_write' },
        });
        if (unit) {
          unit.status = AssetUnitStatus.IN_STOCK;
          unit.condition = dto.condition || AssetCondition.GOOD;
          await manager.save(AssetUnit, unit);
        }
      }

      // For BulkQty, add stock back
      if (assignment.catalogItem.trackMode === TrackMode.BULK_QTY) {
        const returnLocationId =
          dto.returnToLocationId || assignment.locationId;
        await this.stockService.addStockInTransaction(
          manager,
          assignment.catalogItemId,
          returnLocationId,
          returnQty,
          LedgerReason.RETURN,
          'return_transaction',
          savedReturn.id,
          actorId,
          `Returned ${returnQty} x ${assignment.catalogItem.sku}`,
        );
      }

      // Audit event
      const auditAction =
        returnQty < remaining ? AuditAction.PARTIAL_RETURN : AuditAction.RETURN;

      const audit = manager.create(AuditEvent, {
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
      await manager.save(AuditEvent, audit);

      return savedReturn;
    }).then(async (savedReturn) => {
      await this.notificationsService.notifyAssignment({
        assignedUserId: assignment.assigneeId,
        departmentId: assignment.departmentId,
        entityType: 'assignment',
        entityName: `${assignment.catalogItem.name} x${returnQty}`,
        action: 'unassigned',
      });
      return savedReturn;
    });
  }

  // ─── TRANSFER ───────────────────────────────────────────────────

  async transfer(dto: TransferDto, actorId: number): Promise<Assignment> {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: dto.assignmentId },
      relations: ['catalogItem', 'assetUnit'],
    });
    if (!assignment)
      throw new NotFoundException(`Assignment #${dto.assignmentId} not found`);
    if (assignment.status !== AssignmentStatus.ACTIVE) {
      throw new BadRequestException(
        'Only active assignments can be transferred',
      );
    }

    const previousAssigneeId = assignment.assigneeId;

    return this.dataSource.transaction(async (manager) => {
      const metadata: Record<string, any> = {
        assignmentId: assignment.id,
        catalogItemId: assignment.catalogItemId,
      };

      // Employee-to-employee transfer
      if (dto.toAssigneeId) {
        metadata.fromAssigneeId = assignment.assigneeId;
        metadata.toAssigneeId = dto.toAssigneeId;
        assignment.assigneeId = dto.toAssigneeId;
      }

      // Location transfer
      if (
        dto.toLocationId &&
        assignment.catalogItem.trackMode === TrackMode.BULK_QTY
      ) {
        const remaining = assignment.quantity - assignment.returnedQuantity;
        metadata.fromLocationId = assignment.locationId;
        metadata.toLocationId = dto.toLocationId;

        // Move stock: deduct from old location, add to new
        await this.stockService.deductStockInTransaction(
          manager,
          assignment.catalogItemId,
          assignment.locationId,
          remaining,
          LedgerReason.TRANSFER_OUT,
          'assignment',
          assignment.id,
          actorId,
          `Transfer out to location #${dto.toLocationId}`,
        );
        await this.stockService.addStockInTransaction(
          manager,
          assignment.catalogItemId,
          dto.toLocationId,
          remaining,
          LedgerReason.TRANSFER_IN,
          'assignment',
          assignment.id,
          actorId,
          `Transfer in from location #${assignment.locationId}`,
        );

        assignment.locationId = dto.toLocationId;
      }

      // For serialized items, update location on the unit
      if (dto.toLocationId && assignment.assetUnit) {
        const unit = await manager.findOne(AssetUnit, {
          where: { id: assignment.assetUnitId },
        });
        if (unit) {
          metadata.fromLocationId = unit.locationId;
          metadata.toLocationId = dto.toLocationId;
          unit.locationId = dto.toLocationId;
          await manager.save(AssetUnit, unit);
        }
      }

      assignment.notes = dto.notes
        ? `${assignment.notes || ''}\n[Transfer] ${dto.notes}`.trim()
        : assignment.notes;

      await manager.save(Assignment, assignment);

      // Audit
      const audit = manager.create(AuditEvent, {
        action: AuditAction.TRANSFER,
        entityType: 'assignment',
        entityId: assignment.id,
        actorId,
        metadata,
      });
      await manager.save(AuditEvent, audit);

      return assignment;
    }).then(async (result) => {
      if (dto.toAssigneeId) {
        if (previousAssigneeId) {
          await this.notificationsService.notifyAssignment({
            assignedUserId: previousAssigneeId,
            departmentId: result.departmentId,
            entityType: 'assignment',
            entityName: result.catalogItem.name,
            action: 'unassigned',
          });
        }
        await this.notificationsService.notifyAssignment({
          assignedUserId: dto.toAssigneeId,
          departmentId: result.departmentId,
          entityType: 'assignment',
          entityName: result.catalogItem.name,
          action: 'assigned',
        });
      }
      return result;
    });
  }

  // ─── WRITE-OFF ──────────────────────────────────────────────────

  async writeOff(dto: WriteOffDto, actorId: number): Promise<Assignment> {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: dto.assignmentId },
      relations: ['catalogItem', 'assetUnit'],
    });
    if (!assignment)
      throw new NotFoundException(`Assignment #${dto.assignmentId} not found`);
    if (
      [AssignmentStatus.RETURNED, AssignmentStatus.WRITTEN_OFF].includes(
        assignment.status,
      )
    ) {
      throw new BadRequestException(
        `Assignment is already ${assignment.status}`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      assignment.status = AssignmentStatus.WRITTEN_OFF;
      await manager.save(Assignment, assignment);

      // Mark serialized unit as written off
      if (assignment.assetUnit) {
        const unit = await manager.findOne(AssetUnit, {
          where: { id: assignment.assetUnitId },
        });
        if (unit) {
          unit.status = AssetUnitStatus.WRITTEN_OFF;
          await manager.save(AssetUnit, unit);
        }
      }

      // Write off stock for bulk items if any remain
      if (
        assignment.catalogItem.trackMode === TrackMode.BULK_QTY &&
        assignment.locationId
      ) {
        const remaining = assignment.quantity - assignment.returnedQuantity;
        if (remaining > 0) {
          // Record the write-off in ledger (do not deduct from stock — it was already deducted at issue)
          const ledger = manager.create(StockLedger, {
            catalogItemId: assignment.catalogItemId,
            locationId: assignment.locationId,
            quantityChange: 0, // No stock change — already deducted
            runningBalance: 0, // Will be overwritten by real balance
            reason: LedgerReason.WRITE_OFF,
            referenceType: 'assignment',
            referenceId: assignment.id,
            notes: `Write-off: ${dto.reason}`,
            createdById: actorId,
          });
          await manager.save(StockLedger, ledger);
        }
      }

      // Audit
      const audit = manager.create(AuditEvent, {
        action: AuditAction.WRITE_OFF,
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
      await manager.save(AuditEvent, audit);

      return assignment;
    }).then(async (result) => {
      await this.notificationsService.notifyStatusChange({
        assignedUserId: result.assigneeId,
        departmentId: result.departmentId,
        assetTag: result.assetUnit?.assetTag || `assignment-${result.id}`,
        assetName: result.catalogItem.name,
        oldStatus: 'ACTIVE',
        newStatus: 'WRITTEN_OFF',
      });
      return result;
    });
  }

  // ─── QUERIES ────────────────────────────────────────────────────

  /**
   * GET /holdings — who has what now
   */
  async getHoldings(
    query: HoldingsQueryDto,
  ): Promise<{ data: Assignment[]; total: number }> {
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

    // Default to active holdings
    const status = query.status || AssignmentStatus.ACTIVE;
    qb.andWhere('a.status IN (:...statuses)', {
      statuses:
        status === AssignmentStatus.ACTIVE
          ? [
              AssignmentStatus.ACTIVE,
              AssignmentStatus.PARTIALLY_RETURNED,
              AssignmentStatus.OVERDUE,
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

  /**
   * GET /overdue — items past due date that haven't been fully returned
   */
  async getOverdue(
    query: OverdueQueryDto,
  ): Promise<{ data: Assignment[]; total: number }> {
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
          AssignmentStatus.ACTIVE,
          AssignmentStatus.PARTIALLY_RETURNED,
          AssignmentStatus.OVERDUE,
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

  async findOne(id: number): Promise<Assignment> {
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
    if (!assignment) throw new NotFoundException(`Assignment #${id} not found`);
    return assignment;
  }
}
