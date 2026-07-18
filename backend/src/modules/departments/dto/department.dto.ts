import { IsBoolean, IsOptional, IsString, MaxLength , IsNotEmpty } from 'class-validator';
import { Observe } from '../../../common/validation/observe.decorator';

export class CreateDepartmentDto {
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
  @IsString()
  @MaxLength(100)
  costCenter?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateDepartmentDto extends CreateDepartmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  declare name: string;
}
