import { CatalogService } from './catalog.service';
import { CreateCatalogItemDto, UpdateCatalogItemDto, CatalogQueryDto } from './dto/catalog-item.dto';
export declare class CatalogController {
    private readonly catalogService;
    constructor(catalogService: CatalogService);
    create(dto: CreateCatalogItemDto): Promise<import("../entities/catalog-item.entity").CatalogItem>;
    findAll(query: CatalogQueryDto): Promise<{
        data: import("../entities/catalog-item.entity").CatalogItem[];
        total: number;
    }>;
    findOne(id: number): Promise<import("../entities/catalog-item.entity").CatalogItem>;
    update(id: number, dto: UpdateCatalogItemDto): Promise<import("../entities/catalog-item.entity").CatalogItem>;
    deactivate(id: number): Promise<import("../entities/catalog-item.entity").CatalogItem>;
}
