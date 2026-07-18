import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { Department } from '../../entities/department.entity';
import { InventoryAssignment } from '../../entities/inventory-assignment.entity';
import { AzureSyncService } from './azure-sync.service';
import { AzureSyncController } from './azure-sync.controller';
import { QPeopleSyncService } from './qpeople-sync.service';
import { QPeopleSyncController } from './qpeople-sync.controller';
import { AuthModule } from '../auth/auth.module';
import { SettingsModule } from '../settings/settings.module';
import { AuditEventsModule } from '../audit-events/audit-events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Department, InventoryAssignment]),
    AuthModule,
    SettingsModule,
    AuditEventsModule,
  ],
  controllers: [UsersController, AzureSyncController, QPeopleSyncController],
  providers: [UsersService, AzureSyncService, QPeopleSyncService],
  exports: [UsersService, AzureSyncService, QPeopleSyncService],
})
export class UsersModule { }
