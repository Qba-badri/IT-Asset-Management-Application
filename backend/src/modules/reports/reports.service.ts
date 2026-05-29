import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockLedger, LedgerReason } from '../../entities/stock-ledger.entity';
import { AuditEvent, AuditAction } from '../../entities/audit-event.entity';
import { Assignment, AssignmentStatus } from '../../entities/assignment.entity';
import { AssetUnit } from '../../entities/asset-unit.entity';

export interface ReportQueryDto {
  startDate?: string;
  endDate?: string;
  catalogItemId?: number;
  locationId?: number;
  page?: number;
  limit?: number;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(StockLedger)
    private readonly ledgerRepo: Repository<StockLedger>,
    @InjectRepository(AuditEvent)
    private readonly auditRepo: Repository<AuditEvent>,
    @InjectRepository(Assignment)
    private readonly assignmentRepo: Repository<Assignment>,
    @InjectRepository(AssetUnit)
    private readonly assetUnitRepo: Repository<AssetUnit>,
  ) {}

  /**
   * GET /reports/ledger
   * Full stock movement history with filters.
   */
  async getLedgerReport(query: ReportQueryDto) {
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

  /**
   * GET /reports/writeoffs
   * All write-off events with context.
   */
  async getWriteOffsReport(query: ReportQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 50;

    const qb = this.assignmentRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.catalogItem', 'ci')
      .leftJoinAndSelect('a.assetUnit', 'au')
      .leftJoinAndSelect('a.assignee', 'assignee')
      .where('a.status = :status', { status: AssignmentStatus.WRITTEN_OFF })
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

  /**
   * GET /reports/asset-history/:assetUnitId
   * Complete lifecycle timeline for a serialized asset.
   */
  async getAssetHistory(assetUnitId: number) {
    // Get all audit events related to this asset unit
    const events = await this.auditRepo
      .createQueryBuilder('ae')
      .leftJoinAndSelect('ae.actor', 'actor')
      .where("ae.metadata->>'assetUnitId' = :id", { id: String(assetUnitId) })
      .orWhere("ae.entityType = 'asset_unit' AND ae.entityId = :eid", {
        eid: assetUnitId,
      })
      .orderBy('ae.createdAt', 'DESC')
      .getMany();

    // Get current asset unit details
    const unit = await this.assetUnitRepo.findOne({
      where: { id: assetUnitId },
      relations: ['catalogItem', 'location'],
    });

    // Get all assignments for this asset
    const assignments = await this.assignmentRepo.find({
      where: { assetUnitId },
      relations: ['assignee', 'returnTransactions'],
      order: { createdAt: 'DESC' },
    });

    return { unit, assignments, events };
  }

  /**
   * Summary statistics for the dashboard.
   */
  async getDashboardSummary() {
    const totalAssetUnits = await this.assetUnitRepo.count();
    const activeAssignments = await this.assignmentRepo.count({
      where: { status: AssignmentStatus.ACTIVE },
    });
    const overdueAssignments = await this.assignmentRepo
      .createQueryBuilder('a')
      .where('a.dueDate IS NOT NULL')
      .andWhere('a.dueDate < :now', { now: new Date() })
      .andWhere('a.status IN (:...s)', {
        s: [
          AssignmentStatus.ACTIVE,
          AssignmentStatus.PARTIALLY_RETURNED,
          AssignmentStatus.OVERDUE,
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
}
