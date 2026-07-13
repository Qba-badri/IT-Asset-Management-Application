import { IsNumber, IsOptional, IsString, IsNotEmpty, IsEnum, Min } from 'class-validator';
import { LedgerReason } from '../../../entities/stock-ledger.entity';

export class AdjustStockDto {
  @IsNumber()
  catalogItemId: number;

  @IsNumber()
  locationId: number;

  @IsNumber()
  @Min(1, { message: 'Quantity must be greater than zero' })
  newQuantity: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsString()
  @IsNotEmpty({ message: 'A reason is required for stock adjustments' })
  notes: string;
}

export class InitialStockDto {
  @IsNumber()
  catalogItemId: number;

  @IsNumber()
  locationId: number;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class StockQueryDto {
  @IsOptional()
  @IsNumber()
  catalogItemId?: number;

  @IsOptional()
  @IsNumber()
  locationId?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class LedgerQueryDto {
  @IsOptional()
  @IsNumber()
  catalogItemId?: number;

  @IsOptional()
  @IsNumber()
  locationId?: number;

  @IsOptional()
  @IsEnum(LedgerReason)
  reason?: LedgerReason;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
