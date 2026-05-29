import { AssetStatus } from '../../entities/asset.entity';
export declare class CreateAssetDto {
    assetTag: string;
    name: string;
    hostname?: string;
    category: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    status?: AssetStatus;
    condition?: string;
    acquisitionType?: string;
    purchaseDate?: Date;
    purchaseCost?: number;
    vendor?: string;
    brandId?: number;
    vendorId?: number;
    receivedFromVendorDate?: Date;
    vendorMonthlyRent?: number;
    warrantyExpiry?: Date;
    location?: string;
    poNumber?: string;
    invoiceNumber?: string;
    costCenter?: string;
    businessOwnerId?: number;
    warrantyType?: string;
    warrantyStart?: Date;
    maintenanceCycleDays?: number;
    usefulLifeYears?: number;
    salvageValue?: number;
    notes?: string;
    performedBy?: number;
}
export declare class UpdateAssetDto extends CreateAssetDto {
}
export declare class DeployAssetDto {
    targetType: string;
    userId?: number;
    location?: string;
    site?: string;
    building?: string;
    floor?: string;
    roomDesk?: string;
    deploymentDate?: Date;
    performedBy?: number;
}
export declare class AssetMaintenanceDto {
    type: string;
    scheduledDate: Date;
    notes?: string;
    performedBy?: number;
}
export declare class AssetDisposeDto {
    reason: string;
    disposalDate: Date;
    notes?: string;
    performedBy?: number;
}
