"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddReceivedFromVendorDateToAssets1707485571000 = void 0;
const typeorm_1 = require("typeorm");
class AddReceivedFromVendorDateToAssets1707485571000 {
    async up(queryRunner) {
        await queryRunner.addColumn('assets', new typeorm_1.TableColumn({
            name: 'received_from_vendor_date',
            type: 'date',
            isNullable: true,
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropColumn('assets', 'received_from_vendor_date');
    }
}
exports.AddReceivedFromVendorDateToAssets1707485571000 = AddReceivedFromVendorDateToAssets1707485571000;
//# sourceMappingURL=1707485571000-AddReceivedFromVendorDateToAssets.js.map