import { PasswordResetToken } from './password-reset-token.entity';
import { Role } from './role.entity';
import { Asset } from './asset.entity';
import { LicenseAssignment } from './license-assignment.entity';
export declare class User {
    id: number;
    email: string;
    roleId: number;
    role: Role;
    passwordHash: string;
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
    assignedAssets: Asset[];
    licenseAssignments: LicenseAssignment[];
}
