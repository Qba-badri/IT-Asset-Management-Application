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
  Request,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Get()
  @Permissions('categories.view')
  async getCategories() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @Permissions('categories.view')
  async getCategory(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @Permissions('categories.manage')
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
  @Permissions('categories.manage')
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name: string; description: string; isActive: boolean; allowedTargetTypes?: string[] },
    @Request() req: any,
  ) {
    return this.categoriesService.update(
      id,
      body.name,
      body.description,
      body.isActive,
      body.allowedTargetTypes,
      req.user?.id,
    );
  }

  @Delete(':id')
  @Permissions('categories.manage')
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    await this.categoriesService.delete(id);
    return { message: 'Category deleted successfully' };
  }
}
