import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository, IsNull, Not } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { User } from '../../entities/user.entity';
import { Asset } from '../../entities/asset.entity';
import { License } from '../../entities/license.entity';
import { NotificationLog } from '../../entities/notification-log.entity';
import {
  NotificationCategory,
  NotificationRecipientConfig,
  RecipientType,
} from '../../entities/notification-recipient-config.entity';
import {
  CreateNotificationRecipientDto,
  UpdateNotificationRecipientDto,
} from './dto/notification-recipient.dto';

export interface NotifyContext {
  entityType: string;
  entityId: number;
  assignedUserId?: number | null;
  departmentId?: number | null;
  subject: string;
  html: string;
}

// Days-out thresholds scanned by the daily expiry cron.
const EXPIRY_THRESHOLDS = [30, 15, 7];

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationLog)
    private readonly logRepo: Repository<NotificationLog>,
    @InjectRepository(NotificationRecipientConfig)
    private readonly configRepo: Repository<NotificationRecipientConfig>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(License)
    private readonly licenseRepo: Repository<License>,
    private readonly mailService: MailService,
  ) {}

  // ─── Admin CRUD for recipient config ───────────────────────────────

  async listRecipients(type?: NotificationCategory) {
    return this.configRepo.find({
      where: type ? { notificationType: type } : {},
      order: { notificationType: 'ASC', id: 'ASC' },
    });
  }

  async createRecipient(dto: CreateNotificationRecipientDto) {
    const entity = this.configRepo.create({
      notificationType: dto.notificationType,
      recipientType: dto.recipientType,
      recipientValue: dto.recipientValue ?? null,
      isActive: dto.isActive ?? true,
    });
    return this.configRepo.save(entity);
  }

  async updateRecipient(id: number, dto: UpdateNotificationRecipientDto) {
    const entity = await this.configRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`Recipient config #${id} not found`);
    if (dto.recipientValue !== undefined) entity.recipientValue = dto.recipientValue;
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;
    return this.configRepo.save(entity);
  }

  async deleteRecipient(id: number) {
    const entity = await this.configRepo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`Recipient config #${id} not found`);
    await this.configRepo.remove(entity);
    return { message: 'Recipient config deleted' };
  }

  // ─── Recipient resolution + notify() ───────────────────────────────

  /**
   * Resolves the active NotificationRecipientConfig rows for a category into
   * concrete, deduped email addresses.
   */
  private async resolveRecipients(
    category: NotificationCategory,
    context: NotifyContext,
  ): Promise<string[]> {
    const configs = await this.configRepo.find({
      where: { notificationType: category, isActive: true },
    });

    const emails = new Set<string>();

    for (const config of configs) {
      try {
        switch (config.recipientType) {
          case RecipientType.ASSIGNED_USER: {
            if (!context.assignedUserId) break;
            const user = await this.userRepo.findOne({
              where: { id: context.assignedUserId },
            });
            if (user?.email) emails.add(user.email);
            break;
          }
          case RecipientType.DEPARTMENT_ADMIN: {
            if (!context.departmentId) break;
            // Department "admins" are active users in the target department
            // whose role name marks them as an administrator. This mirrors
            // the role-driven (never name-hardcoded-elsewhere) scoping used
            // across the app, using the role name as the one identifying
            // signal for "administrator of this department".
            const admins = await this.userRepo.find({
              where: { departmentId: context.departmentId, isActive: true },
              relations: ['role'],
            });
            admins
              .filter((u) => u.role?.name?.toLowerCase().includes('admin'))
              .forEach((u) => u.email && emails.add(u.email));
            break;
          }
          case RecipientType.STATIC_EMAIL: {
            if (config.recipientValue) emails.add(config.recipientValue);
            break;
          }
          case RecipientType.USER_ID: {
            if (!config.recipientValue) break;
            const userId = parseInt(config.recipientValue, 10);
            if (isNaN(userId)) break;
            const user = await this.userRepo.findOne({ where: { id: userId } });
            if (user?.email) emails.add(user.email);
            break;
          }
        }
      } catch (err) {
        this.logger.warn(
          `Failed to resolve recipient config #${config.id} for ${category}: ${err.message}`,
        );
      }
    }

    return Array.from(emails);
  }

  /**
   * Resolves recipients from admin config and sends `context.html` under
   * `context.subject` to each, one email at a time (not bcc) so that one bad
   * address never blocks delivery to the others.
   */
  async notify(category: NotificationCategory, context: NotifyContext): Promise<void> {
    try {
      const recipients = await this.resolveRecipients(category, context);
      if (recipients.length === 0) {
        this.logger.debug(`No active recipients configured for ${category}; nothing sent.`);
        return;
      }

      for (const to of recipients) {
        try {
          await this.mailService.sendGeneric(to, context.subject, context.html || `<p>${context.subject}</p>`);
        } catch (err) {
          this.logger.error(`Failed to send ${category} notification to ${to}: ${err.message}`);
        }
      }
    } catch (err) {
      // Notifications must never break the business operation that triggered
      // them (e.g. an asset deploy/return succeeding but the email failing).
      this.logger.error(`notify(${category}) failed and was suppressed: ${err.message}`);
    }
  }

  /**
   * Lower-level send used by the event-driven hooks, which already have a
   * fully-rendered MailService call to make (warranty/status/assignment
   * templates differ per event). This resolves recipients the same way
   * `notify()` does but lets the caller supply the actual send function.
   */
  async notifyRecipients(
    category: NotificationCategory,
    context: NotifyContext,
    sendFn: (to: string) => Promise<void>,
  ): Promise<void> {
    try {
      const recipients = await this.resolveRecipients(category, context);
      for (const to of recipients) {
        try {
          await sendFn(to);
        } catch (err) {
          this.logger.error(`Failed to send ${category} notification to ${to}: ${err.message}`);
        }
      }
    } catch (err) {
      // Notifications must never break the business operation that triggered
      // them (e.g. an asset deploy/return succeeding but the email failing).
      this.logger.error(`notifyRecipients(${category}) failed and was suppressed: ${err.message}`);
    }
  }

  // ─── Low-stock (event-driven, called by inventory-mgmt.service.ts) ────

  async notifyLowStock(item: {
    id: number;
    name: string;
    availableStock: number;
    minStockLevel: number;
  }): Promise<void> {
    await this.notifyRecipients(
      NotificationCategory.LOW_STOCK,
      {
        entityType: 'inventory_item',
        entityId: item.id,
        subject: `Low stock: ${item.name}`,
        html: '',
      },
      (to) =>
        this.mailService.sendLowStockAlert(to, {
          itemName: item.name,
          currentStock: item.availableStock,
          minStockLevel: item.minStockLevel,
        }),
    );
  }

  // ─── Assignment / status-change (event-driven) ─────────────────────

  async notifyAssignment(params: {
    assignedUserId?: number | null;
    departmentId?: number | null;
    entityType: string;
    entityName: string;
    action: 'assigned' | 'unassigned';
    performedBy?: string;
  }): Promise<void> {
    await this.notifyRecipients(
      NotificationCategory.ASSIGNMENT_STATUS_CHANGE,
      {
        entityType: params.entityType,
        entityId: 0,
        assignedUserId: params.assignedUserId,
        departmentId: params.departmentId,
        subject: params.entityName,
        html: '',
      },
      (to) =>
        this.mailService.sendAssignmentEmail(to, {
          entityType: params.entityType,
          entityName: params.entityName,
          action: params.action,
          performedBy: params.performedBy,
        }),
    );
  }

  async notifyStatusChange(params: {
    assignedUserId?: number | null;
    departmentId?: number | null;
    assetTag: string;
    assetName: string;
    oldStatus: string;
    newStatus: string;
  }): Promise<void> {
    await this.notifyRecipients(
      NotificationCategory.ASSIGNMENT_STATUS_CHANGE,
      {
        entityType: 'asset',
        entityId: 0,
        assignedUserId: params.assignedUserId,
        departmentId: params.departmentId,
        subject: `${params.assetTag} status change`,
        html: '',
      },
      (to) =>
        this.mailService.sendStatusChangeEmail(to, {
          assetTag: params.assetTag,
          assetName: params.assetName,
          oldStatus: params.oldStatus,
          newStatus: params.newStatus,
        }),
    );
  }

  // ─── Cron: daily expiry scan ────────────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async runExpiryReminders(): Promise<void> {
    await this.scanAssetWarrantyExpiry();
    await this.scanLicenseExpiry();
  }

  /** Has this threshold's reminder already been sent for this entity? */
  private async alreadySent(
    entityType: string,
    entityId: number,
    notificationType: string,
    threshold: number,
  ): Promise<boolean> {
    const existing = await this.logRepo.findOne({
      where: { entityType, entityId, notificationType, threshold },
    });
    return !!existing;
  }

  private async markSent(
    entityType: string,
    entityId: number,
    notificationType: string,
    threshold: number,
  ): Promise<void> {
    const log = this.logRepo.create({ entityType, entityId, notificationType, threshold });
    try {
      await this.logRepo.save(log);
    } catch (err) {
      // Unique constraint race — another concurrent run already logged it.
      this.logger.debug(`Notification log already recorded for ${entityType}#${entityId}/${threshold}`);
    }
  }

  async scanAssetWarrantyExpiry(): Promise<void> {
    for (const threshold of EXPIRY_THRESHOLDS) {
      const targetDate = new Date();
      targetDate.setHours(0, 0, 0, 0);
      targetDate.setDate(targetDate.getDate() + threshold);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const assets = await this.assetRepo
        .createQueryBuilder('asset')
        .where('asset.warrantyExpiry >= :from', { from: targetDate })
        .andWhere('asset.warrantyExpiry < :to', { to: nextDay })
        .andWhere('asset.deletedAt IS NULL')
        .getMany();

      for (const asset of assets) {
        if (
          await this.alreadySent('asset', asset.id, NotificationCategory.ASSET_WARRANTY_EXPIRY, threshold)
        ) {
          continue;
        }

        await this.notifyRecipients(
          NotificationCategory.ASSET_WARRANTY_EXPIRY,
          {
            entityType: 'asset',
            entityId: asset.id,
            assignedUserId: asset.assignedToId,
            subject: `${asset.assetTag} warranty expiry`,
            html: '',
          },
          (to) =>
            this.mailService.sendWarrantyExpiryReminder(to, {
              assetTag: asset.assetTag,
              assetName: asset.name,
              warrantyExpiry: asset.warrantyExpiry,
              daysRemaining: threshold,
            }),
        );

        await this.markSent('asset', asset.id, NotificationCategory.ASSET_WARRANTY_EXPIRY, threshold);
      }
    }
  }

  async scanLicenseExpiry(): Promise<void> {
    for (const threshold of EXPIRY_THRESHOLDS) {
      const targetDate = new Date();
      targetDate.setHours(0, 0, 0, 0);
      targetDate.setDate(targetDate.getDate() + threshold);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const licenses = await this.licenseRepo
        .createQueryBuilder('license')
        .leftJoinAndSelect('license.assignments', 'assignments')
        .where('license.expiryDate >= :from', { from: targetDate })
        .andWhere('license.expiryDate < :to', { to: nextDay })
        .andWhere('license.deletedAt IS NULL')
        .getMany();

      for (const license of licenses) {
        if (
          await this.alreadySent('license', license.id, NotificationCategory.LICENSE_EXPIRY, threshold)
        ) {
          continue;
        }

        // A license may have many assigned users — notify each one plus any
        // static/department-admin/user_id rows configured for the category.
        const assignedUserIds = (license.assignments || []).map((a) => a.userId);
        const targets = assignedUserIds.length > 0 ? assignedUserIds : [undefined];

        for (const assignedUserId of targets) {
          await this.notifyRecipients(
            NotificationCategory.LICENSE_EXPIRY,
            {
              entityType: 'license',
              entityId: license.id,
              assignedUserId,
              subject: `${license.softwareName} expiry`,
              html: '',
            },
            (to) =>
              this.mailService.sendLicenseExpiryReminder(to, {
                licenseName: license.softwareName,
                expiryDate: license.expiryDate,
                daysRemaining: threshold,
              }),
          );
        }

        await this.markSent('license', license.id, NotificationCategory.LICENSE_EXPIRY, threshold);
      }
    }
  }
}
