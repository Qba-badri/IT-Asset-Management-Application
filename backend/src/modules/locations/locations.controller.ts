import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { LocationsService } from './locations.service';
import { Location } from '../../entities/location.entity';

@Controller('api/locations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @Permissions('locations.manage')
  create(@Body() data: Partial<Location>) {
    return this.locationsService.create(data);
  }

  @Get()
  @Permissions('locations.view')
  findAll() {
    return this.locationsService.findAll();
  }

  @Get(':id')
  @Permissions('locations.view')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.locationsService.findOne(id);
  }

  @Put(':id')
  @Permissions('locations.manage')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<Location>,
  ) {
    return this.locationsService.update(id, data);
  }
}
