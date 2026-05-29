import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { CatalogItem } from '../../entities/catalog-item.entity';
import {
  CreateCatalogItemDto,
  UpdateCatalogItemDto,
  CatalogQueryDto,
} from './dto/catalog-item.dto';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(CatalogItem)
    private readonly catalogRepo: Repository<CatalogItem>,
  ) {}

  async create(dto: CreateCatalogItemDto): Promise<CatalogItem> {
    const existing = await this.catalogRepo.findOne({
      where: { sku: dto.sku },
    });
    if (existing) {
      throw new ConflictException(
        `Catalog item with SKU "${dto.sku}" already exists`,
      );
    }
    const item = this.catalogRepo.create(dto);
    return this.catalogRepo.save(item);
  }

  async findAll(
    query: CatalogQueryDto,
  ): Promise<{ data: CatalogItem[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 25;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<CatalogItem> = {};

    if (query.returnPolicy) where.returnPolicy = query.returnPolicy;
    if (query.trackMode) where.trackMode = query.trackMode;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const qb = this.catalogRepo
      .createQueryBuilder('ci')
      .leftJoinAndSelect('ci.category', 'category')
      .where(where)
      .skip(skip)
      .take(limit)
      .orderBy('ci.name', 'ASC');

    if (query.search) {
      qb.andWhere(
        '(ci.name ILIKE :search OR ci.sku ILIKE :search OR ci.brand ILIKE :search)',
        {
          search: `%${query.search}%`,
        },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: number): Promise<CatalogItem> {
    const item = await this.catalogRepo.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!item) throw new NotFoundException(`Catalog item #${id} not found`);
    return item;
  }

  async findBySku(sku: string): Promise<CatalogItem> {
    const item = await this.catalogRepo.findOne({
      where: { sku },
      relations: ['category'],
    });
    if (!item)
      throw new NotFoundException(`Catalog item with SKU "${sku}" not found`);
    return item;
  }

  async update(id: number, dto: UpdateCatalogItemDto): Promise<CatalogItem> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.catalogRepo.save(item);
  }

  async deactivate(id: number): Promise<CatalogItem> {
    return this.update(id, { isActive: false });
  }
}
