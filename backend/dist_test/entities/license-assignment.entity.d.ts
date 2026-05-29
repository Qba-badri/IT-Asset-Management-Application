import { User } from './user.entity';
import { License } from './license.entity';
export declare class LicenseAssignment {
    id: number;
    licenseId: number;
    license: License;
    userId: number;
    user: User;
    assignedAt: Date;
    notes: string;
}
