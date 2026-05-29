import { CatalogItem } from './catalog-item.entity';
import { Location } from './location.entity';
export declare enum AssetUnitStatus {
    IN_STOCK = "in_stock",
    ASSIGNED = "assigned",
    IN_MAINTENANCE = "in_maintenance",
    IN_REPAIR = "in_repair",
    LOST = "lost",
    WRITTEN_OFF = "written_off",
    DISPOSED = "disposed"
}
export declare enum AssetCondition {
    NEW = "new",
    EXCELLENT = "excellent",
    GOOD = "good",
    FAIR = "fair",
    POOR = "poor",
    DAMAGED = "damaged"
}
export declare class AssetUnit {
    id: number;
    assetTag: string;
    catalogItem: CatalogItem;
    catalogItemId: number;
    serialNumber: string;
    status: AssetUnitStatus;
    condition: AssetCondition;
    location: Location;
    locationId: number;
    purchaseDate: Date;
    purchaseCost: number;
    vendor: string;
    warrantyExpiry: Date;
    usefulLifeYears: number;
    salvageValue: number;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}
