import { MigrationInterface, QueryRunner } from 'typeorm';

export class QPeopleSyncAndIntegrationSettings1784900000000
  implements MigrationInterface
{
  name = 'QPeopleSyncAndIntegrationSettings1784900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Admin-configurable integration credentials (values encrypted at rest)
    await queryRunner.query(
      `CREATE TABLE "integration_settings" ("key" character varying(100) NOT NULL, "value" text, "is_secret" boolean NOT NULL DEFAULT false, "updated_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_integration_settings_key" PRIMARY KEY ("key"))`,
    );

    // QPeople HRMS sync + provenance columns on users
    await queryRunner.query(
      `ALTER TABLE "users" ADD "qpeople_id" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_users_qpeople_id" UNIQUE ("qpeople_id")`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "department_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_users_department_id" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "designation" character varying(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "reporting_manager_name" character varying(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "source" character varying(20) NOT NULL DEFAULT 'MANUAL'`,
    );

    // Backfill provenance for accounts created by the Azure AD sync
    await queryRunner.query(
      `UPDATE "users" SET "source" = 'AZURE_AD' WHERE "azure_id" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "source"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "reporting_manager_name"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "designation"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_users_department_id"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "department_id"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_users_qpeople_id"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "qpeople_id"`);
    await queryRunner.query(`DROP TABLE "integration_settings"`);
  }
}
