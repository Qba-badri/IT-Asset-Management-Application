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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Controller('api/departments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DepartmentsController {
  constructor(private readonly deptService: DepartmentsService) {}

  @Post()
  @Permissions('departments.manage')
  create(@Body() data: CreateDepartmentDto) {
    return this.deptService.create(data);
  }

  // Reads stay JWT-only: department lists feed dropdowns across the app
  @Get()
  findAll() {
    return this.deptService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.deptService.findOne(id);
  }

  @Put(':id')
  @Permissions('departments.manage')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateDepartmentDto,
  ) {
    return this.deptService.update(id, data);
  }
}
