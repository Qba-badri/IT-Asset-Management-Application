import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { StockService } from './stock.service';
import {
  AdjustStockDto,
  InitialStockDto,
  StockQueryDto,
  LedgerQueryDto,
} from './dto/stock.dto';

@Controller('api/stock')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('initialize')
  @Permissions('inventory.manage')
  @HttpCode(HttpStatus.CREATED)
  initializeStock(@Body() dto: InitialStockDto, @Request() req: any) {
    return this.stockService.initializeStock(dto, req.user.id);
  }

  @Post('adjust')
  @Permissions('inventory.manage')
  adjustStock(@Body() dto: AdjustStockDto, @Request() req: any) {
    return this.stockService.adjustStock(dto, req.user.id);
  }

  @Get()
  @Permissions('inventory.view')
  findAll(@Query() query: StockQueryDto) {
    return this.stockService.findAll(query);
  }

  @Get('ledger')
  @Permissions('inventory.view')
  getLedger(@Query() query: LedgerQueryDto) {
    return this.stockService.getLedger(query);
  }
}
