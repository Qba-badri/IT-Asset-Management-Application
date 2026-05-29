import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { AzureSyncService } from './azure-sync.service';
import { AzureSyncController } from './azure-sync.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    AuthModule,
  ],
  controllers: [UsersController, AzureSyncController],
  providers: [UsersService, AzureSyncService],
  exports: [UsersService, AzureSyncService],
})
export class UsersModule { }
