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
import { StockService } from './stock.service';
import {
  AdjustStockDto,
  InitialStockDto,
  StockQueryDto,
  LedgerQueryDto,
} from './dto/stock.dto';

@Controller('api/stock')
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('initialize')
  @HttpCode(HttpStatus.CREATED)
  initializeStock(@Body() dto: InitialStockDto, @Request() req: any) {
    return this.stockService.initializeStock(dto, req.user.id);
  }

  @Post('adjust')
  adjustStock(@Body() dto: AdjustStockDto, @Request() req: any) {
    // TODO: Add Admin-only guard
    return this.stockService.adjustStock(dto, req.user.id);
  }

  @Get()
  findAll(@Query() query: StockQueryDto) {
    return this.stockService.findAll(query);
  }

  @Get('ledger')
  getLedger(@Query() query: LedgerQueryDto) {
    return this.stockService.getLedger(query);
  }
}
