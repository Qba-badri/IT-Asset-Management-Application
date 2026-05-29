import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
export declare class AuditLogsService {
    private readonly auditLogRepo;
    constructor(auditLogRepo: Repository<AuditLog>);
    findRecent(limit?: number): Promise<AuditLog[]>;
}
