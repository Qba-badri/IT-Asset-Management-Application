import { Category } from './category.entity';
export declare enum ReturnPolicy {
    RETURNABLE = "returnable",
    CONSUMABLE = "consumable",
    ASSIGN_ONCE = "assign_once"
}
export declare enum TrackMode {
    SERIALIZED = "serialized",
    BULK_QTY = "bulk_qty"
}
export declare class CatalogItem {
    id: number;
    sku: string;
    name: string;
    description: string;
    category: Category;
    categoryId: number;
    returnPolicy: ReturnPolicy;
    trackMode: TrackMode;
    unitOfMeasure: string;
    reorderPoint: number;
    brand: string;
    model: string;
    imageUrl: string;
    unitCost: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
