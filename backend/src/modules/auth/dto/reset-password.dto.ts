import { IsEmail, IsNotEmpty, MinLength, IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  otp: string;

  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
