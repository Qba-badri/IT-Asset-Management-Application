import { Repository, DataSource } from 'typeorm';
import { ProcurementRequest } from '../entities/procurement-request.entity';
import { PurchaseOrder } from '../entities/purchase-order.entity';
import { GoodsReceipt } from '../entities/goods-receipt.entity';
import { ApprovalTask } from '../entities/approval-task.entity';
import { WorkflowService } from './workflow.service';
import { AssetsService } from '../assets/assets.service';
import { AuditLog } from '../entities/audit-log.entity';
export declare class ProcurementService {
    private readonly prRepo;
    private readonly poRepo;
    private readonly grnRepo;
    private readonly taskRepo;
    private readonly auditRepo;
    private readonly workflowService;
    private readonly assetsService;
    private readonly dataSource;
    constructor(prRepo: Repository<ProcurementRequest>, poRepo: Repository<PurchaseOrder>, grnRepo: Repository<GoodsReceipt>, taskRepo: Repository<ApprovalTask>, auditRepo: Repository<AuditLog>, workflowService: WorkflowService, assetsService: AssetsService, dataSource: DataSource);
    private logAudit;
    createRequest(data: any, requesterId: number): Promise<ProcurementRequest>;
    approveTask(taskId: number, userId: number, comments: string): Promise<{
        success: boolean;
    }>;
    private finalizeApproval;
    createPO(prId: number, vendorName: string, userId: number): Promise<PurchaseOrder>;
    confirmReceipt(poId: number, quantity: number, notes: string, userId: number): Promise<GoodsReceipt>;
    private autoCreateAssets;
    findAllRequests(): Promise<ProcurementRequest[]>;
    findAllRules(): Promise<{
        minAmount: unknown;
    }[]>;
    createRule(data: any): Promise<unknown>;
}
