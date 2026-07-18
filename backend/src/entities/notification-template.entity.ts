import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

/**
 * Admin-editable subject + rich-text body override for one of the 5
 * notification email templates (see TemplateKey in
 * notification-template.service.ts). A row here is an override; when no row
 * exists for a key, NotificationTemplateService falls back to
 * DEFAULT_TEMPLATES so behaviour is byte-identical to the previous
 * hardcoded content until an admin actually edits something.
 */
@Entity('notification_templates')
export class NotificationTemplate {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  key: string;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ name: 'body_html', type: 'text' })
  bodyHtml: string;

  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updatedBy: number | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
