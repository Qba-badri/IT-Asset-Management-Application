import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotRequestDto } from './dto/bot-request.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('bot')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Post('chat')
  // For V1, any authenticated user can talk to the bot, or we can restrict it using @Permissions
  // In a robust ITAM, we might use @Permissions('bot.use') but since this is a new feature
  // we will leave it open to authenticated admins (JWT Guard handles auth).
  async handleChat(@Body() botRequestDto: BotRequestDto) {
    const response = await this.botService.processCommand(botRequestDto.message);
    return { response };
  }
}
