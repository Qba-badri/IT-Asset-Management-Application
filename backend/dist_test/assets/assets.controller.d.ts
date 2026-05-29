import { AssetsService } from './assets.service';
import { CreateAssetDto, UpdateAssetDto, DeployAssetDto, AssetMaintenanceDto, AssetDisposeDto } from './dto/asset.dto';
export declare class AssetsController {
    private readonly assetsService;
    constructor(assetsService: AssetsService);
    findAll(): Promise<import("../entities/asset.entity").Asset[]>;
    getStatistics(): Promise<any>;
    findOne(id: number): Promise<import("../entities/asset.entity").Asset>;
    getHistory(id: number): Promise<import("../entities/asset-history.entity").AssetHistory[]>;
    create(body: CreateAssetDto): Promise<import("../entities/asset.entity").Asset>;
    update(id: number, body: UpdateAssetDto): Promise<import("../entities/asset.entity").Asset>;
    deploy(id: number, body: DeployAssetDto): Promise<import("../entities/asset.entity").Asset>;
    undeploy(id: number, performedBy?: number): Promise<import("../entities/asset.entity").Asset>;
    scheduleMaintenance(id: number, body: AssetMaintenanceDto, performedBy?: number): Promise<import("../entities/asset.entity").Asset>;
    completeMaintenance(id: number, performedBy?: number): Promise<import("../entities/asset.entity").Asset>;
    calculateDepreciation(id: number, performedBy?: number): Promise<import("../entities/asset.entity").Asset>;
    dispose(id: number, body: AssetDisposeDto, performedBy?: number): Promise<import("../entities/asset.entity").Asset>;
    uploadPhotos(id: number, files: Express.Multer.File[], body: any): Promise<any[]>;
    getPhotos(id: number): Promise<any[]>;
    deletePhoto(assetId: number, photoId: number): Promise<{
        message: string;
    }>;
    delete(id: number): Promise<{
        message: string;
    }>;
}
