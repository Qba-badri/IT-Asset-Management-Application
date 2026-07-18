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
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateProfileDto } from './dto/update-user.dto';
import { Req } from '@nestjs/common';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @Permissions('users.view')
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  async getMe(@Req() req: any) {
    return this.usersService.findOnePublic(req.user.id);
  }

  // Self-service portfolio (assets, licenses, consumable inventory) for the
  // authenticated user. No users.view permission required — a Standard User
  // can always see what is assigned to them. Must be declared before the
  // ':id/inventory' route so 'me' isn't parsed as a numeric id.
  @Get('me/inventory')
  async getMyInventory(@Req() req: any) {
    return this.usersService.getUserInventory(req.user.id);
  }

  @Post()
  @Permissions('users.create')
  async create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  // Bulk operations take a single request so large selections don't trip the
  // global rate limiter the way per-row calls do.
  @Post('bulk-status')
  @Permissions('users.edit')
  async bulkSetActive(
    @Body() body: { ids: number[]; isActive: boolean },
    @Req() req: any,
  ) {
    return this.usersService.bulkSetActive(body.ids, body.isActive, req.user.id);
  }

  @Post('bulk-delete')
  @Permissions('users.delete')
  async bulkRemove(@Body() body: { ids: number[] }, @Req() req: any) {
    return this.usersService.bulkRemove(body.ids, req.user.id);
  }

  @Put('me')
  async updateMe(@Req() req: any, @Body() body: UpdateProfileDto) {
    return this.usersService.update(req.user.id, body);
  }

  @Put(':id')
  @Permissions('users.edit')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
    @Req() req: any,
  ) {
    return this.usersService.update(id, body, {
      id: req.user.id,
      permissions: req.user.permissions || [],
    });
  }

  @Get(':id/inventory')
  @Permissions('users.view')
  async getInventory(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserInventory(id);
  }

  @Get(':id')
  @Permissions('users.view')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOnePublic(id);
  }

  @Delete(':id')
  @Permissions('users.delete')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
