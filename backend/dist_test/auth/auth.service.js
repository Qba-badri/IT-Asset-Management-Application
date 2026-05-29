"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("../entities/user.entity");
const password_reset_token_entity_1 = require("../entities/password-reset-token.entity");
const audit_events_service_1 = require("../audit-events/audit-events.service");
const audit_event_entity_1 = require("../entities/audit-event.entity");
let AuthService = class AuthService {
    constructor(usersRepository, passwordResetTokenRepository, jwtService, auditEventsService) {
        this.usersRepository = usersRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.jwtService = jwtService;
        this.auditEventsService = auditEventsService;
    }
    async login(loginDto) {
        const user = await this.usersRepository.findOne({
            where: { email: loginDto.email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        user.lastLogin = new Date();
        await this.usersRepository.save(user);
        await this.auditEventsService.logEvent({
            action: audit_event_entity_1.AuditAction.LOGIN,
            entityType: 'user',
            entityId: user.id,
            actorId: user.id,
            metadata: { email: user.email },
        });
        const payload = {
            sub: user.id,
            email: user.email,
            tokenVersion: user.tokenVersion,
        };
        const token = this.jwtService.sign(payload);
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
        };
    }
    async forgotPassword(forgotPasswordDto) {
        const user = await this.usersRepository.findOne({
            where: { email: forgotPasswordDto.email },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const otp = this.generateOTP();
        const token = this.generateRandomToken();
        const resetToken = this.passwordResetTokenRepository.create({
            userId: user.id,
            token,
            otp,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            user,
        });
        await this.passwordResetTokenRepository.save(resetToken);
        console.log(`OTP for ${user.email}: ${otp}`);
        return {
            message: 'OTP sent to your email',
            success: true,
        };
    }
    async verifyOtp(verifyOtpDto) {
        const user = await this.usersRepository.findOne({
            where: { email: verifyOtpDto.email },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const resetToken = await this.passwordResetTokenRepository.findOne({
            where: {
                userId: user.id,
                otp: verifyOtpDto.otp,
                isUsed: false,
            },
        });
        if (!resetToken) {
            throw new common_1.BadRequestException('Invalid OTP');
        }
        if (resetToken.expiresAt < new Date()) {
            throw new common_1.BadRequestException('OTP has expired');
        }
        return {
            message: 'OTP verified successfully',
            success: true,
        };
    }
    async resetPassword(resetPasswordDto) {
        const user = await this.usersRepository.findOne({
            where: { email: resetPasswordDto.email },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const resetToken = await this.passwordResetTokenRepository.findOne({
            where: {
                userId: user.id,
                otp: resetPasswordDto.otp,
                isUsed: false,
            },
        });
        if (!resetToken) {
            throw new common_1.BadRequestException('Invalid OTP');
        }
        if (resetToken.expiresAt < new Date()) {
            throw new common_1.BadRequestException('OTP has expired');
        }
        const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
        user.passwordHash = hashedPassword;
        await this.usersRepository.save(user);
        resetToken.isUsed = true;
        await this.passwordResetTokenRepository.save(resetToken);
        return {
            message: 'Password reset successfully',
            success: true,
        };
    }
    async getProfile(userId) {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['role'],
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const { passwordHash, ...result } = user;
        return result;
    }
    async updateProfile(userId, updateDto) {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (updateDto.firstName)
            user.firstName = updateDto.firstName;
        if (updateDto.lastName)
            user.lastName = updateDto.lastName;
        if (updateDto.email)
            user.email = updateDto.email;
        if (updateDto.settings)
            user.settings = updateDto.settings;
        if (updateDto.location)
            user.location = updateDto.location;
        if (updateDto.phoneNumber)
            user.phoneNumber = updateDto.phoneNumber;
        await this.usersRepository.save(user);
        const { passwordHash, ...result } = user;
        return result;
    }
    async logoutOthers(userId) {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        user.tokenVersion += 1;
        await this.usersRepository.save(user);
        return {
            message: 'Logged out from all other devices',
            success: true,
        };
    }
    async changePassword(userId, changeDto) {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const isPasswordValid = await bcrypt.compare(changeDto.currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.BadRequestException('Invalid current password');
        }
        user.passwordHash = await bcrypt.hash(changeDto.newPassword, 10);
        await this.usersRepository.save(user);
        await this.auditEventsService.logEvent({
            action: audit_event_entity_1.AuditAction.UPDATE,
            entityType: 'user',
            entityId: user.id,
            actorId: user.id,
            metadata: { field: 'password' },
        });
        return {
            message: 'Password changed successfully',
            success: true,
        };
    }
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    generateRandomToken() {
        return require('crypto').randomBytes(32).toString('hex');
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(password_reset_token_entity_1.PasswordResetToken)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        audit_events_service_1.AuditEventsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map