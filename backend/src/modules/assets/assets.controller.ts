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
import { CreateAssetDto, UpdateAssetDto, DeployAssetDto, AssetMaintenanceDto, AssetMaintenanceCompleteDto, AssetDisposeDto } from './dto/asset.dto';

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
  async create(@Body() body: CreateAssetDto) {
    return this.assetsService.create(body, body.performedBy);
  }

  @Put(':id')
  @Permissions('assets.manage')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAssetDto
  ) {
    return this.assetsService.update(id, body, body.performedBy);
  }

  @Post(':id/deploy')
  @Permissions('assets.manage')
  async deploy(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: DeployAssetDto,
  ) {
    return this.assetsService.deploy(id, body, body.performedBy);
  }

  @Post(':id/undeploy')
  @Permissions('assets.manage')
  async undeploy(@Param('id', ParseIntPipe) id: number, @Body('performedBy') performedBy?: number) {
    return this.assetsService.undeploy(id, performedBy);
  }

  @Post(':id/maintenance')
  @Permissions('assets.manage')
  async scheduleMaintenance(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AssetMaintenanceDto,
  ) {
    console.log('Schedule Maintenance Body:', body);
    return this.assetsService.scheduleMaintenance(id, body, body.performedBy);
  }

  @Post(':id/maintenance/complete')
  @Permissions('assets.manage')
  async completeMaintenance(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AssetMaintenanceCompleteDto
  ) {
    console.log('Complete Maintenance Body:', body);
    return this.assetsService.completeMaintenance(id, body, body.performedBy);
  }

  @Post(':id/depreciation')
  @Permissions('assets.manage')
  async calculateDepreciation(
    @Param('id', ParseIntPipe) id: number,
    @Body('performedBy') performedBy?: number,
  ) {
    return this.assetsService.calculateDepreciation(id, performedBy);
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
    @Body('performedBy') performedBy?: number,
  ) {
    return this.assetsService.dispose(id, body, performedBy);
  }

  @Post(':id/photos')
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
  async getPhotos(@Param('id', ParseIntPipe) id: number) {
    return this.assetsService.getPhotos(id);
  }

  @Delete(':assetId/photos/:photoId')
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
  async confirmImport(@Body('assets') assets: any[], @Body('performedBy') performedBy?: number) {
    return this.assetsService.bulkCreate(assets, performedBy);
  }

  @Delete(':id')
  @Permissions('assets.delete')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.assetsService.delete(id);
    return { message: 'Asset deleted successfully' };
  }
}
