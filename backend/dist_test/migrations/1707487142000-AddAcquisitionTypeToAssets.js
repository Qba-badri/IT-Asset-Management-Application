"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAcquisitionTypeToAssets1707487142000 = void 0;
const typeorm_1 = require("typeorm");
class AddAcquisitionTypeToAssets1707487142000 {
    async up(queryRunner) {
        await queryRunner.addColumn('assets', new typeorm_1.TableColumn({
            name: 'acquisition_type',
            type: 'varchar',
            length: '20',
            default: "'purchased'",
            isNullable: false,
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropColumn('assets', 'acquisition_type');
    }
}
exports.AddAcquisitionTypeToAssets1707487142000 = AddAcquisitionTypeToAssets1707487142000;
//# sourceMappingURL=1707487142000-AddAcquisitionTypeToAssets.js.map