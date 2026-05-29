import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
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

    category.name = name;
    category.description = description;
    category.isActive = isActive;
    if (allowedTargetTypes) {
      category.allowedTargetTypes = allowedTargetTypes;
    }

    return this.categoryRepository.save(category);
  }

  async delete(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }
}
