import { User } from './user.entity';
import { InventoryItem } from './inventory-item.entity';
export declare enum AuditStatus {
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed"
}
export declare class InventoryAudit {
    id: number;
    auditDate: Date;
    auditorId: number;
    auditor: User;
    status: AuditStatus;
    notes: string;
    details: InventoryAuditDetail[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class InventoryAuditDetail {
    id: number;
    auditId: number;
    audit: InventoryAudit;
    itemId: number;
    item: InventoryItem;
    systemQuantity: number;
    physicalQuantity: number;
    variance: number;
    notes: string;
}
