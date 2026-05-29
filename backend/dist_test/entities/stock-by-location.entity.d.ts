import { CatalogItem } from './catalog-item.entity';
import { Location } from './location.entity';
export declare class StockByLocation {
    id: number;
    catalogItem: CatalogItem;
    catalogItemId: number;
    location: Location;
    locationId: number;
    quantity: number;
    updatedAt: Date;
}
