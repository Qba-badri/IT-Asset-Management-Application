import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEvent, AuditAction } from '../../entities/audit-event.entity';

export interface AuditEventQueryDto {
  action?: AuditAction;
  entityType?: string;
  entityId?: number;
  actorId?: number;
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

  async logEvent(data: {
    action: AuditAction;
    entityType: string;
    entityId?: number;
    actorId?: number;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const event = this.auditRepo.create({
      ...data,
      metadata: data.metadata || {},
    });
    return this.auditRepo.save(event);
  }

  async findAll(
    query: AuditEventQueryDto,
  ): Promise<{ data: AuditEvent[]; total: number }> {
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
    if (query.actorId) qb.andWhere('ae.actorId = :aid', { aid: query.actorId });
    if (query.startDate)
      qb.andWhere('ae.createdAt >= :start', { start: query.startDate });
    if (query.endDate)
      qb.andWhere('ae.createdAt <= :end', { end: query.endDate });

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
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
}
