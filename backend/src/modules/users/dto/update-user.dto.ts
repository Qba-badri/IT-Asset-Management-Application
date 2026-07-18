import { IsString, IsEmail, IsOptional, IsNumber, MinLength, IsBoolean } from 'class-validator';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsOptional()
    lastName?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsNumber()
    @IsOptional()
    roleId?: number;

    @IsString()
    @MinLength(6)
    @IsOptional()
    password?: string;

    @IsNumber()
    @IsOptional()
    departmentId?: number;

    @IsString()
    @IsOptional()
    designation?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateProfileDto {
    @IsString()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsOptional()
    lastName?: string;

    @IsString()
    @IsOptional()
    phoneNumber?: string;

    @IsString()
    @IsOptional()
    location?: string;
}
