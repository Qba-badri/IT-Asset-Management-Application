import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, IsDateString, Min } from 'class-validator';
import { InventoryTransactionType } from '../../../entities/inventory-transaction.entity';

export class CreateInventoryCategoryDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class CreateInventoryItemDto {
    @IsString()
    name: string;

    @IsNumber()
    categoryId: number;

    @IsOptional()
    @IsBoolean()
    isRefundable?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(0)
    minStockLevel?: number;

    @IsOptional()
    @IsString()
    status?: string;
}

export class CreateInventoryPurchaseDto {
    @IsNumber()
    itemId: number;

    @IsString()
    vendorName: string;

    @IsOptional()
    @IsString()
    invoiceNumber?: string;

    @IsDateString()
    purchaseDate: string;

    @IsNumber()
    @Min(1)
    quantity: number;

    @IsNumber()
    unitCost: number;

    @IsOptional()
    @IsString()
    remarks?: string;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    invoiceAttachment?: string;
}

export class CreateInventoryAssignmentDto {
    @IsNumber()
    itemId: number;

    @IsNumber()
    userId: number;

    @IsNumber()
    @Min(1)
    quantity: number;

    @IsOptional()
    @IsString()
    department?: string;

    @IsOptional()
    @IsDateString()
    expectedReturnDate?: string;
}

export class CreateInventoryReturnDto {
    @IsNumber()
    assignmentId: number;

    @IsOptional()
    @IsString()
    condition?: string;

    @IsOptional()
    @IsString()
    remarks?: string;
}

export class AdjustStockDto {
    @IsNumber()
    itemId: number;

    @IsNumber()
    quantity: number;

    @IsEnum(InventoryTransactionType)
    type: InventoryTransactionType;

    @IsOptional()
    @IsString()
    notes?: string;
}
