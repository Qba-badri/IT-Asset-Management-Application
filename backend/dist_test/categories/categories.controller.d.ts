import { CategoriesService } from './categories.service';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    getCategories(): Promise<import("../entities/category.entity").Category[]>;
    getCategory(id: number): Promise<import("../entities/category.entity").Category>;
    createCategory(body: {
        name: string;
        description: string;
        isActive?: boolean;
        allowedTargetTypes?: string[];
    }): Promise<import("../entities/category.entity").Category>;
    updateCategory(id: number, body: {
        name: string;
        description: string;
        isActive: boolean;
        allowedTargetTypes?: string[];
    }): Promise<import("../entities/category.entity").Category>;
    deleteCategory(id: number): Promise<{
        message: string;
    }>;
}
