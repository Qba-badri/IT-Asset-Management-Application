import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CatalogService } from './catalog.service';
import {
  CreateCatalogItemDto,
  UpdateCatalogItemDto,
  CatalogQueryDto,
} from './dto/catalog-item.dto';

@Controller('api/catalog')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCatalogItemDto) {
    return this.catalogService.create(dto);
  }

  @Get()
  findAll(@Query() query: CatalogQueryDto) {
    return this.catalogService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.catalogService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCatalogItemDto,
  ) {
    return this.catalogService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.catalogService.deactivate(id);
  }
}
