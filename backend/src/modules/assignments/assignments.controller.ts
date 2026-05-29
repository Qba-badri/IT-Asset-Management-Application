import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AssignmentsService } from './assignments.service';
import {
  IssueDto,
  ReturnDto,
  TransferDto,
  WriteOffDto,
  HoldingsQueryDto,
  OverdueQueryDto,
} from './dto/assignment.dto';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  /**
   * POST /api/issue
   * Handles issuance for all ReturnPolicy + TrackMode combinations.
   */
  @Post('issue')
  @HttpCode(HttpStatus.CREATED)
  issue(@Body() dto: IssueDto, @Request() req: any) {
    return this.assignmentsService.issue(dto, req.user.id);
  }

  /**
   * POST /api/return
   * Handles full and partial returns with condition tracking.
   */
  @Post('return')
  processReturn(@Body() dto: ReturnDto, @Request() req: any) {
    return this.assignmentsService.processReturn(dto, req.user.id);
  }

  /**
   * POST /api/transfer
   * Employee ↔ Employee or Location ↔ Location.
   */
  @Post('transfer')
  transfer(@Body() dto: TransferDto, @Request() req: any) {
    return this.assignmentsService.transfer(dto, req.user.id);
  }

  /**
   * POST /api/write-off
   * Write off lost/damaged items.
   */
  @Post('write-off')
  writeOff(@Body() dto: WriteOffDto, @Request() req: any) {
    return this.assignmentsService.writeOff(dto, req.user.id);
  }

  /**
   * GET /api/holdings
   * Who has what now — active assignments.
   */
  @Get('holdings')
  getHoldings(@Query() query: HoldingsQueryDto) {
    return this.assignmentsService.getHoldings(query);
  }

  /**
   * GET /api/overdue
   * Items past their due date.
   */
  @Get('overdue')
  getOverdue(@Query() query: OverdueQueryDto) {
    return this.assignmentsService.getOverdue(query);
  }

  /**
   * GET /api/assignments/:id
   * Full assignment detail with return history.
   */
  @Get('assignments/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.assignmentsService.findOne(id);
  }
}
