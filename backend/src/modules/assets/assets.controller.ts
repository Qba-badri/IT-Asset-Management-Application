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
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateAssetDto, UpdateAssetDto, DeployAssetDto, UndeployAssetDto, AssetMaintenanceDto, AssetMaintenanceCompleteDto, AssetDisposeDto, ConfirmImportDto } from './dto/asset.dto';

@Controller('assets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) { }

  @Get()
  @Permissions('assets.view')
  async findAll(@Req() req: any) {
    return this.assetsService.findAll(req.user);
  }

  @Get('statistics')
  @Permissions('assets.view')
  async getStatistics(@Req() req: any) {
    return this.assetsService.getStatistics(req.user);
  }

  @Get(':id')
  @Permissions('assets.view')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.assetsService.findOne(id, req.user);
  }

  @Get(':id/history')
  @Permissions('assets.view')
  async getHistory(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.assetsService.getHistory(id, req.user);
  }

  @Post()
  @Permissions('assets.create')
  async create(@Body() body: CreateAssetDto, @Req() req: any) {
    // Actor is always the authenticated user — never client-supplied
    return this.assetsService.create(body, req.user.id);
  }

  @Put(':id')
  @Permissions('assets.manage')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAssetDto,
    @Req() req: any,
  ) {
    return this.assetsService.update(id, body, req.user.id);
  }

  @Post(':id/deploy')
  @Permissions('assets.manage')
  async deploy(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: DeployAssetDto,
    @Req() req: any,
  ) {
    return this.assetsService.deploy(id, body, req.user.id);
  }

  @Post(':id/undeploy')
  @Permissions('assets.manage')
  async undeploy(@Param('id', ParseIntPipe) id: number, @Body() body: UndeployAssetDto, @Req() req: any) {
    return this.assetsService.undeploy(id, body.reason, body.condition, req.user.id);
  }

  @Post(':id/maintenance')
  @Permissions('assets.manage')
  async scheduleMaintenance(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AssetMaintenanceDto,
    @Req() req: any,
  ) {
    return this.assetsService.scheduleMaintenance(id, body, req.user.id);
  }

  @Post(':id/maintenance/complete')
  @Permissions('assets.manage')
  async completeMaintenance(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AssetMaintenanceCompleteDto,
    @Req() req: any,
  ) {
    return this.assetsService.completeMaintenance(id, body, req.user.id);
  }

  @Post(':id/depreciation')
  @Permissions('assets.manage')
  async calculateDepreciation(
    @Param('id', ParseIntPipe) id: number,
    @Req() req?: any,
  ) {
    return this.assetsService.calculateDepreciation(id, req.user.id);
  }

  @Get('generate-tag/:category')
  @Permissions('assets.manage')
  async generateNextTag(@Param('category') category: string) {
    return this.assetsService.generateNextTag(category);
  }

  @Post(':id/dispose')
  @Permissions('assets.manage')
  async dispose(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AssetDisposeDto,
    @Req() req?: any,
  ) {
    return this.assetsService.dispose(id, body, req.user.id);
  }

  @Post(':id/photos')
  @Permissions('assets.manage')
  @UseInterceptors(
    FilesInterceptor('photos', 10, {
      storage: diskStorage({
        destination: './uploads/assets',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `asset-${req.params.id}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed!'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadPhotos(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
  ) {
    return this.assetsService.uploadPhotos(id, files, body);
  }

  @Get(':id/photos')
  @Permissions('assets.view')
  async getPhotos(@Param('id', ParseIntPipe) id: number) {
    return this.assetsService.getPhotos(id);
  }

  @Delete(':assetId/photos/:photoId')
  @Permissions('assets.manage')
  async deletePhoto(
    @Param('assetId', ParseIntPipe) assetId: number,
    @Param('photoId', ParseIntPipe) photoId: number,
  ) {
    await this.assetsService.deletePhoto(assetId, photoId);
    return { message: 'Photo deleted successfully' };
  }

  @Post('import/validate')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions('assets.manage')
  async validateImport(@UploadedFile() file: Express.Multer.File) {
    return this.assetsService.validateImport(file.buffer);
  }

  @Post('import/confirm')
  @Permissions('assets.manage')
  async confirmImport(@Body() body: ConfirmImportDto, @Req() req: any) {
    return this.assetsService.bulkCreate(body.assets, req.user.id);
  }

  @Delete(':id')
  @Permissions('assets.delete')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.assetsService.delete(id);
    return { message: 'Asset deleted successfully' };
  }
}
