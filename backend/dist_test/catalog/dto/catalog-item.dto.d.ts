import { ReturnPolicy, TrackMode } from '../../entities/catalog-item.entity';
export declare class CreateCatalogItemDto {
    sku: string;
    name: string;
    description?: string;
    categoryId?: number;
    returnPolicy: ReturnPolicy;
    trackMode: TrackMode;
    unitOfMeasure?: string;
    reorderPoint?: number;
    brand?: string;
    model?: string;
    imageUrl?: string;
    unitCost?: number;
}
export declare class UpdateCatalogItemDto {
    name?: string;
    description?: string;
    categoryId?: number;
    unitOfMeasure?: string;
    reorderPoint?: number;
    brand?: string;
    model?: string;
    imageUrl?: string;
    unitCost?: number;
    isActive?: boolean;
}
export declare class CatalogQueryDto {
    search?: string;
    returnPolicy?: ReturnPolicy;
    trackMode?: TrackMode;
    categoryId?: number;
    isActive?: boolean;
    page?: number;
    limit?: number;
}
