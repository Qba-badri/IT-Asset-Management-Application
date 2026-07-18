import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Status management across admin-managed entities:
 *
 * - roles.is_system: immutable flag marking built-in roles. A system role
 *   cannot be renamed, deactivated, or deleted; protections key off this
 *   flag rather than the role name. The seeded 'Admin' role is backfilled.
 * - permissions.is_active: soft deactivation. Role-permission mappings are
 *   preserved; an inactive permission grants no access and cannot be newly
 *   assigned.
 * - inventory_categories.is_active: soft deactivation, distinct from the
 *   existing deleted_at soft delete (deleted = hidden everywhere; inactive =
 *   admin-visible, excluded from new selections).
 */
export class AddStatusManagementColumns1785200000000 implements MigrationInterface {
  name = 'AddStatusManagementColumns1785200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "is_system" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_categories" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true`,
    );

    // The one place the name is used: marking the seeded built-in role as a
    // system role. All runtime protection reads is_system, not the name.
    await queryRunner.query(
      `UPDATE "roles" SET "is_system" = true WHERE "name" = 'Admin'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inventory_categories" DROP COLUMN IF EXISTS "is_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" DROP COLUMN IF EXISTS "is_active"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP COLUMN IF EXISTS "is_system"`,
    );
  }
}
