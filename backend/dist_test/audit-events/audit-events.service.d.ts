import { Repository } from 'typeorm';
import { AuditEvent, AuditAction } from '../entities/audit-event.entity';
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
export declare class AuditEventsService {
    private readonly auditRepo;
    constructor(auditRepo: Repository<AuditEvent>);
    logEvent(data: {
        action: AuditAction;
        entityType: string;
        entityId?: number;
        actorId?: number;
        metadata?: Record<string, any>;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<AuditEvent>;
    findAll(query: AuditEventQueryDto): Promise<{
        data: AuditEvent[];
        total: number;
    }>;
    getEntityTimeline(entityType: string, entityId: number): Promise<AuditEvent[]>;
}
