import { Repository } from 'typeorm';
import { CatalogItem } from '../entities/catalog-item.entity';
import { CreateCatalogItemDto, UpdateCatalogItemDto, CatalogQueryDto } from './dto/catalog-item.dto';
export declare class CatalogService {
    private readonly catalogRepo;
    constructor(catalogRepo: Repository<CatalogItem>);
    create(dto: CreateCatalogItemDto): Promise<CatalogItem>;
    findAll(query: CatalogQueryDto): Promise<{
        data: CatalogItem[];
        total: number;
    }>;
    findOne(id: number): Promise<CatalogItem>;
    findBySku(sku: string): Promise<CatalogItem>;
    update(id: number, dto: UpdateCatalogItemDto): Promise<CatalogItem>;
    deactivate(id: number): Promise<CatalogItem>;
}
