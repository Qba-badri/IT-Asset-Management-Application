import { ProcurementService } from './procurement.service';
export declare class WorkflowController {
    private readonly procurementService;
    constructor(procurementService: ProcurementService);
    getRules(): Promise<{
        minAmount: unknown;
    }[]>;
    createRule(data: any): Promise<unknown>;
}
