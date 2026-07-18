import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { Asset } from '../../entities/asset.entity';
import { AssetHistory } from '../../entities/asset-history.entity';
import { AssetPhoto } from '../../entities/asset-photo.entity';
import { User } from '../../entities/user.entity';

import { Category } from '../../entities/category.entity';
import { Brand } from '../../entities/brand.entity';
import { Vendor } from '../../entities/vendor.entity';
import { AuditEvent } from '../../entities/audit-event.entity';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asset, AssetHistory, AssetPhoto, User, Category, Brand, Vendor, AuditEvent]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule { }
