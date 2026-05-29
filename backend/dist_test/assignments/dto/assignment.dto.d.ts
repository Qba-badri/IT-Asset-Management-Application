import { AssetCondition } from '../../entities/asset-unit.entity';
import { AssignmentStatus } from '../../entities/assignment.entity';
export declare class IssueDto {
    catalogItemId: number;
    assetUnitId?: number;
    assigneeId: number;
    quantity?: number;
    locationId?: number;
    departmentId?: number;
    dueDate?: string;
    notes?: string;
}
export declare class ReturnDto {
    assignmentId: number;
    quantity?: number;
    condition?: AssetCondition;
    returnToLocationId?: number;
    notes?: string;
}
export declare class TransferDto {
    assignmentId: number;
    toAssigneeId?: number;
    toLocationId?: number;
    notes?: string;
}
export declare class WriteOffDto {
    assignmentId: number;
    reason: string;
    approvedById?: number;
    notes?: string;
}
export declare class HoldingsQueryDto {
    assigneeId?: number;
    departmentId?: number;
    status?: AssignmentStatus;
    page?: number;
    limit?: number;
}
export declare class OverdueQueryDto {
    assigneeId?: number;
    departmentId?: number;
    page?: number;
    limit?: number;
}
