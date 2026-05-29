import { Asset } from './asset.entity';
import { User } from './user.entity';
export declare enum AssetAction {
    CREATED = "created",
    UPDATED = "updated",
    CHECKOUT = "checkout",
    CHECKIN = "checkin",
    MAINTENANCE_START = "maintenance_start",
    MAINTENANCE_END = "maintenance_end",
    DISPOSED = "disposed",
    LOCATION_CHANGE = "location_change",
    DEPRECIATION = "depreciation"
}
export declare class AssetHistory {
    id: number;
    assetId: number;
    asset: Asset;
    action: AssetAction;
    performedById: number;
    performedBy: User;
    assignedToId: number;
    assignedTo: User;
    location: string;
    changes: any;
    notes: string;
    actionDate: Date;
}
