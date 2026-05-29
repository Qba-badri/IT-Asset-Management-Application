import { User } from './user.entity';
import { InventoryItem } from './inventory-item.entity';
export declare enum ProcurementStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    ORDERED = "ordered",
    RECEIVED = "received"
}
export declare enum ProcurementPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export declare class ProcurementRequest {
    id: number;
    itemName: string;
    category: string;
    quantity: number;
    estimatedCost: number;
    itemId: number;
    item: InventoryItem;
    status: ProcurementStatus;
    priority: ProcurementPriority;
    requesterId: number;
    requester: User;
    approverId: number;
    approver: User;
    reason: string;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}
