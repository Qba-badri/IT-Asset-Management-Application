import { InventoryCategory } from './inventory-category.entity';
import { InventoryTransaction } from './inventory-transaction.entity';
import { InventoryAssignment } from './inventory-assignment.entity';
import { InventoryPurchase } from './inventory-purchase.entity';
export declare class InventoryItem {
    id: number;
    name: string;
    categoryId: number;
    category: InventoryCategory;
    isRefundable: boolean;
    totalStock: number;
    availableStock: number;
    minStockLevel: number;
    vendor: string;
    supplier: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
    transactions: InventoryTransaction[];
    assignments: InventoryAssignment[];
    purchases: InventoryPurchase[];
}
