import {
  Controller,
  Post,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadGatewayException,
} from '@nestjs/common';
import { QPeopleSyncService } from './qpeople-sync.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('users/sync')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class QPeopleSyncController {
  constructor(private readonly qpeopleSyncService: QPeopleSyncService) {}

  @Post('qpeople')
  @Permissions('users.manage')
  @HttpCode(HttpStatus.OK)
  async syncQPeopleUsers() {
    try {
      return await this.qpeopleSyncService.syncUsers();
    } catch (error) {
      throw new BadGatewayException(error.message);
    }
  }

  @Post('qpeople/test')
  @Permissions('users.manage')
  @HttpCode(HttpStatus.OK)
  async testConnection() {
    try {
      return await this.qpeopleSyncService.testConnection();
    } catch (error) {
      throw new BadGatewayException(error.message);
    }
  }
}
