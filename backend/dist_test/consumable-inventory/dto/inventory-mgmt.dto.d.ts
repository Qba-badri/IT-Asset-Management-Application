import { InventoryTransactionType } from '../../entities/inventory-transaction.entity';
export declare class CreateInventoryCategoryDto {
    name: string;
    description?: string;
}
export declare class CreateInventoryItemDto {
    name: string;
    categoryId: number;
    isRefundable?: boolean;
    minStockLevel?: number;
    status?: string;
}
export declare class CreateInventoryPurchaseDto {
    itemId: number;
    vendorName: string;
    invoiceNumber?: string;
    purchaseDate: string;
    quantity: number;
    unitCost: number;
    remarks?: string;
    currency?: string;
}
export declare class CreateInventoryAssignmentDto {
    itemId: number;
    userId: number;
    quantity: number;
    department?: string;
    expectedReturnDate?: string;
}
export declare class CreateInventoryReturnDto {
    assignmentId: number;
    condition?: string;
    remarks?: string;
}
export declare class AdjustStockDto {
    itemId: number;
    quantity: number;
    type: InventoryTransactionType;
    notes?: string;
}
