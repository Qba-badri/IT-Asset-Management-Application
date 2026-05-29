"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeormConfig = void 0;
const user_entity_1 = require("../entities/user.entity");
const password_reset_token_entity_1 = require("../entities/password-reset-token.entity");
const audit_log_entity_1 = require("../entities/audit-log.entity");
const role_entity_1 = require("../entities/role.entity");
const permission_entity_1 = require("../entities/permission.entity");
const asset_entity_1 = require("../entities/asset.entity");
const asset_history_entity_1 = require("../entities/asset-history.entity");
const asset_photo_entity_1 = require("../entities/asset-photo.entity");
const license_entity_1 = require("../entities/license.entity");
const license_assignment_entity_1 = require("../entities/license-assignment.entity");
const inventory_item_entity_1 = require("../entities/inventory-item.entity");
const inventory_audit_entity_1 = require("../entities/inventory-audit.entity");
exports.typeormConfig = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'IT Asset Management',
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
        inventory_item_entity_1.InventoryItem,
        inventory_audit_entity_1.InventoryAudit,
        inventory_audit_entity_1.InventoryAuditDetail,
    ],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
};
//# sourceMappingURL=typeorm.config.js.map