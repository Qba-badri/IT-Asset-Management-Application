import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddReceivedFromVendorDateToAssets1707485571000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'assets',
            new TableColumn({
                name: 'received_from_vendor_date',
                type: 'date',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('assets', 'received_from_vendor_date');
    }
}
