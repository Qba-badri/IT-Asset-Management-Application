import { LedgerReason } from '../../entities/stock-ledger.entity';
export declare class AdjustStockDto {
    catalogItemId: number;
    locationId: number;
    newQuantity: number;
    reason?: string;
    notes?: string;
}
export declare class InitialStockDto {
    catalogItemId: number;
    locationId: number;
    quantity: number;
    notes?: string;
}
export declare class StockQueryDto {
    catalogItemId?: number;
    locationId?: number;
    search?: string;
    page?: number;
    limit?: number;
}
export declare class LedgerQueryDto {
    catalogItemId?: number;
    locationId?: number;
    reason?: LedgerReason;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}
