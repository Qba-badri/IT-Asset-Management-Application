import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../entities/audit-log.entity';

@Injectable()
export class AuditLogsService {
    constructor(
        @InjectRepository(AuditLog)
        private readonly auditLogRepo: Repository<AuditLog>,
    ) { }

    async findRecent(limit: number = 10) {
        return this.auditLogRepo.find({
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

    async findByEntity(type: string, id: number) {
        return this.auditLogRepo.find({
            where: { entityType: type, entityId: id },
            order: { createdAt: 'DESC' },
        });
    }
}
