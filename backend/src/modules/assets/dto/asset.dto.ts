import { IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { AssetStatus } from '../../../entities/asset.entity';

export class CreateAssetDto {
    @IsString()
    assetTag: string;

    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    hostname?: string;

    @IsString()
    category: string;

    @IsString()
    @IsOptional()
    brand?: string;

    @IsString()
    @IsOptional()
    model?: string;

    @IsString()
    @IsOptional()
    serialNumber?: string;

    @IsEnum(AssetStatus)
    @IsOptional()
    status?: AssetStatus;

    @IsString()
    @IsOptional()
    condition?: string;

    @IsString()
    @IsOptional()
    acquisitionType?: string;

    @Type(() => Date)
    @IsOptional()
    purchaseDate?: Date;

    @IsNumber()
    @IsOptional()
    purchaseCost?: number;

    @IsString()
    @IsOptional()
    vendor?: string;

    @IsNumber()
    @IsOptional()
    brandId?: number;

    @IsNumber()
    @IsOptional()
    vendorId?: number;

    @Type(() => Date)
    @IsOptional()
    receivedFromVendorDate?: Date;

    @IsNumber()
    @IsOptional()
    vendorMonthlyRent?: number;

    @Type(() => Date)
    @IsOptional()
    warrantyExpiry?: Date;

    @IsString()
    @IsOptional()
    location?: string;

    @IsString()
    @IsOptional()
    poNumber?: string;

    @IsString()
    @IsOptional()
    invoiceNumber?: string;

    @IsString()
    @IsOptional()
    costCenter?: string;

    @IsNumber()
    @IsOptional()
    businessOwnerId?: number;

    @IsString()
    @IsOptional()
    warrantyType?: string;

    @Type(() => Date)
    @IsOptional()
    warrantyStart?: Date;

    @IsNumber()
    @IsOptional()
    maintenanceCycleDays?: number;

    @IsNumber()
    @IsOptional()
    usefulLifeYears?: number;

    @IsNumber()
    @IsOptional()
    salvageValue?: number;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsNumber()
    @IsOptional()
    performedBy?: number;
}

export class UpdateAssetDto extends CreateAssetDto { }

export class DeployAssetDto {
    @IsString()
    targetType: string;

    @IsNumber()
    @IsOptional()
    userId?: number;

    @IsString()
    @IsOptional()
    location?: string;

    @IsString()
    @IsOptional()
    site?: string;

    @IsString()
    @IsOptional()
    building?: string;

    @IsString()
    @IsOptional()
    floor?: string;

    @IsString()
    @IsOptional()
    roomDesk?: string;

    @Type(() => Date)
    @IsOptional()
    deploymentDate?: Date;

    @IsNumber()
    @IsOptional()
    performedBy?: number;
}

export class AssetMaintenanceDto {
    @Type(() => Date)
    @IsOptional()
    lastMaintenanceDate?: Date;

    @Type(() => Date)
    nextMaintenanceDate: Date;

    @IsString()
    @IsOptional()
    maintenanceNotes?: string;

    @IsNumber()
    @IsOptional()
    performedBy?: number;
}

export class AssetMaintenanceCompleteDto {
    @Type(() => Date)
    maintenanceCompletedDate: Date;

    @IsString()
    workPerformed: string;

    @IsString()
    @IsOptional()
    completionNotes?: string;

    @Type(() => Date)
    @IsOptional()
    nextMaintenanceDate?: Date;

    @IsNumber()
    @IsOptional()
    performedBy?: number;
}

export class AssetDisposeDto {
    @IsString()
    disposalMethod: string;

    @IsString()
    disposalReason: string;

    @Type(() => Date)
    disposalDate: Date;

    @IsString()
    @IsOptional()
    disposalNotes?: string;

    @IsNumber()
    @IsOptional()
    performedBy?: number;
}
