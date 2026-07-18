import { IsBoolean, IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import {
  NotificationCategory,
  RecipientType,
} from '../../../entities/notification-recipient-config.entity';

export class CreateNotificationRecipientDto {
  @IsEnum(NotificationCategory)
  notificationType: NotificationCategory;

  @IsEnum(RecipientType)
  recipientType: RecipientType;

  @ValidateIf(
    (dto: CreateNotificationRecipientDto) =>
      dto.recipientType === RecipientType.STATIC_EMAIL ||
      dto.recipientType === RecipientType.USER_ID,
  )
  @IsString()
  recipientValue?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateNotificationRecipientDto {
  @IsOptional()
  @IsString()
  recipientValue?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
