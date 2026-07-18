import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTemplateDto {
  @IsString()
  @MaxLength(255)
  subject: string;

  @IsString()
  bodyHtml: string;
}

export class SendTestTemplateDto {
  @IsOptional()
  @IsString()
  email?: string;
}
