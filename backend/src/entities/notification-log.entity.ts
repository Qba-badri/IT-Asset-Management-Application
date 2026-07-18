import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

/**
 * Dedupe table for cron-driven expiry reminders (asset warranty / license
 * expiry). A row existing for a given (entityType, entityId, notificationType,
 * threshold) tuple means that reminder has already been sent — the daily
 * scan skips it. Event-driven notifications (assignment/status-change,
 * low-stock) do not use this table; low-stock dedupes via the
 * previous-stock/new-stock crossing check instead.
 */
@Entity('notification_logs')
@Unique(['entityType', 'entityId', 'notificationType', 'threshold'])
export class NotificationLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'entity_type', type: 'varchar', length: 50 })
  entityType: string; // 'asset' | 'license'

  @Column({ name: 'entity_id', type: 'int' })
  entityId: number;

  @Column({ name: 'notification_type', type: 'varchar', length: 50 })
  notificationType: string; // e.g. asset_warranty_expiry, license_expiry

  @Column({ type: 'int' })
  threshold: number; // days-out bucket: 30 / 15 / 7

  @CreateDateColumn({ name: 'sent_at' })
  sentAt: Date;
}
