import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AuditEventsService } from '../audit-events/audit-events.service';
export declare class AuthService {
    private usersRepository;
    private passwordResetTokenRepository;
    private jwtService;
    private auditEventsService;
    constructor(usersRepository: Repository<User>, passwordResetTokenRepository: Repository<PasswordResetToken>, jwtService: JwtService, auditEventsService: AuditEventsService);
    login(loginDto: LoginDto): Promise<{
        token: string;
        user: {
            id: number;
            email: string;
            firstName: string;
            lastName: string;
        };
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
        success: boolean;
    }>;
    verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{
        message: string;
        success: boolean;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
        success: boolean;
    }>;
    getProfile(userId: number): Promise<{
        id: number;
        email: string;
        roleId: number;
        role: import("../entities/role.entity").Role;
        firstName: string;
        lastName: string;
        isActive: boolean;
        isVerified: boolean;
        lastLogin: Date;
        phoneNumber: string;
        location: string;
        tokenVersion: number;
        settings: any;
        azureId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date;
        passwordResetTokens: PasswordResetToken[];
        assignedAssets: import("../entities/asset.entity").Asset[];
        licenseAssignments: import("../entities/license-assignment.entity").LicenseAssignment[];
    }>;
    updateProfile(userId: number, updateDto: any): Promise<{
        id: number;
        email: string;
        roleId: number;
        role: import("../entities/role.entity").Role;
        firstName: string;
        lastName: string;
        isActive: boolean;
        isVerified: boolean;
        lastLogin: Date;
        phoneNumber: string;
        location: string;
        tokenVersion: number;
        settings: any;
        azureId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date;
        passwordResetTokens: PasswordResetToken[];
        assignedAssets: import("../entities/asset.entity").Asset[];
        licenseAssignments: import("../entities/license-assignment.entity").LicenseAssignment[];
    }>;
    logoutOthers(userId: number): Promise<{
        message: string;
        success: boolean;
    }>;
    changePassword(userId: number, changeDto: any): Promise<{
        message: string;
        success: boolean;
    }>;
    private generateOTP;
    private generateRandomToken;
}
