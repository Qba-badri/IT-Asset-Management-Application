import {
  Controller,
  Get,
  Post,
  Put,
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
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AssetUnitsService } from './asset-units.service';
import {
  CreateAssetUnitDto,
  UpdateAssetUnitDto,
  AssetUnitQueryDto,
} from './dto/asset-unit.dto';

@Controller('api/asset-units')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AssetUnitsController {
  constructor(private readonly assetUnitsService: AssetUnitsService) {}

  @Post()
  @Permissions('assets.create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAssetUnitDto) {
    return this.assetUnitsService.create(dto);
  }

  @Get()
  @Permissions('assets.view')
  findAll(@Query() query: AssetUnitQueryDto) {
    return this.assetUnitsService.findAll(query);
  }

  @Get(':id')
  @Permissions('assets.view')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.assetUnitsService.findOne(id);
  }

  @Get('tag/:assetTag')
  @Permissions('assets.view')
  findByTag(@Param('assetTag') assetTag: string) {
    return this.assetUnitsService.findByAssetTag(assetTag);
  }

  @Put(':id')
  @Permissions('assets.edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssetUnitDto,
  ) {
    return this.assetUnitsService.update(id, dto);
  }
}
