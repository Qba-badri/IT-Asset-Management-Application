import { IsString, IsEmail, IsNumber, MinLength, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNumber()
    @IsNotEmpty()
    roleId: number;

    @IsString()
    @MinLength(6)
    @IsNotEmpty()
    password: string;

    @IsNumber()
    @IsOptional()
    departmentId?: number;

    @IsString()
    @IsOptional()
    designation?: string;
}
