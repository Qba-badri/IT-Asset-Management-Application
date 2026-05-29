export declare class AuditLog {
    id: number;
    userId: number;
    action: string;
    entityType: string;
    entityId: number;
    oldValues: any;
    newValues: any;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
}
