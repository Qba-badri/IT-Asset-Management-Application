import { ProcurementReceipt } from './procurement-receipt.entity';
import { CatalogItem } from './catalog-item.entity';
export declare class ProcurementReceiptLine {
    id: number;
    receiptId: number;
    receipt: ProcurementReceipt;
    catalogItemId: number;
    catalogItem: CatalogItem;
    quantity: number;
    unitCost: number;
    serialNumbers: string;
    assetTags: string;
    notes: string;
}
