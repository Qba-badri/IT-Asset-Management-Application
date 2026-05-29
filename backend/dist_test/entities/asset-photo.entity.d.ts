import { Asset } from './asset.entity';
export declare enum PhotoCondition {
    EXCELLENT = "excellent",
    GOOD = "good",
    FAIR = "fair",
    POOR = "poor",
    DAMAGED = "damaged"
}
export declare class AssetPhoto {
    id: number;
    assetId: number;
    asset: Asset;
    filename: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    condition: PhotoCondition;
    notes: string;
    uploadedAt: Date;
}
