export declare enum WorkflowRuleType {
    PROCUREMENT = "procurement"
}
export declare class WorkflowRule {
    id: number;
    name: string;
    type: WorkflowRuleType;
    minAmount: number;
    maxAmount: number;
    steps: {
        approverType: 'role' | 'user' | 'manager';
        approverId: number | string;
        sequence: number;
    }[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
