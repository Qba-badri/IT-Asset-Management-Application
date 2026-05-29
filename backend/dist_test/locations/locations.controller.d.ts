import { LocationsService } from './locations.service';
import { Location } from '../entities/location.entity';
export declare class LocationsController {
    private readonly locationsService;
    constructor(locationsService: LocationsService);
    create(data: Partial<Location>): Promise<Location>;
    findAll(): Promise<Location[]>;
    findOne(id: number): Promise<Location>;
    update(id: number, data: Partial<Location>): Promise<Location>;
}
