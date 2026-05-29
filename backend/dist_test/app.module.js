"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const rbac_module_1 = require("./rbac/rbac.module");
const users_module_1 = require("./users/users.module");
const assets_module_1 = require("./assets/assets.module");
const licenses_module_1 = require("./licenses/licenses.module");
const analytics_module_1 = require("./analytics/analytics.module");
const categories_module_1 = require("./categories/categories.module");
const catalog_module_1 = require("./catalog/catalog.module");
const asset_units_module_1 = require("./asset-units/asset-units.module");
const stock_module_1 = require("./stock/stock.module");
const assignments_module_1 = require("./assignments/assignments.module");
const audit_events_module_1 = require("./audit-events/audit-events.module");
const reports_module_1 = require("./reports/reports.module");
const locations_module_1 = require("./locations/locations.module");
const departments_module_1 = require("./departments/departments.module");
const procurement_module_1 = require("./procurement/procurement.module");
const master_module_1 = require("./master/master.module");
const audit_logs_module_1 = require("./audit-logs/audit-logs.module");
const user_entity_1 = require("./entities/user.entity");
const password_reset_token_entity_1 = require("./entities/password-reset-token.entity");
const audit_log_entity_1 = require("./entities/audit-log.entity");
const role_entity_1 = require("./entities/role.entity");
const permission_entity_1 = require("./entities/permission.entity");
const asset_entity_1 = require("./entities/asset.entity");
const asset_history_entity_1 = require("./entities/asset-history.entity");
const asset_photo_entity_1 = require("./entities/asset-photo.entity");
const license_entity_1 = require("./entities/license.entity");
const license_assignment_entity_1 = require("./entities/license-assignment.entity");
const license_renewal_entity_1 = require("./entities/license-renewal.entity");
const license_plan_entity_1 = require("./entities/license-plan.entity");
const inventory_item_entity_1 = require("./entities/inventory-item.entity");
const inventory_audit_entity_1 = require("./entities/inventory-audit.entity");
const category_entity_1 = require("./entities/category.entity");
const procurement_request_entity_1 = require("./entities/procurement-request.entity");
const catalog_item_entity_1 = require("./entities/catalog-item.entity");
const asset_unit_entity_1 = require("./entities/asset-unit.entity");
const stock_by_location_entity_1 = require("./entities/stock-by-location.entity");
const stock_ledger_entity_1 = require("./entities/stock-ledger.entity");
const assignment_entity_1 = require("./entities/assignment.entity");
const return_transaction_entity_1 = require("./entities/return-transaction.entity");
const audit_event_entity_1 = require("./entities/audit-event.entity");
const location_entity_1 = require("./entities/location.entity");
const department_entity_1 = require("./entities/department.entity");
const workflow_rule_entity_1 = require("./entities/workflow-rule.entity");
const approval_task_entity_1 = require("./entities/approval-task.entity");
const purchase_order_entity_1 = require("./entities/purchase-order.entity");
const goods_receipt_entity_1 = require("./entities/goods-receipt.entity");
const brand_entity_1 = require("./entities/brand.entity");
const vendor_entity_1 = require("./entities/vendor.entity");
const lookup_entity_1 = require("./entities/lookup.entity");
const license_history_entity_1 = require("./entities/license-history.entity");
const procurement_receipt_entity_1 = require("./entities/procurement-receipt.entity");
const procurement_receipt_line_entity_1 = require("./entities/procurement-receipt-line.entity");
const inventory_mgmt_module_1 = require("./consumable-inventory/inventory-mgmt.module");
const inventory_category_entity_1 = require("./entities/inventory-category.entity");
const inventory_purchase_entity_1 = require("./entities/inventory-purchase.entity");
const inventory_assignment_entity_1 = require("./entities/inventory-assignment.entity");
const inventory_return_entity_1 = require("./entities/inventory-return.entity");
const inventory_transaction_entity_1 = require("./entities/inventory-transaction.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', 'backend/.env'],
                expandVariables: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('DB_HOST', 'localhost'),
                    port: parseInt(configService.get('DB_PORT', '5432'), 10),
                    username: configService.get('DB_USERNAME', 'postgres'),
                    password: configService.get('DB_PASSWORD', 'postgres'),
                    database: configService.get('DB_NAME', 'IT Asset Management'),
                    entities: [
                        user_entity_1.User,
                        password_reset_token_entity_1.PasswordResetToken,
                        audit_log_entity_1.AuditLog,
                        role_entity_1.Role,
                        permission_entity_1.Permission,
                        asset_entity_1.Asset,
                        asset_history_entity_1.AssetHistory,
                        asset_photo_entity_1.AssetPhoto,
                        license_entity_1.License,
                        license_assignment_entity_1.LicenseAssignment,
                        license_renewal_entity_1.LicenseRenewal,
                        license_plan_entity_1.LicensePlan,
                        inventory_item_entity_1.InventoryItem,
                        inventory_audit_entity_1.InventoryAudit,
                        inventory_audit_entity_1.InventoryAuditDetail,
                        category_entity_1.Category,
                        procurement_request_entity_1.ProcurementRequest,
                        catalog_item_entity_1.CatalogItem,
                        asset_unit_entity_1.AssetUnit,
                        stock_by_location_entity_1.StockByLocation,
                        stock_ledger_entity_1.StockLedger,
                        assignment_entity_1.Assignment,
                        return_transaction_entity_1.ReturnTransaction,
                        audit_event_entity_1.AuditEvent,
                        location_entity_1.Location,
                        department_entity_1.Department,
                        workflow_rule_entity_1.WorkflowRule,
                        approval_task_entity_1.ApprovalTask,
                        purchase_order_entity_1.PurchaseOrder,
                        goods_receipt_entity_1.GoodsReceipt,
                        brand_entity_1.Brand,
                        vendor_entity_1.Vendor,
                        lookup_entity_1.Lookup,
                        license_history_entity_1.LicenseHistory,
                        procurement_receipt_entity_1.ProcurementReceipt,
                        procurement_receipt_line_entity_1.ProcurementReceiptLine,
                        inventory_category_entity_1.InventoryCategory,
                        inventory_purchase_entity_1.InventoryPurchase,
                        inventory_assignment_entity_1.InventoryAssignment,
                        inventory_return_entity_1.InventoryReturn,
                        inventory_transaction_entity_1.InventoryTransaction,
                    ],
                    synchronize: true,
                    logging: configService.get('NODE_ENV') === 'development',
                }),
                inject: [config_1.ConfigService],
            }),
            auth_module_1.AuthModule,
            rbac_module_1.RbacModule,
            users_module_1.UsersModule,
            assets_module_1.AssetsModule,
            licenses_module_1.LicensesModule,
            analytics_module_1.AnalyticsModule,
            categories_module_1.CategoriesModule,
            catalog_module_1.CatalogModule,
            asset_units_module_1.AssetUnitsModule,
            stock_module_1.StockModule,
            assignments_module_1.AssignmentsModule,
            audit_events_module_1.AuditEventsModule,
            reports_module_1.ReportsModule,
            locations_module_1.LocationsModule,
            departments_module_1.DepartmentsModule,
            procurement_module_1.ProcurementModule,
            master_module_1.MasterModule,
            audit_logs_module_1.AuditLogsModule,
            inventory_mgmt_module_1.InventoryManagementModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map