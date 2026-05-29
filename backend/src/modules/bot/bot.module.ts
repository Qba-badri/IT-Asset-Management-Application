import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { Asset } from '../../entities/asset.entity';
import { License } from '../../entities/license.entity';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Asset, License]), SettingsModule],
  controllers: [BotController],
  providers: [BotService],
})
export class BotModule {}
