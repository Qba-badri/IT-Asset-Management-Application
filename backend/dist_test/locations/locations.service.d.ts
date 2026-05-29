import { Repository } from 'typeorm';
import { Location } from '../entities/location.entity';
export declare class LocationsService {
    private readonly locationRepo;
    constructor(locationRepo: Repository<Location>);
    create(data: Partial<Location>): Promise<Location>;
    findAll(): Promise<Location[]>;
    findOne(id: number): Promise<Location>;
    update(id: number, data: Partial<Location>): Promise<Location>;
}
