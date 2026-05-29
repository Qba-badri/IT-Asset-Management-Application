import { AssetUnitStatus, AssetCondition } from '../../entities/asset-unit.entity';
export declare class CreateAssetUnitDto {
    assetTag: string;
    catalogItemId: number;
    serialNumber?: string;
    condition?: AssetCondition;
    locationId?: number;
    purchaseDate?: string;
    purchaseCost?: number;
    vendor?: string;
    warrantyExpiry?: string;
    usefulLifeYears?: number;
    salvageValue?: number;
    notes?: string;
}
export declare class UpdateAssetUnitDto {
    status?: AssetUnitStatus;
    condition?: AssetCondition;
    locationId?: number;
    warrantyExpiry?: string;
    usefulLifeYears?: number;
    salvageValue?: number;
    notes?: string;
}
export declare class AssetUnitQueryDto {
    search?: string;
    catalogItemId?: number;
    status?: AssetUnitStatus;
    locationId?: number;
    page?: number;
    limit?: number;
}
