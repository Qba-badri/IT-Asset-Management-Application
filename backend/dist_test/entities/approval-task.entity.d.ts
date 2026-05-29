import { User } from './user.entity';
export declare enum ApprovalStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    SENT_BACK = "sent_back"
}
export declare class ApprovalTask {
    id: number;
    targetEntityType: string;
    targetEntityId: number;
    approverId: number;
    approver: User;
    approverRoleId: number;
    status: ApprovalStatus;
    comments: string;
    sequence: number;
    isCurrent: boolean;
    createdAt: Date;
    updatedAt: Date;
}
