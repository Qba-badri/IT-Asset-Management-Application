import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrenciesService } from './currencies.service';
import {
  CreateCurrencyRateDto,
  UpdateCurrencyRateDto,
} from './dto/currency-rate.dto';

@Controller('api/currencies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  // Reads stay JWT-only: the active list feeds the navbar currency switcher
  @Get()
  findActive() {
    return this.currenciesService.findActive();
  }

  @Get('all')
  @Permissions('settings.manage')
  findAll() {
    return this.currenciesService.findAll();
  }

  @Post()
  @Permissions('settings.manage')
  create(@Body() data: CreateCurrencyRateDto) {
    return this.currenciesService.create(data);
  }

  @Put(':id')
  @Permissions('settings.manage')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCurrencyRateDto,
  ) {
    return this.currenciesService.update(id, data);
  }
}
