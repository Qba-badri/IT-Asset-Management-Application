import { ReportsService, ReportQueryDto } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getLedgerReport(query: ReportQueryDto): Promise<{
        data: import("../entities/stock-ledger.entity").StockLedger[];
        total: number;
    }>;
    getWriteOffsReport(query: ReportQueryDto): Promise<{
        data: import("../entities/assignment.entity").Assignment[];
        total: number;
    }>;
    getAssetHistory(assetUnitId: number): Promise<{
        unit: import("../entities/asset-unit.entity").AssetUnit;
        assignments: import("../entities/assignment.entity").Assignment[];
        events: import("../entities/audit-event.entity").AuditEvent[];
    }>;
    getDashboardSummary(): Promise<{
        totalAssetUnits: number;
        activeAssignments: number;
        overdueAssignments: number;
        recentEvents: import("../entities/audit-event.entity").AuditEvent[];
    }>;
}
