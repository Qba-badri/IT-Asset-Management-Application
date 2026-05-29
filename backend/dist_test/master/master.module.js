"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const brand_entity_1 = require("../entities/brand.entity");
const vendor_entity_1 = require("../entities/vendor.entity");
const lookup_entity_1 = require("../entities/lookup.entity");
const license_plan_entity_1 = require("../entities/license-plan.entity");
const master_controller_1 = require("./master.controller");
const master_service_1 = require("./master.service");
let MasterModule = class MasterModule {
};
exports.MasterModule = MasterModule;
exports.MasterModule = MasterModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([brand_entity_1.Brand, vendor_entity_1.Vendor, lookup_entity_1.Lookup, license_plan_entity_1.LicensePlan])],
        controllers: [master_controller_1.MasterController],
        providers: [master_service_1.MasterService],
        exports: [master_service_1.MasterService],
    })
], MasterModule);
//# sourceMappingURL=master.module.js.map