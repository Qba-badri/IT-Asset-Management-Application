import { AuditLogsService } from './audit-logs.service';
export declare class AuditLogsController {
    private readonly auditLogsService;
    constructor(auditLogsService: AuditLogsService);
    getRecent(limit?: number): Promise<import("../entities/audit-log.entity").AuditLog[]>;
}
