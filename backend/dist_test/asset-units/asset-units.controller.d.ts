import { AssetUnitsService } from './asset-units.service';
import { CreateAssetUnitDto, UpdateAssetUnitDto, AssetUnitQueryDto } from './dto/asset-unit.dto';
export declare class AssetUnitsController {
    private readonly assetUnitsService;
    constructor(assetUnitsService: AssetUnitsService);
    create(dto: CreateAssetUnitDto): Promise<import("../entities/asset-unit.entity").AssetUnit>;
    findAll(query: AssetUnitQueryDto): Promise<{
        data: import("../entities/asset-unit.entity").AssetUnit[];
        total: number;
    }>;
    findOne(id: number): Promise<import("../entities/asset-unit.entity").AssetUnit>;
    findByTag(assetTag: string): Promise<import("../entities/asset-unit.entity").AssetUnit>;
    update(id: number, dto: UpdateAssetUnitDto): Promise<import("../entities/asset-unit.entity").AssetUnit>;
}
