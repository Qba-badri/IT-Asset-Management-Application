import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
export declare class CategoriesService {
    private categoryRepository;
    constructor(categoryRepository: Repository<Category>);
    findAll(): Promise<Category[]>;
    findOne(id: number): Promise<Category>;
    create(name: string, description: string, isActive?: boolean, allowedTargetTypes?: string[]): Promise<Category>;
    update(id: number, name: string, description: string, isActive: boolean, allowedTargetTypes?: string[]): Promise<Category>;
    delete(id: number): Promise<void>;
}
