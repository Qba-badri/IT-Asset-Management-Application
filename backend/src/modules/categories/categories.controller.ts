import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Get()
  async getCategories() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  async getCategory(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  async createCategory(
    @Body() body: { name: string; description: string; isActive?: boolean; allowedTargetTypes?: string[] },
  ) {
    return this.categoriesService.create(
      body.name,
      body.description,
      body.isActive ?? true,
      body.allowedTargetTypes,
    );
  }

  @Put(':id')
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name: string; description: string; isActive: boolean; allowedTargetTypes?: string[] },
  ) {
    return this.categoriesService.update(
      id,
      body.name,
      body.description,
      body.isActive,
      body.allowedTargetTypes,
    );
  }

  @Delete(':id')
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    await this.categoriesService.delete(id);
    return { message: 'Category deleted successfully' };
  }
}
