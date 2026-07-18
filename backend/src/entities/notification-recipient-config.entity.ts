import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum NotificationCategory {
  ASSET_WARRANTY_EXPIRY = 'asset_warranty_expiry',
  LICENSE_EXPIRY = 'license_expiry',
  LOW_STOCK = 'low_stock',
  ASSIGNMENT_STATUS_CHANGE = 'assignment_status_change',
}

export enum RecipientType {
  ASSIGNED_USER = 'assigned_user',
  DEPARTMENT_ADMIN = 'department_admin',
  STATIC_EMAIL = 'static_email',
  USER_ID = 'user_id',
}

/**
 * Admin-configurable recipient routing for email notifications. Recipients
 * are never hardcoded — each notification category can have zero or more
 * active rows here, resolved to concrete emails at send time by
 * NotificationsService.resolveRecipients().
 *
 * recipientValue is used only by STATIC_EMAIL (literal address) and
 * USER_ID (numeric user id as string). ASSIGNED_USER and DEPARTMENT_ADMIN
 * are resolved dynamically from the notification context / RBAC scope.
 */
@Entity('notification_recipient_configs')
export class NotificationRecipientConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'notification_type', type: 'varchar', length: 50 })
  notificationType: NotificationCategory;

  @Column({ name: 'recipient_type', type: 'varchar', length: 30 })
  recipientType: RecipientType;

  @Column({ name: 'recipient_value', type: 'varchar', length: 255, nullable: true })
  recipientValue: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
