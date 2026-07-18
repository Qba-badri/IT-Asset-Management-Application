import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MasterService } from './master.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import {
  CreateBrandDto,
  UpdateBrandDto,
  CreateVendorDto,
  UpdateVendorDto,
  CreateLicensePlanDto,
  UpdateLicensePlanDto,
  CreateLookupDto,
  UpdateLookupDto,
} from './dto/master.dto';

// Reads stay JWT-only: master lists feed dropdowns across the app.
// All mutations require the matching *.manage permission.
@Controller('masters')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MasterController {
  constructor(private readonly masterService: MasterService) { }

  // Brands
  @Get('brands')
  @Permissions('brands.view')
  async getBrands() {
    return this.masterService.findAllBrands();
  }

  @Post('brands')
  @Permissions('brands.manage')
  async createBrand(@Body() data: CreateBrandDto) {
    return this.masterService.createBrand(data);
  }

  @Put('brands/:id')
  @Permissions('brands.manage')
  async updateBrand(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateBrandDto,
    @Request() req: any,
  ) {
    return this.masterService.updateBrand(id, data, req.user?.id);
  }

  @Delete('brands/:id')
  @Permissions('brands.manage')
  async deleteBrand(@Param('id', ParseIntPipe) id: number) {
    return this.masterService.deleteBrand(id);
  }

  // Vendors
  @Get('vendors')
  @Permissions('vendors.view')
  async getVendors() {
    return this.masterService.findAllVendors();
  }

  @Post('vendors')
  @Permissions('vendors.manage')
  async createVendor(@Body() data: CreateVendorDto) {
    return this.masterService.createVendor(data);
  }

  @Put('vendors/:id')
  @Permissions('vendors.manage')
  async updateVendor(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateVendorDto,
    @Request() req: any,
  ) {
    return this.masterService.updateVendor(id, data, req.user?.id);
  }

  @Delete('vendors/:id')
  @Permissions('vendors.manage')
  async deleteVendor(@Param('id', ParseIntPipe) id: number) {
    return this.masterService.deleteVendor(id);
  }

  @Get('vendors/:id/plans')
  @Permissions('vendors.view')
  async getVendorPlans(@Param('id', ParseIntPipe) id: number) {
    return this.masterService.findPlansByVendor(id);
  }

  // Plans
  @Get('plans')
  @Permissions('licenses.view')
  async getPlans() {
    return this.masterService.findAllPlans();
  }

  @Post('plans')
  @Permissions('licenses.manage')
  async createPlan(@Body() data: CreateLicensePlanDto) {
    return this.masterService.createPlan(data);
  }

  @Put('plans/:id')
  @Permissions('licenses.manage')
  async updatePlan(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateLicensePlanDto,
    @Request() req: any,
  ) {
    return this.masterService.updatePlan(id, data, req.user?.id);
  }

  @Delete('plans/:id')
  @Permissions('licenses.manage')
  async deletePlan(@Param('id', ParseIntPipe) id: number) {
    return this.masterService.deletePlan(id);
  }

  // Lookups
  @Get('lookups')
  async getLookups(@Query('type') type?: string) {
    if (type) {
      return this.masterService.findLookupsByType(type);
    }
    return this.masterService.findAllLookups();
  }

  @Post('lookups')
  @Permissions('settings.manage')
  async createLookup(@Body() data: CreateLookupDto) {
    return this.masterService.createLookup(data);
  }

  @Put('lookups/:id')
  @Permissions('settings.manage')
  async updateLookup(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateLookupDto,
    @Request() req: any,
  ) {
    return this.masterService.updateLookup(id, data, req.user?.id);
  }

  @Delete('lookups/:id')
  @Permissions('settings.manage')
  async deleteLookup(@Param('id', ParseIntPipe) id: number) {
    return this.masterService.deleteLookup(id);
  }
}
