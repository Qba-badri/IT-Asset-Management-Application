import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../../entities/audit-log.entity';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogsController } from './audit-logs.controller';
import { User } from '../../entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([AuditLog, User]),
        AuthModule,
    ],
    controllers: [AuditLogsController],
    providers: [AuditLogsService],
    exports: [AuditLogsService],
})
export class AuditLogsModule { }
