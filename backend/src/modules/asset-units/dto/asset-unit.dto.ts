import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  MaxLength,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Observe } from '../../../common/validation/observe.decorator';
import {
  AssetUnitStatus,
  AssetCondition,
} from '../../../entities/asset-unit.entity';

export class CreateAssetUnitDto {
  @IsString()
  @MaxLength(50)
  @Observe('Backfill 2026-07: already mandatory, but accepted an empty string')
  @IsNotEmpty()
  assetTag: string;

  @IsNumber()
  catalogItemId: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @IsOptional()
  @IsEnum(AssetCondition)
  condition?: AssetCondition;

  @IsOptional()
  @IsNumber()
  locationId?: number;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purchaseCost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  vendor?: string;

  @IsOptional()
  @IsDateString()
  warrantyExpiry?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  usefulLifeYears?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salvageValue?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAssetUnitDto {
  @IsOptional()
  @IsEnum(AssetUnitStatus)
  status?: AssetUnitStatus;

  @IsOptional()
  @IsEnum(AssetCondition)
  condition?: AssetCondition;

  @IsOptional()
  @IsNumber()
  locationId?: number;

  @IsOptional()
  @IsDateString()
  warrantyExpiry?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  usefulLifeYears?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salvageValue?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AssetUnitQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  catalogItemId?: number;

  @IsOptional()
  @IsEnum(AssetUnitStatus)
  status?: AssetUnitStatus;

  @IsOptional()
  @IsNumber()
  locationId?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
