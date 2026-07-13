import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, IsDateString, IsNotEmpty, IsIn, Min, ValidateIf } from 'class-validator';
import { InventoryTransactionType } from '../../../entities/inventory-transaction.entity';
import { InventoryAssignmentTargetType } from '../../../entities/inventory-assignment.entity';

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
    @IsNumber()
    @Min(1)
    unitsPerPack?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    packQuantity?: number;

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

    @IsOptional()
    @IsNumber()
    @Min(1)
    packQuantity?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    unitsPerPack?: number;

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

    @IsOptional()
    @IsEnum(InventoryAssignmentTargetType)
    targetType?: InventoryAssignmentTargetType;

    @ValidateIf((dto) => (dto.targetType || InventoryAssignmentTargetType.PERSON) === InventoryAssignmentTargetType.PERSON)
    @IsNumber()
    userId?: number;

    @ValidateIf((dto) => dto.targetType === InventoryAssignmentTargetType.LOCATION)
    @IsString()
    location?: string;

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

    @IsString()
    @IsNotEmpty({ message: 'The item condition is required to process a return' })
    @IsIn(['good', 'fair', 'damaged', 'lost'], { message: 'Condition must be one of: good, fair, damaged, lost' })
    condition: string;

    @IsOptional()
    @IsString()
    remarks?: string;
}

export class DeleteAssignmentDto {
    @IsString()
    @IsNotEmpty({ message: 'A reason is required to delete this assignment' })
    reason: string;
}

export class AdjustStockDto {
    @IsNumber()
    itemId: number;

    @IsNumber()
    @Min(1, { message: 'Quantity must be greater than zero' })
    quantity: number;

    @IsEnum(InventoryTransactionType)
    type: InventoryTransactionType;

    @IsString()
    @IsNotEmpty({ message: 'A reason is required for stock adjustments' })
    notes: string;
}
