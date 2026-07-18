import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { IntegrationSettingsService } from './integration-settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { MailService } from '../mail/mail.service';

@Controller('settings/integrations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class IntegrationSettingsController {
  constructor(
    private readonly integrationSettingsService: IntegrationSettingsService,
    private readonly mailService: MailService,
  ) {}

  @Get()
  @Permissions('users.manage')
  async list() {
    return this.integrationSettingsService.list();
  }

  @Put()
  @Permissions('users.manage')
  async update(@Body() body: Record<string, string | null>, @Req() req: any) {
    return this.integrationSettingsService.update(body, req.user.id);
  }

  @Post('smtp/test')
  @Permissions('users.manage')
  async testSmtp(@Body() body: { email?: string }, @Req() req: any) {
    const to = body?.email || req.user.email;
    try {
      await this.mailService.sendTestEmail(to);
      return { success: true, message: `Test email sent to ${to}` };
    } catch (error: any) {
      throw new BadRequestException(
        error?.message || 'Failed to send test email',
      );
    }
  }
}
