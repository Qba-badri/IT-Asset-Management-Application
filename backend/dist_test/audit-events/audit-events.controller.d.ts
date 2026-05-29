import { AuditEventsService, AuditEventQueryDto } from './audit-events.service';
export declare class AuditEventsController {
    private readonly auditEventsService;
    constructor(auditEventsService: AuditEventsService);
    findAll(query: AuditEventQueryDto): Promise<{
        data: import("../entities/audit-event.entity").AuditEvent[];
        total: number;
    }>;
    getMyActivity(req: any): Promise<{
        data: import("../entities/audit-event.entity").AuditEvent[];
        total: number;
    }>;
    getEntityTimeline(entityType: string, entityId: number): Promise<import("../entities/audit-event.entity").AuditEvent[]>;
}
