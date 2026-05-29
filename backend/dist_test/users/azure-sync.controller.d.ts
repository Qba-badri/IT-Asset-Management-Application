import { AzureSyncService } from './azure-sync.service';
export declare class AzureSyncController {
    private readonly azureSyncService;
    constructor(azureSyncService: AzureSyncService);
    syncAzureUsers(): Promise<{
        success: boolean;
        message: string;
        createdCount: number;
        updatedCount: number;
        totalProcessed: number;
    }>;
    getSyncStatus(): Promise<{
        message: string;
    }>;
}
