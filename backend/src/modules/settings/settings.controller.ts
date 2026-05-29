import { Controller, Get, Put, Body, UseGuards, Param } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';
import { Roles } from '../rbac/roles.decorator';
import { RoleType } from '../rbac/roles.enum';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN) // Assuming admin can see settings
  async getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  @Get(':key')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  async getSetting(@Param('key') key: string) {
    const value = await this.settingsService.getSetting(key);
    return { key, value };
  }

  @Put(':key')
  @Roles(RoleType.SUPER_ADMIN, RoleType.ADMIN)
  async updateSetting(@Param('key') key: string, @Body('value') value: string) {
    return this.settingsService.updateSetting(key, value);
  }
}
