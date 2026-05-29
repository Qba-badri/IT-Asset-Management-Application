import { Repository } from 'typeorm';
import { StockLedger } from '../entities/stock-ledger.entity';
import { AuditEvent } from '../entities/audit-event.entity';
import { Assignment } from '../entities/assignment.entity';
import { AssetUnit } from '../entities/asset-unit.entity';
export interface ReportQueryDto {
    startDate?: string;
    endDate?: string;
    catalogItemId?: number;
    locationId?: number;
    page?: number;
    limit?: number;
}
export declare class ReportsService {
    private readonly ledgerRepo;
    private readonly auditRepo;
    private readonly assignmentRepo;
    private readonly assetUnitRepo;
    constructor(ledgerRepo: Repository<StockLedger>, auditRepo: Repository<AuditEvent>, assignmentRepo: Repository<Assignment>, assetUnitRepo: Repository<AssetUnit>);
    getLedgerReport(query: ReportQueryDto): Promise<{
        data: StockLedger[];
        total: number;
    }>;
    getWriteOffsReport(query: ReportQueryDto): Promise<{
        data: Assignment[];
        total: number;
    }>;
    getAssetHistory(assetUnitId: number): Promise<{
        unit: AssetUnit;
        assignments: Assignment[];
        events: AuditEvent[];
    }>;
    getDashboardSummary(): Promise<{
        totalAssetUnits: number;
        activeAssignments: number;
        overdueAssignments: number;
        recentEvents: AuditEvent[];
    }>;
}
