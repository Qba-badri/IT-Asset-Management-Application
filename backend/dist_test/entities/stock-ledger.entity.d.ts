import { CatalogItem } from './catalog-item.entity';
import { Location } from './location.entity';
import { User } from './user.entity';
export declare enum LedgerReason {
    INITIAL_STOCK = "initial_stock",
    PROCUREMENT = "procurement",
    ISSUE = "issue",
    RETURN = "return",
    TRANSFER_IN = "transfer_in",
    TRANSFER_OUT = "transfer_out",
    ADJUSTMENT = "adjustment",
    WRITE_OFF = "write_off",
    LOST = "lost",
    DISPOSED = "disposed"
}
export declare class StockLedger {
    id: number;
    catalogItem: CatalogItem;
    catalogItemId: number;
    location: Location;
    locationId: number;
    quantityChange: number;
    runningBalance: number;
    reason: LedgerReason;
    referenceType: string;
    referenceId: number;
    notes: string;
    createdBy: User;
    createdById: number;
    createdAt: Date;
}
