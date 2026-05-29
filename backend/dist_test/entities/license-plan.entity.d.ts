import { Vendor } from './vendor.entity';
export declare class LicensePlan {
    id: number;
    name: string;
    productFamily: string;
    vendorId: number;
    vendor: Vendor;
    type: string;
    category: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
