import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
    getProfile(req: any): Promise<{
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
        passwordResetTokens: import("../entities/password-reset-token.entity").PasswordResetToken[];
        assignedAssets: import("../entities/asset.entity").Asset[];
        licenseAssignments: import("../entities/license-assignment.entity").LicenseAssignment[];
    }>;
    updateProfile(req: any, updateDto: any): Promise<{
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
        passwordResetTokens: import("../entities/password-reset-token.entity").PasswordResetToken[];
        assignedAssets: import("../entities/asset.entity").Asset[];
        licenseAssignments: import("../entities/license-assignment.entity").LicenseAssignment[];
    }>;
    logoutOthers(req: any): Promise<{
        message: string;
        success: boolean;
    }>;
    changePassword(req: any, changeDto: any): Promise<{
        message: string;
        success: boolean;
    }>;
}
