import { DataSource, Repository } from 'typeorm';
import { Assignment } from '../entities/assignment.entity';
import { ReturnTransaction } from '../entities/return-transaction.entity';
import { CatalogItem } from '../entities/catalog-item.entity';
import { AssetUnit } from '../entities/asset-unit.entity';
import { AuditEvent } from '../entities/audit-event.entity';
import { StockService } from '../stock/stock.service';
import { IssueDto, ReturnDto, TransferDto, WriteOffDto, HoldingsQueryDto, OverdueQueryDto } from './dto/assignment.dto';
export declare class AssignmentsService {
    private readonly assignmentRepo;
    private readonly returnRepo;
    private readonly catalogRepo;
    private readonly assetUnitRepo;
    private readonly auditRepo;
    private readonly stockService;
    private readonly dataSource;
    constructor(assignmentRepo: Repository<Assignment>, returnRepo: Repository<ReturnTransaction>, catalogRepo: Repository<CatalogItem>, assetUnitRepo: Repository<AssetUnit>, auditRepo: Repository<AuditEvent>, stockService: StockService, dataSource: DataSource);
    issue(dto: IssueDto, actorId: number): Promise<Assignment>;
    private issueSerialized;
    private issueBulk;
    processReturn(dto: ReturnDto, actorId: number): Promise<ReturnTransaction>;
    transfer(dto: TransferDto, actorId: number): Promise<Assignment>;
    writeOff(dto: WriteOffDto, actorId: number): Promise<Assignment>;
    getHoldings(query: HoldingsQueryDto): Promise<{
        data: Assignment[];
        total: number;
    }>;
    getOverdue(query: OverdueQueryDto): Promise<{
        data: Assignment[];
        total: number;
    }>;
    findOne(id: number): Promise<Assignment>;
}
