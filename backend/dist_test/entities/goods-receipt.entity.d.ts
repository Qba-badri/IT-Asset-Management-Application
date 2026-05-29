import { User } from './user.entity';
import { PurchaseOrder } from './purchase-order.entity';
export declare class GoodsReceipt {
    id: number;
    grnNumber: string;
    poId: number;
    purchaseOrder: PurchaseOrder;
    receivedQuantity: number;
    receivedDate: Date;
    receivedById: number;
    receivedBy: User;
    notes: string;
    assetsCreated: boolean;
    createdAt: Date;
    updatedAt: Date;
}
