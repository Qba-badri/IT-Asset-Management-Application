import { IsString, IsOptional, IsNumber, IsBoolean, IsDate, IsNotEmpty, Min } from 'class-validator';
import { Observe } from '../../../common/validation/observe.decorator';
import { Type } from 'class-transformer';

export class CreateLicenseDto {
    @IsString()
    @Observe('Backfill 2026-07: already mandatory, but accepted an empty string')
    @IsNotEmpty()
    softwareName: string;

    @IsString()
    @IsOptional()
    vendor?: string;

    @IsNumber()
    @IsOptional()
    vendorId?: number;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsString()
    @IsOptional()
    planName?: string;

    @IsNumber()
    @IsOptional()
    licensePlanId?: number;

    @IsString()
    @IsOptional()
    productKey?: string;

    @IsString()
    @IsOptional()
    contractId?: string;

    @IsString()
    @IsOptional()
    tenantId?: string;

    @IsNumber()
    @IsOptional()
    totalSeats?: number;

    @IsNumber()
    @IsOptional()
    usedSeats?: number;

    @IsBoolean()
    @IsOptional()
    cloudMode?: boolean;

    @IsNumber()
    @IsOptional()
    unitPrice?: number;

    @IsNumber()
    @IsOptional()
    totalCost?: number;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsString()
    @IsOptional()
    billingFrequency?: string;

    @IsString()
    @IsOptional()
    commitmentTerm?: string;

    @Type(() => Date)
    @IsDate()
    purchaseDate: Date;

    @Type(() => Date)
    @IsDate()
    expiryDate: Date;

    @Type(() => Date)
    @IsDate()
    nextRenewalDate: Date;

    @IsNumber()
    @IsOptional()
    noticePeriodDays?: number;

    @IsString()
    @IsOptional()
    renewalStatus?: string;

    @IsString()
    @IsOptional()
    complianceRisk?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    // To prevent whitelisting errors for read-only fields
    @IsOptional()
    id?: any;
    @IsOptional()
    createdAt?: any;
    @IsOptional()
    updatedAt?: any;
    @IsOptional()
    vendorObj?: any;
    @IsOptional()
    licensePlan?: any;
}

export class UpdateLicenseDto extends CreateLicenseDto { }

export class AssignLicenseDto {
    @IsNumber()
    userId: number;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class RenewLicenseDto {
    @IsDate()
    @Type(() => Date)
    newExpiryDate: Date;

    @IsNumber()
    costChange: number;

    @IsString()
    @IsOptional()
    remarks?: string;
}

export class AdjustSeatsDto {
    @IsNumber()
    @Min(1, { message: 'Total seats must be greater than zero' })
    seats: number;

    @IsNumber()
    @IsOptional()
    usedSeats?: number;

    @IsString()
    @IsNotEmpty({ message: 'A reason is required for seat adjustments' })
    reason: string;
}

