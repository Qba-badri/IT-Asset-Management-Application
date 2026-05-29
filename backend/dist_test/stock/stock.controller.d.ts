import { StockService } from './stock.service';
import { AdjustStockDto, InitialStockDto, StockQueryDto, LedgerQueryDto } from './dto/stock.dto';
export declare class StockController {
    private readonly stockService;
    constructor(stockService: StockService);
    initializeStock(dto: InitialStockDto, req: any): Promise<import("../entities/stock-by-location.entity").StockByLocation>;
    adjustStock(dto: AdjustStockDto, req: any): Promise<import("../entities/stock-by-location.entity").StockByLocation>;
    findAll(query: StockQueryDto): Promise<{
        data: import("../entities/stock-by-location.entity").StockByLocation[];
        total: number;
    }>;
    getLedger(query: LedgerQueryDto): Promise<{
        data: import("../entities/stock-ledger.entity").StockLedger[];
        total: number;
    }>;
}
