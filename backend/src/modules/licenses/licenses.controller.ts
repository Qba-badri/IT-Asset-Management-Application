import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Patch,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { LicensesService } from './licenses.service';
import { License } from '../../entities/license.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateLicenseDto, UpdateLicenseDto, AssignLicenseDto, RenewLicenseDto, AdjustSeatsDto } from './dto/license.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('licenses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) { }

  @Get()
  @Permissions('licenses.view')
  async findAll(@Req() req: any) {
    return this.licensesService.findAll(req.user);
  }

  @Get('statistics')
  @Permissions('licenses.view')
  async getStatistics(@Req() req: any) {
    return this.licensesService.getStatistics(req.user);
  }

  @Get(':id')
  @Permissions('licenses.view')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.licensesService.findOne(id, req.user);
  }

  @Post()
  @Permissions('licenses.create')
  async create(@Body() data: CreateLicenseDto): Promise<License> {
    return this.licensesService.create(data);
  }

  @Put(':id')
  @Permissions('licenses.manage')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateLicenseDto,
  ): Promise<License> {
    return this.licensesService.update(id, data);
  }

  @Get('user/:userId')
  @Permissions('licenses.view')
  async findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.licensesService.findUserAssignments(userId);
  }

  @Post(':id/assign')
  @Permissions('licenses.manage')
  async assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: AssignLicenseDto,
  ) {
    return this.licensesService.assignLicense(id, data.userId, data.notes);
  }

  @Delete('assignments/:id')
  @Permissions('licenses.manage')
  async unassign(@Param('id', ParseIntPipe) id: number, @Query('reason') reason?: string) {
    return this.licensesService.unassignLicense(id, reason);
  }

  @Delete(':id')
  @Permissions('licenses.delete')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.licensesService.delete(id);
  }

  @Post(':id/renew')
  @Permissions('licenses.manage')
  async renew(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: RenewLicenseDto,
    @Req() req: any
  ) {
    return this.licensesService.renewLicense(id, data, req.user?.id);
  }

  @Get(':id/history')
  @Permissions('licenses.view')
  async getHistory(@Param('id', ParseIntPipe) id: number) {
    return this.licensesService.findHistory(id);
  }

  @Patch(':id/adjust-seats')
  @Permissions('licenses.manage')
  async adjustSeats(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: AdjustSeatsDto,
    @Req() req: any
  ) {
    return this.licensesService.adjustSeats(id, data, req.user?.id);
  }

  @Post('import/validate')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions('licenses.manage')
  async validateImport(@UploadedFile() file: Express.Multer.File) {
    return this.licensesService.validateImport(file.buffer);
  }

  @Post('import/confirm')
  @Permissions('licenses.manage')
  async confirmImport(@Body('licenses') licenses: any[], @Req() req: any) {
    return this.licensesService.bulkCreate(licenses, req.user?.id);
  }
}

