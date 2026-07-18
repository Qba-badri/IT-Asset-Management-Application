import {
  Controller,
  Post,
  UseGuards,
  Get,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AzureSyncService } from './azure-sync.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('users/sync')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AzureSyncController {
  constructor(private readonly azureSyncService: AzureSyncService) {}

  @Post('azure')
  @Permissions('users.manage')
  @HttpCode(HttpStatus.OK)
  async syncAzureUsers() {
    return await this.azureSyncService.syncUsers();
  }

  @Post('azure/test')
  @Permissions('users.manage')
  @HttpCode(HttpStatus.OK)
  async testAzureConnection() {
    return await this.azureSyncService.testConnection();
  }

  @Get('status')
  @Permissions('users.view')
  async getSyncStatus() {
    // This could return the time of last sync if we store it
    return {
      message: 'Service is ready for synchronization',
    };
  }
}
