import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationRecipientsController } from './notification-recipients.controller';
import { MailModule } from '../mail/mail.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationLog } from '../../entities/notification-log.entity';
import { NotificationRecipientConfig } from '../../entities/notification-recipient-config.entity';
import { User } from '../../entities/user.entity';
import { Asset } from '../../entities/asset.entity';
import { License } from '../../entities/license.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationLog, NotificationRecipientConfig, User, Asset, License]),
    MailModule,
    AuthModule,
  ],
  controllers: [NotificationRecipientsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
