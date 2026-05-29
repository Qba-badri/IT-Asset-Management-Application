import { User } from './user.entity';
export declare enum AuditAction {
    ISSUE = "issue",
    RETURN = "return",
    PARTIAL_RETURN = "partial_return",
    TRANSFER = "transfer",
    REPAIR_START = "repair_start",
    REPAIR_END = "repair_end",
    LOST = "lost",
    WRITE_OFF = "write_off",
    ADJUST = "adjust",
    DISPOSE = "dispose",
    CREATE = "create",
    UPDATE = "update",
    DELETE = "delete",
    LOGIN = "login",
    APPROVAL = "approval",
    REJECTION = "rejection"
}
export declare class AuditEvent {
    id: number;
    action: AuditAction;
    entityType: string;
    entityId: number;
    actor: User;
    actorId: number;
    metadata: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
}
