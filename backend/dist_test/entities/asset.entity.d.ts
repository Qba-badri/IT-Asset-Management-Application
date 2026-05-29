import { User } from './user.entity';
import { AssetPhoto } from './asset-photo.entity';
import { Brand } from './brand.entity';
import { Vendor } from './vendor.entity';
export declare enum AssetStatus {
    AVAILABLE = "available",
    DEPLOYED = "deployed",
    MAINTENANCE = "maintenance",
    REPAIR = "repair",
    DISPOSED = "disposed",
    LOST = "lost",
    STOLEN = "stolen"
}
export declare enum AssetCategory {
    LAPTOP = "laptop",
    DESKTOP = "desktop",
    MOBILE = "mobile",
    TABLET = "tablet",
    PRINTER = "printer",
    MONITOR = "monitor",
    NETWORK = "network",
    SERVER = "server",
    OTHER = "other"
}
export declare enum AssetCondition {
    NEW = "new",
    EXCELLENT = "excellent",
    GOOD = "good",
    FAIR = "fair",
    POOR = "poor"
}
export declare enum AcquisitionType {
    PURCHASED = "purchased",
    RENTED = "rented"
}
export declare class Asset {
    id: number;
    assetTag: string;
    name: string;
    hostname: string;
    category: AssetCategory;
    brand: string;
    brandId: number;
    brandObj: Brand;
    vendor: string;
    vendorId: number;
    vendorObj: Vendor;
    receivedFromVendorDate: Date;
    vendorMonthlyRent: number;
    model: string;
    serialNumber: string;
    status: AssetStatus;
    condition: AssetCondition;
    acquisitionType: AcquisitionType;
    purchaseDate: Date;
    purchaseCost: number;
    warrantyExpiry: Date;
    warrantyStart: Date;
    warrantyType: string;
    poNumber: string;
    invoiceNumber: string;
    costCenter: string;
    businessOwnerId: number;
    businessOwner: User;
    assignedToId: number;
    assignedTo: User;
    deploymentDate: Date;
    location: string;
    site: string;
    building: string;
    floor: string;
    roomDesk: string;
    lastMaintenanceDate: Date;
    nextMaintenanceDate: Date;
    maintenanceNotes: string;
    maintenanceCycleDays: number;
    usefulLifeYears: number;
    salvageValue: number;
    currentValue: number;
    disposalDate: Date;
    disposalMethod: string;
    disposalNotes: string;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
    photos: AssetPhoto[];
}
