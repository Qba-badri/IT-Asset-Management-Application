import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AuditEvent, AuditAction } from '../../entities/audit-event.entity';

export interface AuditEventQueryDto {
  action?: AuditAction;
  entityType?: string;
  entityId?: number;
  actorId?: number;
  /** Free-text search by actor first/last name */
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditEventsService {
  constructor(
    @InjectRepository(AuditEvent)
    private readonly auditRepo: Repository<AuditEvent>,
  ) {}

  /**
   * Records an audit event. Pass `manager` to write the event inside the
   * caller's transaction, making the audited change and its audit record
   * atomic — sensitive changes (e.g. status toggles) must not commit without
   * their audit row, and vice versa.
   */
  async logEvent(
    data: {
      action: AuditAction;
      entityType: string;
      entityId?: number;
      actorId?: number;
      metadata?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
    },
    manager?: EntityManager,
  ) {
    const repo = manager ? manager.getRepository(AuditEvent) : this.auditRepo;
    const event = repo.create({
      ...data,
      metadata: data.metadata || {},
    });
    return repo.save(event);
  }

  async findAll(
    query: AuditEventQueryDto,
  ): Promise<{ data: AuditEvent[]; total: number }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 25, 100);
    const skip = (page - 1) * limit;

    const qb = this._buildQuery(query).skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  /**
   * Export all records matching filters — no pagination cap.
   * Used by the CSV export endpoint. Returns max 5 000 rows as a safety guard.
   */
  async exportAll(query: AuditEventQueryDto): Promise<AuditEvent[]> {
    return this._buildQuery(query).take(5000).getMany();
  }

  /**
   * Get all activity for a specific actor (user).
   */
  async findByActor(
    actorId: number,
    query: AuditEventQueryDto = {},
  ): Promise<{ data: AuditEvent[]; total: number }> {
    return this.findAll({ ...query, actorId });
  }

  /**
   * Get timeline for a specific entity (e.g., asset unit or assignment).
   */
  async getEntityTimeline(
    entityType: string,
    entityId: number,
  ): Promise<AuditEvent[]> {
    return this.auditRepo.find({
      where: { entityType, entityId },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
    });
  }

  // ─── Private helpers ─────────────────────────────────────────────

  private _buildQuery(query: AuditEventQueryDto) {
    const qb = this.auditRepo
      .createQueryBuilder('ae')
      .leftJoinAndSelect('ae.actor', 'actor')
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
    if (query.search) {
      qb.andWhere(
        "(LOWER(actor.firstName) LIKE :s OR LOWER(actor.lastName) LIKE :s OR LOWER(actor.email) LIKE :s)",
        { s: `%${query.search.toLowerCase()}%` },
      );
    }

    return qb;
  }
}
