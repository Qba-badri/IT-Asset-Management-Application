import { License } from './license.entity';
export declare class LicenseRenewal {
    id: number;
    licenseId: number;
    license: License;
    oldExpiryDate: Date;
    newExpiryDate: Date;
    costChange: number;
    remarks: string;
    renewedBy: number;
    renewedAt: Date;
}
