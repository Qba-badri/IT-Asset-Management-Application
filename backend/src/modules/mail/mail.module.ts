import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from './mail.service';
import { SettingsModule } from '../settings/settings.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationTemplate } from '../../entities/notification-template.entity';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationTemplateController } from './notification-template.controller';

@Module({
  imports: [
    forwardRef(() => SettingsModule),
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([NotificationTemplate]),
  ],
  controllers: [NotificationTemplateController],
  providers: [MailService, NotificationTemplateService],
  exports: [MailService],
})
export class MailModule {}
