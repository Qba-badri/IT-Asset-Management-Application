import { User } from './user.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { ProcurementReceiptLine } from './procurement-receipt-line.entity';
import { Location } from './location.entity';
import { Vendor } from './vendor.entity';
export declare enum ReceiptStatus {
    DRAFT = "draft",
    POSTED = "posted",
    CANCELLED = "cancelled"
}
export declare class ProcurementReceipt {
    id: number;
    receiptNumber: string;
    invoiceNumber: string;
    vendorId: number;
    vendor: Vendor;
    poId: number;
    purchaseOrder: PurchaseOrder;
    receiptDate: Date;
    locationId: number;
    location: Location;
    status: ReceiptStatus;
    receivedById: number;
    receivedBy: User;
    notes: string;
    currency: string;
    lines: ProcurementReceiptLine[];
    createdAt: Date;
    updatedAt: Date;
}
