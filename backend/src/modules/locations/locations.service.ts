import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '../../entities/location.entity';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
  ) {}

  async create(data: Partial<Location>): Promise<Location> {
    const existing = await this.locationRepo.findOne({
      where: { name: data.name },
    });
    if (existing)
      throw new ConflictException(`Location "${data.name}" already exists`);
    return this.locationRepo.save(this.locationRepo.create(data));
  }

  async findAll(): Promise<Location[]> {
    return this.locationRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Location> {
    const loc = await this.locationRepo.findOne({ where: { id } });
    if (!loc) throw new NotFoundException(`Location #${id} not found`);
    return loc;
  }

  async update(id: number, data: Partial<Location>): Promise<Location> {
    const loc = await this.findOne(id);
    Object.assign(loc, data);
    return this.locationRepo.save(loc);
  }
}
