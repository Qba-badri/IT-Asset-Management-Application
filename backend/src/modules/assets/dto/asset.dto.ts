import {
    IsArray, IsString, IsOptional, IsNumber, IsDateString, IsEnum, IsNotEmpty } from 'class-validator';
import { Observe } from '../../../common/validation/observe.decorator';
import { Type } from 'class-transformer';
import { RequiredWhen } from '../../../common/validation/required-when.decorator';
import { AssetStatus, AssetCondition } from '../../../entities/asset.entity';

export class CreateAssetDto {
    @IsString()
    @Observe('Backfill 2026-07: already mandatory, but accepted an empty string')
    @IsNotEmpty()
    assetTag: string;

    @IsString()
    @Observe('Backfill 2026-07: already mandatory, but accepted an empty string')
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    hostname?: string;

    @IsString()
    @Observe('Backfill 2026-07: already mandatory, but accepted an empty string')
    @IsNotEmpty()
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
    currency?: string;

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

}

export class UpdateAssetDto extends CreateAssetDto { }

export class DeployAssetDto {
    @IsString()
    @IsNotEmpty()
    targetType: string;

    /**
     * Mirrors the check in AssetsService.deploy() ("User ID is required for
     * PERSON assignment"). Declaring it here moves an imperative guard into the
     * DTO so the client can be told the same rule — the behaviour is unchanged.
     */
    @RequiredWhen({ field: 'targetType', equals: ['PERSON'] })
    @IsNumber()
    userId?: number;

    @RequiredWhen({ field: 'targetType', equals: ['LOCATION'] })
    @IsString()
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

    /**
     * Optional by design: AssetsService.deploy() defaults an absent date to
     * now, and API callers rely on that. The deploy *form* requires it, which
     * is a UI-level choice — see DEPLOY_FORM_RULES in the frontend.
     */
    @Type(() => Date)
    @IsOptional()
    deploymentDate?: Date;

    /**
     * Mirrors the check in AssetsService.deploy() ("A reason is required to
     * deploy an asset"), which @IsString() alone did not enforce — an empty
     * string is a valid string.
     */
    @IsString()
    @IsNotEmpty()
    reason: string;

}

export class UndeployAssetDto {
    @IsString()
    @Observe('Backfill 2026-07: already mandatory, but accepted an empty string')
    @IsNotEmpty()
    reason: string;

    @IsEnum(AssetCondition)
    condition: AssetCondition;

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

}

export class AssetMaintenanceCompleteDto {
    @Type(() => Date)
    maintenanceCompletedDate: Date;

    @IsString()
    @Observe('Backfill 2026-07: already mandatory, but accepted an empty string')
    @IsNotEmpty()
    workPerformed: string;

    @IsString()
    @IsOptional()
    completionNotes?: string;

    @Type(() => Date)
    @IsOptional()
    nextMaintenanceDate?: Date;

}

export class AssetDisposeDto {
    @IsString()
    @Observe('Backfill 2026-07: already mandatory, but accepted an empty string')
    @IsNotEmpty()
    disposalMethod: string;

    @IsString()
    @Observe('Backfill 2026-07: already mandatory, but accepted an empty string')
    @IsNotEmpty()
    disposalReason: string;

    @Type(() => Date)
    disposalDate: Date;

    @IsString()
    @IsOptional()
    disposalNotes?: string;

}

export class ConfirmImportDto {
    @IsArray()
    assets: any[];
}
