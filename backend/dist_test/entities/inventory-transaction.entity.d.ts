import { InventoryItem } from './inventory-item.entity';
import { User } from './user.entity';
export declare enum InventoryTransactionType {
    IN = "IN",
    OUT = "OUT",
    RETURN = "RETURN",
    ADJUSTMENT = "ADJUSTMENT"
}
export declare class InventoryTransaction {
    id: number;
    itemId: number;
    item: InventoryItem;
    type: InventoryTransactionType;
    quantity: number;
    referenceId: number;
    referenceType: string;
    transactionDate: Date;
    performedById: number;
    performedBy: User;
    notes: string;
}
