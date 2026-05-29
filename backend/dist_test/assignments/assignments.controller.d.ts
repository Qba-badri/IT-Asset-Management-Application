import { AssignmentsService } from './assignments.service';
import { IssueDto, ReturnDto, TransferDto, WriteOffDto, HoldingsQueryDto, OverdueQueryDto } from './dto/assignment.dto';
export declare class AssignmentsController {
    private readonly assignmentsService;
    constructor(assignmentsService: AssignmentsService);
    issue(dto: IssueDto, req: any): Promise<import("../entities/assignment.entity").Assignment>;
    processReturn(dto: ReturnDto, req: any): Promise<import("../entities/return-transaction.entity").ReturnTransaction>;
    transfer(dto: TransferDto, req: any): Promise<import("../entities/assignment.entity").Assignment>;
    writeOff(dto: WriteOffDto, req: any): Promise<import("../entities/assignment.entity").Assignment>;
    getHoldings(query: HoldingsQueryDto): Promise<{
        data: import("../entities/assignment.entity").Assignment[];
        total: number;
    }>;
    getOverdue(query: OverdueQueryDto): Promise<{
        data: import("../entities/assignment.entity").Assignment[];
        total: number;
    }>;
    findOne(id: number): Promise<import("../entities/assignment.entity").Assignment>;
}
