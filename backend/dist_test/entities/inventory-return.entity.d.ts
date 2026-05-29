import { InventoryAssignment } from './inventory-assignment.entity';
import { InventoryItem } from './inventory-item.entity';
import { User } from './user.entity';
export declare class InventoryReturn {
    id: number;
    assignmentId: number;
    assignment: InventoryAssignment;
    itemId: number;
    item: InventoryItem;
    returnDate: Date;
    condition: string;
    approvedById: number;
    approvedBy: User;
    remarks: string;
    createdAt: Date;
}
