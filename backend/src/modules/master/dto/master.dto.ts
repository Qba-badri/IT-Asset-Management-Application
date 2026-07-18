import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Observe } from '../../../common/validation/observe.decorator';

export class CreateBrandDto {
  @IsString()
  @MaxLength(255)
  @Observe('Backfill 2026-07: already mandatory, but accepted an empty string')
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBrandDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateVendorDto {
  @IsString()
  @MaxLength(255)
  @Observe('Backfill 2026-07: already mandatory, but accepted an empty string')
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactPerson?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  address?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateVendorDto extends CreateVendorDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  declare name: string;
}

export class CreateLicensePlanDto {
  @IsString()
  @MaxLength(255)
  @Observe('Backfill 2026-07: already mandatory, but accepted an empty string')
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  productFamily?: string;

  @IsInt()
  vendorId: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateLicensePlanDto extends CreateLicensePlanDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  declare name: string;

  @IsOptional()
  @IsInt()
  declare vendorId: number;
}

export class CreateLookupDto {
  @IsString()
  @MaxLength(100)
  @Observe('Backfill 2026-07: already mandatory, but accepted an empty string')
  @IsNotEmpty()
  type: string;

  @IsString()
  @MaxLength(255)
  @Observe('Backfill 2026-07: already mandatory, but accepted an empty string')
  @IsNotEmpty()
  label: string;

  @IsString()
  @MaxLength(255)
  @Observe('Backfill 2026-07: already mandatory, but accepted an empty string')
  @IsNotEmpty()
  value: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateLookupDto extends CreateLookupDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  declare type: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  declare label: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  declare value: string;
}
