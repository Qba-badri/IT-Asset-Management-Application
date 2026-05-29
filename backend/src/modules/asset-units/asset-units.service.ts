import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { AssetUnit, AssetUnitStatus } from '../../entities/asset-unit.entity';
import { CatalogItem, TrackMode } from '../../entities/catalog-item.entity';
import {
  CreateAssetUnitDto,
  UpdateAssetUnitDto,
  AssetUnitQueryDto,
} from './dto/asset-unit.dto';

@Injectable()
export class AssetUnitsService {
  constructor(
    @InjectRepository(AssetUnit)
    private readonly assetUnitRepo: Repository<AssetUnit>,
    @InjectRepository(CatalogItem)
    private readonly catalogRepo: Repository<CatalogItem>,
  ) {}

  async create(dto: CreateAssetUnitDto): Promise<AssetUnit> {
    // Validate catalog item is serialized
    const catalog = await this.catalogRepo.findOne({
      where: { id: dto.catalogItemId },
    });
    if (!catalog)
      throw new NotFoundException(
        `Catalog item #${dto.catalogItemId} not found`,
      );
    if (catalog.trackMode !== TrackMode.SERIALIZED) {
      throw new BadRequestException(
        'Asset units can only be created for SERIALIZED catalog items',
      );
    }

    const existing = await this.assetUnitRepo.findOne({
      where: { assetTag: dto.assetTag },
    });
    if (existing)
      throw new ConflictException(`Asset tag "${dto.assetTag}" already exists`);

    const unit = this.assetUnitRepo.create(dto);
    return this.assetUnitRepo.save(unit);
  }

  async findAll(
    query: AssetUnitQueryDto,
  ): Promise<{ data: AssetUnit[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 25;
    const skip = (page - 1) * limit;

    const qb = this.assetUnitRepo
      .createQueryBuilder('au')
      .leftJoinAndSelect('au.catalogItem', 'catalogItem')
      .leftJoinAndSelect('au.location', 'location')
      .skip(skip)
      .take(limit)
      .orderBy('au.assetTag', 'ASC');

    if (query.catalogItemId)
      qb.andWhere('au.catalogItemId = :catId', { catId: query.catalogItemId });
    if (query.status)
      qb.andWhere('au.status = :status', { status: query.status });
    if (query.locationId)
      qb.andWhere('au.locationId = :locId', { locId: query.locationId });
    if (query.search) {
      qb.andWhere('(au.assetTag ILIKE :s OR au.serialNumber ILIKE :s)', {
        s: `%${query.search}%`,
      });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: number): Promise<AssetUnit> {
    const unit = await this.assetUnitRepo.findOne({
      where: { id },
      relations: ['catalogItem', 'location'],
    });
    if (!unit) throw new NotFoundException(`Asset unit #${id} not found`);
    return unit;
  }

  async findByAssetTag(assetTag: string): Promise<AssetUnit> {
    const unit = await this.assetUnitRepo.findOne({
      where: { assetTag },
      relations: ['catalogItem', 'location'],
    });
    if (!unit)
      throw new NotFoundException(`Asset unit "${assetTag}" not found`);
    return unit;
  }

  async update(id: number, dto: UpdateAssetUnitDto): Promise<AssetUnit> {
    const unit = await this.findOne(id);
    Object.assign(unit, dto);
    return this.assetUnitRepo.save(unit);
  }
}
