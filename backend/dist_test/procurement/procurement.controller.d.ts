import { ProcurementService } from './procurement.service';
import { WorkflowService } from './workflow.service';
export declare class ProcurementController {
    private readonly procurementService;
    private readonly workflowService;
    constructor(procurementService: ProcurementService, workflowService: WorkflowService);
    createRequest(data: any, req: any): Promise<import("../entities/procurement-request.entity").ProcurementRequest>;
    getAllRequests(): Promise<import("../entities/procurement-request.entity").ProcurementRequest[]>;
    getPendingTasks(req: any): Promise<import("../entities/approval-task.entity").ApprovalTask[]>;
    approveTask(id: number, data: any, req: any): Promise<{
        success: boolean;
    }>;
    createPO(id: number, data: any, req: any): Promise<import("../entities/purchase-order.entity").PurchaseOrder>;
    confirmReceipt(id: number, data: any, req: any): Promise<import("../entities/goods-receipt.entity").GoodsReceipt>;
    getRules(): Promise<{
        minAmount: unknown;
    }[]>;
    createRule(data: any): Promise<unknown>;
}
