import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAcquisitionTypeToAssets1707487142000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'assets',
            new TableColumn({
                name: 'acquisition_type',
                type: 'varchar',
                length: '20',
                default: "'purchased'",
                isNullable: false,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('assets', 'acquisition_type');
    }
}
