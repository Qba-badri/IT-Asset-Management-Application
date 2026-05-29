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
import { DepartmentsService } from './departments.service';
import { Department } from '../../entities/department.entity';

@Controller('api/departments')
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
  constructor(private readonly deptService: DepartmentsService) {}

  @Post()
  create(@Body() data: Partial<Department>) {
    return this.deptService.create(data);
  }

  @Get()
  findAll() {
    return this.deptService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.deptService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<Department>,
  ) {
    return this.deptService.update(id, data);
  }
}
