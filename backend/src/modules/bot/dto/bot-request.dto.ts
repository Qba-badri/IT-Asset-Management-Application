import { IsString, IsNotEmpty } from 'class-validator';

export class BotRequestDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}
