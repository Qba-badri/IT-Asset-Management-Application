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
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('rbac')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) { }

  @Get('roles')
  @Permissions('roles.view')
  async getRoles() {
    return this.rbacService.findAllRoles();
  }

  @Post('roles')
  @Permissions('roles.manage')
  async createRole(
    @Body()
    body: {
      name: string;
      description: string;
      permissionIds: number[];
    },
  ) {
    return this.rbacService.createRole(
      body.name,
      body.description,
      body.permissionIds || [],
    );
  }

  @Put('roles/:id')
  @Permissions('roles.manage')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: { name: string; description: string; permissionIds: number[] },
  ) {
    return this.rbacService.updateRole(
      id,
      body.name,
      body.description,
      body.permissionIds || [],
    );
  }

  @Delete('roles/:id')
  @Permissions('roles.manage')
  async deleteRole(@Param('id', ParseIntPipe) id: number) {
    await this.rbacService.deleteRole(id);
    return { message: 'Role deleted successfully' };
  }

  @Get('permissions')
  @Permissions('roles.view')
  async getPermissions() {
    return this.rbacService.findAllPermissions();
  }

  @Post('permissions')
  @Permissions('roles.manage')
  async createPermission(
    @Body() body: { slug: string; module: string; description: string },
  ) {
    return this.rbacService.createPermission(
      body.slug,
      body.module,
      body.description,
    );
  }

  @Put('permissions/:id')
  @Permissions('roles.manage')
  async updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { slug: string; module: string; description: string },
  ) {
    return this.rbacService.updatePermission(
      id,
      body.slug,
      body.module,
      body.description,
    );
  }

  @Delete('permissions/:id')
  @Permissions('roles.manage')
  async deletePermission(@Param('id', ParseIntPipe) id: number) {
    await this.rbacService.deletePermission(id);
    return { message: 'Permission deleted successfully' };
  }
}
