import { DataSource, Repository } from 'typeorm';
import { StockByLocation } from '../entities/stock-by-location.entity';
import { StockLedger, LedgerReason } from '../entities/stock-ledger.entity';
import { CatalogItem } from '../entities/catalog-item.entity';
import { AuditEvent } from '../entities/audit-event.entity';
import { AdjustStockDto, InitialStockDto, StockQueryDto, LedgerQueryDto } from './dto/stock.dto';
export declare class StockService {
    private readonly stockRepo;
    private readonly ledgerRepo;
    private readonly catalogRepo;
    private readonly auditRepo;
    private readonly dataSource;
    constructor(stockRepo: Repository<StockByLocation>, ledgerRepo: Repository<StockLedger>, catalogRepo: Repository<CatalogItem>, auditRepo: Repository<AuditEvent>, dataSource: DataSource);
    initializeStock(dto: InitialStockDto, actorId: number): Promise<StockByLocation>;
    adjustStock(dto: AdjustStockDto, actorId: number): Promise<StockByLocation>;
    findAll(query: StockQueryDto): Promise<{
        data: StockByLocation[];
        total: number;
    }>;
    getLedger(query: LedgerQueryDto): Promise<{
        data: StockLedger[];
        total: number;
    }>;
    deductStockInTransaction(manager: any, catalogItemId: number, locationId: number, quantity: number, reason: LedgerReason, referenceType: string, referenceId: number, actorId: number, notes?: string): Promise<void>;
    addStockInTransaction(manager: any, catalogItemId: number, locationId: number, quantity: number, reason: LedgerReason, referenceType: string, referenceId: number, actorId: number, notes?: string): Promise<void>;
}
