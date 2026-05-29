"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddVendorMonthlyRentToAssets1707486371000 = void 0;
const typeorm_1 = require("typeorm");
class AddVendorMonthlyRentToAssets1707486371000 {
    async up(queryRunner) {
        await queryRunner.addColumn('assets', new typeorm_1.TableColumn({
            name: 'vendor_monthly_rent',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropColumn('assets', 'vendor_monthly_rent');
    }
}
exports.AddVendorMonthlyRentToAssets1707486371000 = AddVendorMonthlyRentToAssets1707486371000;
//# sourceMappingURL=1707486371000-AddVendorMonthlyRentToAssets.js.map