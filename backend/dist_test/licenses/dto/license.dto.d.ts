export declare class CreateLicenseDto {
    softwareName: string;
    vendor?: string;
    vendorId?: number;
    category?: string;
    type?: string;
    planName?: string;
    licensePlanId?: number;
    productKey?: string;
    contractId?: string;
    tenantId?: string;
    totalSeats?: number;
    usedSeats?: number;
    cloudMode?: boolean;
    unitPrice?: number;
    totalCost?: number;
    currency?: string;
    billingFrequency?: string;
    commitmentTerm?: string;
    purchaseDate: Date;
    expiryDate: Date;
    nextRenewalDate: Date;
    noticePeriodDays?: number;
    renewalStatus?: string;
    complianceRisk?: string;
    notes?: string;
    id?: any;
    createdAt?: any;
    updatedAt?: any;
    vendorObj?: any;
    licensePlan?: any;
}
export declare class UpdateLicenseDto extends CreateLicenseDto {
}
export declare class AssignLicenseDto {
    userId: number;
    notes?: string;
}
export declare class RenewLicenseDto {
    newExpiryDate: Date;
    costChange: number;
    remarks?: string;
}
export declare class AdjustSeatsDto {
    seats: number;
    usedSeats?: number;
    reason?: string;
}
