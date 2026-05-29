"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicensesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const licenses_service_1 = require("./licenses.service");
const licenses_controller_1 = require("./licenses.controller");
const license_entity_1 = require("../entities/license.entity");
const license_assignment_entity_1 = require("../entities/license-assignment.entity");
const license_renewal_entity_1 = require("../entities/license-renewal.entity");
const license_history_entity_1 = require("../entities/license-history.entity");
const user_entity_1 = require("../entities/user.entity");
let LicensesModule = class LicensesModule {
};
exports.LicensesModule = LicensesModule;
exports.LicensesModule = LicensesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([license_entity_1.License, license_assignment_entity_1.LicenseAssignment, license_renewal_entity_1.LicenseRenewal, license_history_entity_1.LicenseHistory, user_entity_1.User])],
        controllers: [licenses_controller_1.LicensesController],
        providers: [licenses_service_1.LicensesService],
        exports: [licenses_service_1.LicensesService],
    })
], LicensesModule);
//# sourceMappingURL=licenses.module.js.map