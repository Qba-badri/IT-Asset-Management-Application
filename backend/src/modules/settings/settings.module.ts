import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { SystemSetting } from '../../entities/system-setting.entity';
import { IntegrationSetting } from '../../entities/integration-setting.entity';
import { IntegrationSettingsService } from './integration-settings.service';
import { IntegrationSettingsController } from './integration-settings.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SystemSetting, IntegrationSetting]),
    forwardRef(() => MailModule),
  ],
  // IntegrationSettingsController must be registered before SettingsController
  // so 'settings/integrations' is not swallowed by the 'settings/:key' route.
  controllers: [IntegrationSettingsController, SettingsController],
  providers: [SettingsService, IntegrationSettingsService],
  exports: [SettingsService, IntegrationSettingsService],
})
export class SettingsModule {}
