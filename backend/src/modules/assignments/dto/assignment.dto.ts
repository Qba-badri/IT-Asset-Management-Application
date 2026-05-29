import {
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  Min,
  ValidateIf,
} from 'class-validator';
import { AssetCondition } from '../../../entities/asset-unit.entity';
import { AssignmentStatus } from '../../../entities/assignment.entity';

/**
 * IssueDto handles both Serialized and BulkQty items.
 * - Serialized: provide assetUnitId (quantity defaults to 1)
 * - BulkQty: provide catalogItemId + quantity + locationId
 */
export class IssueDto {
  @IsNumber()
  catalogItemId: number;

  /**
   * Required for Serialized items. Null for BulkQty.
   */
  @IsOptional()
  @IsNumber()
  assetUnitId?: number;

  @IsNumber()
  assigneeId: number;

  /**
   * Required for BulkQty. Defaults to 1 for Serialized.
   */
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  /**
   * Location to deduct stock from (required for BulkQty).
   */
  @IsOptional()
  @IsNumber()
  locationId?: number;

  @IsOptional()
  @IsNumber()
  departmentId?: number;

  /**
   * Due date for returnable items.
   */
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * ReturnDto supports partial returns.
 * - Serialized: quantity = 1
 * - BulkQty: quantity = 1..remaining
 */
export class ReturnDto {
  @IsNumber()
  assignmentId: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsEnum(AssetCondition)
  condition?: AssetCondition;

  /**
   * Location to return stock to.
   */
  @IsOptional()
  @IsNumber()
  returnToLocationId?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * TransferDto supports:
 * - Employee ↔ Employee (reassign)
 * - Location ↔ Location (stock move for BulkQty)
 */
export class TransferDto {
  @IsNumber()
  assignmentId: number;

  /**
   * For employee-to-employee transfer.
   */
  @IsOptional()
  @IsNumber()
  toAssigneeId?: number;

  /**
   * For location-to-location stock transfer.
   */
  @IsOptional()
  @IsNumber()
  toLocationId?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class WriteOffDto {
  @IsNumber()
  assignmentId: number;

  @IsString()
  reason: string;

  @IsOptional()
  @IsNumber()
  approvedById?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class HoldingsQueryDto {
  @IsOptional()
  @IsNumber()
  assigneeId?: number;

  @IsOptional()
  @IsNumber()
  departmentId?: number;

  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class OverdueQueryDto {
  @IsOptional()
  @IsNumber()
  assigneeId?: number;

  @IsOptional()
  @IsNumber()
  departmentId?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
