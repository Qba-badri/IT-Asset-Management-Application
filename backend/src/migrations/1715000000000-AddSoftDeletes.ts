import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftDeletes1715000000000 implements MigrationInterface {
    name = 'AddSoftDeletes1715000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "locations" ADD "deleted_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "deleted_at"`);
    }
}
