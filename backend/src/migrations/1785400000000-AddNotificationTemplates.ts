import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Admin-editable email content (subject + rich-text body) per notification
 * template key. A row here is an override; when no row exists for a key,
 * NotificationTemplateService falls back to its in-code DEFAULT_TEMPLATES,
 * so no seed rows are needed.
 */
export class AddNotificationTemplates1785400000000 implements MigrationInterface {
  name = 'AddNotificationTemplates1785400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_templates" (
        "key" varchar(50) PRIMARY KEY,
        "subject" varchar(255) NOT NULL,
        "body_html" text NOT NULL,
        "updated_by" integer NULL,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_templates"`);
  }
}
