import { Assignment } from './assignment.entity';
import { User } from './user.entity';
import { AssetCondition } from './asset-unit.entity';
export declare class ReturnTransaction {
    id: number;
    assignment: Assignment;
    assignmentId: number;
    quantity: number;
    conditionOnReturn: AssetCondition;
    returnedBy: User;
    returnedById: number;
    processedBy: User;
    processedById: number;
    notes: string;
    createdAt: Date;
}
