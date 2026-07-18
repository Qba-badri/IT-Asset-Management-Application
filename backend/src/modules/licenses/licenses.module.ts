import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicensesService } from './licenses.service';
import { LicensesController } from './licenses.controller';
import { License } from '../../entities/license.entity';
import { LicenseAssignment } from '../../entities/license-assignment.entity';
import { LicenseRenewal } from '../../entities/license-renewal.entity';
import { LicenseHistory } from '../../entities/license-history.entity';
import { User } from '../../entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([License, LicenseAssignment, LicenseRenewal, LicenseHistory, User]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [LicensesController],
  providers: [LicensesService],
  exports: [LicensesService],
})
export class LicensesModule { }
