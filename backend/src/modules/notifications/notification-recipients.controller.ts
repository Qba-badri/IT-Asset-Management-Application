import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { NotificationCategory } from '../../entities/notification-recipient-config.entity';
import {
  CreateNotificationRecipientDto,
  UpdateNotificationRecipientDto,
} from './dto/notification-recipient.dto';

@Controller('notifications/recipients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationRecipientsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Permissions('settings.view')
  async list(@Query('type') type?: NotificationCategory) {
    return this.notificationsService.listRecipients(type);
  }

  @Post()
  @Permissions('settings.manage')
  async create(@Body() dto: CreateNotificationRecipientDto) {
    return this.notificationsService.createRecipient(dto);
  }

  @Put(':id')
  @Permissions('settings.manage')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNotificationRecipientDto,
  ) {
    return this.notificationsService.updateRecipient(id, dto);
  }

  @Delete(':id')
  @Permissions('settings.manage')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.deleteRecipient(id);
  }
}
