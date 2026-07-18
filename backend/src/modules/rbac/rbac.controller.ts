import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { UpdateStatusDto } from '../../common/dto/update-status.dto';

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

  /** Soft (de)activation; assignments are preserved either way. */
  @Patch('roles/:id/status')
  @Permissions('roles.manage')
  async setRoleStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateStatusDto,
    @Request() req: any,
  ) {
    return this.rbacService.setRoleStatus(id, body.isActive, req.user.id);
  }

  /** Assignment counts for the deactivation confirmation dialog. */
  @Get('roles/:id/impact')
  @Permissions('roles.manage')
  async getRoleImpact(@Param('id', ParseIntPipe) id: number) {
    return this.rbacService.getRoleImpact(id);
  }

  @Get('permissions')
  @Permissions('roles.view')
  async getPermissions() {
    return this.rbacService.findAllPermissions();
  }

  /** The permissions this build understands, each flagged if already created. */
  @Get('permissions/catalog')
  @Permissions('roles.view')
  async getPermissionCatalog() {
    return this.rbacService.getPermissionCatalog();
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

  /** Soft (de)activation; role-permission mappings are preserved either way. */
  @Patch('permissions/:id/status')
  @Permissions('roles.manage')
  async setPermissionStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateStatusDto,
    @Request() req: any,
  ) {
    return this.rbacService.setPermissionStatus(id, body.isActive, req.user.id);
  }

  /** Affected-role counts/names for the deactivation confirmation dialog. */
  @Get('permissions/:id/impact')
  @Permissions('roles.manage')
  async getPermissionImpact(@Param('id', ParseIntPipe) id: number) {
    return this.rbacService.getPermissionImpact(id);
  }
}
