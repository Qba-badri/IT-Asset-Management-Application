import { InventoryItem } from './inventory-item.entity';
import { User } from './user.entity';
export declare enum InventoryAssignmentStatus {
    ASSIGNED = "assigned",
    RETURNED = "returned",
    CLOSED = "closed"
}
export declare class InventoryAssignment {
    id: number;
    userId: number;
    user: User;
    department: string;
    itemId: number;
    item: InventoryItem;
    quantity: number;
    assignmentDate: Date;
    expectedReturnDate: Date;
    status: InventoryAssignmentStatus;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}
