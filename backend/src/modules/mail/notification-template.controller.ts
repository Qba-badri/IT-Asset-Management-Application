import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { NotificationTemplateService, TemplateKey } from './notification-template.service';
import { MailService } from './mail.service';
import { UpdateTemplateDto, SendTestTemplateDto } from './dto/notification-template.dto';

// Sample data used to render a representative preview/test email for each
// template key — mirrors the shapes MailService's send* methods expect.
const SAMPLE_DATA: Record<TemplateKey, Record<string, any>> = {
  [TemplateKey.WARRANTY_EXPIRY]: {
    assetTag: 'LAP-001',
    assetName: 'Sample Laptop',
    warrantyExpiry: new Date().toLocaleDateString(),
    daysRemaining: 7,
  },
  [TemplateKey.LICENSE_EXPIRY]: {
    licenseName: 'Sample Software License',
    expiryDate: new Date().toLocaleDateString(),
    daysRemaining: 15,
  },
  [TemplateKey.LOW_STOCK]: {
    itemName: 'USB Cable',
    currentStock: 2,
    minStockLevel: 5,
    reorderPoint: 10,
  },
  [TemplateKey.ASSIGNMENT]: {
    entityType: 'asset',
    entityName: 'Sample Laptop',
    action: 'assigned',
    verb: 'Assigned',
    performedBy: 'Admin User',
  },
  [TemplateKey.STATUS_CHANGE]: {
    assetTag: 'LAP-001',
    assetName: 'Sample Laptop',
    oldStatus: 'AVAILABLE',
    newStatus: 'IN_REPAIR',
  },
};

function assertValidKey(key: string): TemplateKey {
  if (!Object.values(TemplateKey).includes(key as TemplateKey)) {
    throw new NotFoundException(`Unknown template key: ${key}`);
  }
  return key as TemplateKey;
}

@Controller('notifications/templates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationTemplateController {
  constructor(
    private readonly templateService: NotificationTemplateService,
    private readonly mailService: MailService,
  ) {}

  @Get()
  @Permissions('settings.view')
  async list() {
    return this.templateService.list();
  }

  @Put(':key')
  @Permissions('settings.manage')
  async update(
    @Param('key') key: string,
    @Body() dto: UpdateTemplateDto,
    @Req() req: any,
  ) {
    const templateKey = assertValidKey(key);
    return this.templateService.update(templateKey, dto, req.user?.id ?? null);
  }

  @Post(':key/reset')
  @Permissions('settings.manage')
  async reset(@Param('key') key: string) {
    const templateKey = assertValidKey(key);
    return this.templateService.resetToDefault(templateKey);
  }

  @Post(':key/test')
  @Permissions('settings.manage')
  async sendTest(
    @Param('key') key: string,
    @Body() dto: SendTestTemplateDto,
    @Req() req: any,
  ) {
    const templateKey = assertValidKey(key);
    const email = dto.email || req.user?.email;
    if (!email) {
      throw new BadRequestException('No recipient email available for the test send.');
    }

    try {
      const { subject, bodyHtml } = await this.templateService.render(
        templateKey,
        SAMPLE_DATA[templateKey],
      );
      await this.mailService.sendTemplatedTest(subject, bodyHtml, email);
      return { success: true, message: 'Test email sent to ' + email };
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Failed to send test email');
    }
  }
}
