import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RbacController } from './rbac.controller';
import { RbacService } from './rbac.service';
import { Role } from '../../entities/role.entity';
import { Permission } from '../../entities/permission.entity';
import { User } from '../../entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { AuditEventsModule } from '../audit-events/audit-events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission, User]),
    AuthModule,
    AuditEventsModule,
  ],
  controllers: [RbacController],
  providers: [RbacService],
  exports: [RbacService],
})
export class RbacModule { }
