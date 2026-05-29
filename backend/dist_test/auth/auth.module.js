"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const auth_service_1 = require("./auth.service");
const auth_controller_1 = require("./auth.controller");
const user_entity_1 = require("../entities/user.entity");
const password_reset_token_entity_1 = require("../entities/password-reset-token.entity");
const role_entity_1 = require("../entities/role.entity");
const passport_1 = require("@nestjs/passport");
const jwt_strategy_1 = require("./jwt.strategy");
const audit_events_module_1 = require("../audit-events/audit-events.module");
const permissions_guard_1 = require("./guards/permissions.guard");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, password_reset_token_entity_1.PasswordResetToken, role_entity_1.Role]),
            passport_1.PassportModule,
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
                signOptions: { expiresIn: '24h' },
            }),
            audit_events_module_1.AuditEventsModule,
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [auth_service_1.AuthService, jwt_strategy_1.JwtStrategy, permissions_guard_1.PermissionsGuard],
        exports: [auth_service_1.AuthService, typeorm_1.TypeOrmModule, permissions_guard_1.PermissionsGuard],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map