import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Email notification support:
 *
 * - notification_logs: dedupe table for the daily expiry-reminder cron.
 *   A row means "this threshold's reminder was already sent for this
 *   entity" so the scan never re-sends on the next run.
 * - notification_recipient_configs: admin-configurable recipient routing
 *   per notification category, so recipients are never hardcoded.
 *   Seeded with one ASSIGNED_USER row per category so the previous
 *   implicit behaviour ("assigned user gets their own email") keeps
 *   working out of the box.
 */
export class AddNotificationTables1785300000000 implements MigrationInterface {
  name = 'AddNotificationTables1785300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_logs" (
        "id" SERIAL PRIMARY KEY,
        "entity_type" varchar(50) NOT NULL,
        "entity_id" integer NOT NULL,
        "notification_type" varchar(50) NOT NULL,
        "threshold" integer NOT NULL,
        "sent_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_notification_logs_dedupe"
      ON "notification_logs" ("entity_type", "entity_id", "notification_type", "threshold")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_recipient_configs" (
        "id" SERIAL PRIMARY KEY,
        "notification_type" varchar(50) NOT NULL,
        "recipient_type" varchar(30) NOT NULL,
        "recipient_value" varchar(255),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Seed default "assigned user gets their own email" behaviour for all
    // four categories so admins don't have to configure anything for the
    // baseline case to work.
    const categories = [
      'asset_warranty_expiry',
      'license_expiry',
      'low_stock',
      'assignment_status_change',
    ];
    for (const category of categories) {
      await queryRunner.query(
        `INSERT INTO "notification_recipient_configs" ("notification_type", "recipient_type", "is_active")
         VALUES ($1, 'assigned_user', true)`,
        [category],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_recipient_configs"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_notification_logs_dedupe"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_logs"`);
  }
}
