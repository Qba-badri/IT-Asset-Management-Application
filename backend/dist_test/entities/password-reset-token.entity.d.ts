import { User } from './user.entity';
export declare class PasswordResetToken {
    id: number;
    userId: number;
    token: string;
    otp: string;
    expiresAt: Date;
    isUsed: boolean;
    createdAt: Date;
    user: User;
}
