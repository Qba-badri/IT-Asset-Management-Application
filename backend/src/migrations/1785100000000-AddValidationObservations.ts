import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Records validation rules that *would* have rejected a request while those
 * rules are in observation mode (@Observe), so the DTO backfill can be
 * reviewed against real traffic before enforcement is switched on.
 *
 * Rows are aggregated per (method, path, field, constraint) and counted, which
 * keeps the table bounded — a row per failure could be inflated without limit
 * by a caller in a retry loop.
 *
 * This table is temporary: drop it once every observed rule is promoted.
 */
export class AddValidationObservations1785100000000 implements MigrationInterface {
  name = 'AddValidationObservations1785100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "validation_observations" (
        "id" SERIAL NOT NULL,
        "method" character varying(10) NOT NULL,
        "path" character varying(255) NOT NULL,
        "form_key" character varying(128),
        "field" character varying(128) NOT NULL,
        "constraint_name" character varying(64) NOT NULL,
        "message" text,
        "occurrences" integer NOT NULL DEFAULT 1,
        "last_user_id" integer,
        "last_user_email" character varying(255),
        "last_ip" character varying(64),
        "last_user_agent" character varying(512),
        "first_seen_at" TIMESTAMP NOT NULL DEFAULT now(),
        "last_seen_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_validation_observations" PRIMARY KEY ("id")
      )
    `);

    // Unique key is what makes the ON CONFLICT insert-or-increment atomic.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_validation_observation_unique"
        ON "validation_observations" ("method", "path", "field", "constraint_name")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_validation_observation_unique"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "validation_observations"`);
  }
}
