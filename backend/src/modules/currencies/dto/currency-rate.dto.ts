import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Observe } from '../../../common/validation/observe.decorator';

export class CreateCurrencyRateDto {
  @IsString()
  @Length(3, 3)
  @Observe('Backfill 2026-07: already mandatory, but accepted an empty string')
  @IsNotEmpty()
  code: string;

  @IsString()
  @MaxLength(100)
  @Observe('Backfill 2026-07: already mandatory, but accepted an empty string')
  @IsNotEmpty()
  name: string;

  @IsString()
  @MaxLength(10)
  @Observe('Backfill 2026-07: already mandatory, but accepted an empty string')
  @IsNotEmpty()
  symbol: string;

  @IsNumber()
  @IsPositive()
  rateToBase: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCurrencyRateDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  symbol?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  rateToBase?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
