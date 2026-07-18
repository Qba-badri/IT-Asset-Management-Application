import {
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  Min,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { Observe } from '../../../common/validation/observe.decorator';
import { AssetCondition } from '../../../entities/asset-unit.entity';
import { AssignmentStatus } from '../../../entities/assignment.entity';

/**
 * IssueDto handles both Serialized and BulkQty items.
 * - Serialized: provide assetUnitId (quantity defaults to 1)
 * - BulkQty: provide catalogItemId + quantity + locationId
 *
 * NOTE ON THE CONDITIONAL RULES BELOW: assetUnitId and locationId are required
 * depending on the catalog item's `trackMode` — which is not in this payload.
 * It is read from the database in AssignmentsService.issue(). @RequiredWhen can
 * only gate on a sibling property of the same DTO, so it cannot express these,
 * and they deliberately remain imperative checks in the service
 * (issueSerialized: "assetUnitId is required for serialized items";
 * issueBulk: "locationId is required for BulkQty items"). The client mirrors
 * them via the documented cross-field escape hatch, keyed off the selected
 * catalog item — see ISSUE_FORM_RULES.
 */
export class IssueDto {
  @IsNumber()
  catalogItemId: number;

  /**
   * Required for Serialized items — enforced in AssignmentsService, not here.
   */
  @IsOptional()
  @IsNumber()
  assetUnitId?: number;

  /**
   * @Min(1) because the issue form coerces an empty input to 0, and 0 is a
   * legitimate value for a number field in general — so "required" alone will
   * not catch it. Ids start at 1, so this rejects only payloads that would
   * otherwise fail on the foreign key.
   */
  @Observe('P5 2026-07: rejects assigneeId=0, previously a FK failure downstream')
  @Min(1)
  @IsNumber()
  assigneeId: number;

  /**
   * Required for BulkQty. Defaults to 1 for Serialized.
   *
   * Deliberately stays @IsOptional: AssignmentsService.issueBulk() defaults an
   * absent quantity to 1 and API callers rely on that. The issue form requires
   * it for BulkQty — a UI-level rule, see ISSUE_FORM_RULES on the client.
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
  @Observe('Backfill 2026-07: already mandatory, but accepted an empty string')
  @IsNotEmpty()
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
