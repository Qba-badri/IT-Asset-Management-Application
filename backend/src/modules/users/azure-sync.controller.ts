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

@Controller('users/sync')
@UseGuards(JwtAuthGuard)
export class AzureSyncController {
  constructor(private readonly azureSyncService: AzureSyncService) {}

  @Post('azure')
  @HttpCode(HttpStatus.OK)
  async syncAzureUsers() {
    return await this.azureSyncService.syncUsers();
  }

  @Get('status')
  async getSyncStatus() {
    // This could return the time of last sync if we store it
    return {
      message: 'Service is ready for synchronization',
    };
  }
}
