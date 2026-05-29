import { Repository } from 'typeorm';
import { WorkflowRule, WorkflowRuleType } from '../entities/workflow-rule.entity';
import { ApprovalTask } from '../entities/approval-task.entity';
export declare class WorkflowService {
    private readonly ruleRepo;
    private readonly taskRepo;
    private readonly logger;
    constructor(ruleRepo: Repository<WorkflowRule>, taskRepo: Repository<ApprovalTask>);
    findMatchingRule(type: WorkflowRuleType, amount: number): Promise<WorkflowRule | null>;
    generateApprovalTasks(entityType: string, entityId: number, amount: number): Promise<boolean>;
    getPendingTasks(userId: number, roleId: number): Promise<ApprovalTask[]>;
}
