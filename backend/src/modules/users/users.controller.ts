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
    return this.usersService.findOne(req.user.id);
  }

  @Post()
  @Permissions('users.create')
  async create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @Put('me')
  async updateMe(@Req() req: any, @Body() body: UpdateProfileDto) {
    return this.usersService.update(req.user.id, body);
  }

  @Put(':id')
  @Permissions('users.edit')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateUserDto) {
    return this.usersService.update(id, body);
  }

  @Get(':id/inventory')
  @Permissions('users.view')
  async getInventory(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserInventory(id);
  }

  @Get(':id')
  @Permissions('users.view')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Delete(':id')
  @Permissions('users.delete')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
