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
} from '@nestjs/common';
import { MasterService } from './master.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('masters')
@UseGuards(JwtAuthGuard)
export class MasterController {
  constructor(private readonly masterService: MasterService) { }

  // Brands
  @Get('brands')
  async getBrands() {
    return this.masterService.findAllBrands();
  }

  @Post('brands')
  async createBrand(@Body() data: any) {
    return this.masterService.createBrand(data);
  }

  @Put('brands/:id')
  async updateBrand(@Param('id') id: number, @Body() data: any) {
    return this.masterService.updateBrand(id, data);
  }

  @Delete('brands/:id')
  async deleteBrand(@Param('id') id: number) {
    return this.masterService.deleteBrand(id);
  }

  // Vendors
  @Get('vendors')
  async getVendors() {
    return this.masterService.findAllVendors();
  }

  @Post('vendors')
  async createVendor(@Body() data: any) {
    return this.masterService.createVendor(data);
  }

  @Put('vendors/:id')
  async updateVendor(@Param('id') id: number, @Body() data: any) {
    return this.masterService.updateVendor(id, data);
  }

  @Delete('vendors/:id')
  async deleteVendor(@Param('id') id: number) {
    return this.masterService.deleteVendor(id);
  }

  @Get('vendors/:id/plans')
  async getVendorPlans(@Param('id') id: number) {
    return this.masterService.findPlansByVendor(id);
  }

  // Plans
  @Get('plans')
  async getPlans() {
    return this.masterService.findAllPlans();
  }

  @Post('plans')
  async createPlan(@Body() data: any) {
    return this.masterService.createPlan(data);
  }

  @Put('plans/:id')
  async updatePlan(@Param('id') id: number, @Body() data: any) {
    return this.masterService.updatePlan(id, data);
  }

  @Delete('plans/:id')
  async deletePlan(@Param('id') id: number) {
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
  async createLookup(@Body() data: any) {
    return this.masterService.createLookup(data);
  }

  @Put('lookups/:id')
  async updateLookup(@Param('id') id: number, @Body() data: any) {
    return this.masterService.updateLookup(id, data);
  }

  @Delete('lookups/:id')
  async deleteLookup(@Param('id') id: number) {
    return this.masterService.deleteLookup(id);
  }
}
