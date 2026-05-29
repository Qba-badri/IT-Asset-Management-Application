import { InventoryItem } from './inventory-item.entity';
export declare class InventoryCategory {
    id: number;
    name: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
    items: InventoryItem[];
}
