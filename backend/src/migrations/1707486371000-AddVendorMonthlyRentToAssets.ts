import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddVendorMonthlyRentToAssets1707486371000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'assets',
            new TableColumn({
                name: 'vendor_monthly_rent',
                type: 'decimal',
                precision: 10,
                scale: 2,
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('assets', 'vendor_monthly_rent');
    }
}
