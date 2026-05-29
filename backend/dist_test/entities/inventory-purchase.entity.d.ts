import { InventoryItem } from './inventory-item.entity';
export declare class InventoryPurchase {
    id: number;
    vendorName: string;
    invoiceNumber: string;
    purchaseDate: Date;
    itemId: number;
    item: InventoryItem;
    quantity: number;
    unitCost: number;
    totalCost: number;
    remarks: string;
    currency: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}
