import { User } from './user.entity';
import { ProcurementRequest } from './procurement-request.entity';
export declare enum POStatus {
    DRAFT = "draft",
    ISSUED = "issued",
    CANCELLED = "cancelled",
    COMPLETED = "completed"
}
export declare class PurchaseOrder {
    id: number;
    poNumber: string;
    requestId: number;
    request: ProcurementRequest;
    vendorName: string;
    totalAmount: number;
    status: POStatus;
    createdById: number;
    createdBy: User;
    createdAt: Date;
    updatedAt: Date;
}
