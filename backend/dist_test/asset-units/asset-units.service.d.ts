import { Repository } from 'typeorm';
import { AssetUnit } from '../entities/asset-unit.entity';
import { CatalogItem } from '../entities/catalog-item.entity';
import { CreateAssetUnitDto, UpdateAssetUnitDto, AssetUnitQueryDto } from './dto/asset-unit.dto';
export declare class AssetUnitsService {
    private readonly assetUnitRepo;
    private readonly catalogRepo;
    constructor(assetUnitRepo: Repository<AssetUnit>, catalogRepo: Repository<CatalogItem>);
    create(dto: CreateAssetUnitDto): Promise<AssetUnit>;
    findAll(query: AssetUnitQueryDto): Promise<{
        data: AssetUnit[];
        total: number;
    }>;
    findOne(id: number): Promise<AssetUnit>;
    findByAssetTag(assetTag: string): Promise<AssetUnit>;
    update(id: number, dto: UpdateAssetUnitDto): Promise<AssetUnit>;
}
