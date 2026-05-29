import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetUnitsController } from './asset-units.controller';
import { AssetUnitsService } from './asset-units.service';
import { AssetUnit } from '../../entities/asset-unit.entity';
import { CatalogItem } from '../../entities/catalog-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AssetUnit, CatalogItem])],
  controllers: [AssetUnitsController],
  providers: [AssetUnitsService],
  exports: [AssetUnitsService],
})
export class AssetUnitsModule {}
