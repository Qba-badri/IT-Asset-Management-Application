import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { AuditEventsService } from '../audit-events/audit-events.service';
import { AuditAction } from '../../entities/audit-event.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private dataSource: DataSource,
    private auditEvents: AuditEventsService,
  ) { }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async create(
    name: string,
    description: string,
    isActive: boolean = true,
    allowedTargetTypes: string[] = ['PERSON'],
  ): Promise<Category> {
    // Check if category with same name already exists
    const existingCategory = await this.categoryRepository.findOne({
      where: { name },
    });
    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = this.categoryRepository.create({
      name,
      description,
      isActive,
      allowedTargetTypes,
    });
    return this.categoryRepository.save(category);
  }

  async update(
    id: number,
    name: string,
    description: string,
    isActive: boolean,
    allowedTargetTypes?: string[],
    actorId?: number,
  ): Promise<Category> {
    const category = await this.findOne(id);

    // Check if another category with the same name exists (excluding current category)
    if (name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name },
      });
      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    const statusChanging =
      isActive !== undefined && isActive !== category.isActive;
    const from = category.isActive;

    category.name = name;
    category.description = description;
    category.isActive = isActive;
    if (allowedTargetTypes) {
      category.allowedTargetTypes = allowedTargetTypes;
    }

    if (!statusChanging) {
      return this.categoryRepository.save(category);
    }

    // A status change and its audit record commit atomically.
    return this.dataSource.transaction(async (manager) => {
      const saved = await manager.save(category);
      await this.auditEvents.logEvent(
        {
          action: AuditAction.UPDATE,
          entityType: 'Category',
          entityId: id,
          actorId,
          metadata: { field: 'isActive', from, to: isActive, name: category.name },
        },
        manager,
      );
      return saved;
    });
  }

  async delete(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }
}
