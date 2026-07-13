import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuditReportService, AuditReportQueryDto } from './audit-report.service';

@Controller('api/audit-report')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditReportController {
  constructor(private readonly auditReportService: AuditReportService) {}

  @Get()
  @Permissions('reports.view')
  findAll(@Query() query: AuditReportQueryDto) {
    return this.auditReportService.findAll(query);
  }

  @Get('stats')
  @Permissions('reports.view')
  getStats(@Query() query: AuditReportQueryDto) {
    return this.auditReportService.getStats(query);
  }

  @Get('export')
  @Permissions('reports.export')
  async export(
    @Query() query: AuditReportQueryDto & { format?: 'pdf' | 'excel' },
    @Res() res: Response,
  ) {
    const { format, ...filters } = query;
    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'excel') {
      const buffer = await this.auditReportService.generateExcel(filters);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', `attachment; filename="audit-report-${timestamp}.xlsx"`);
      res.send(buffer);
      return;
    }

    const buffer = await this.auditReportService.generatePdf(filters);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="audit-report-${timestamp}.pdf"`);
    res.send(buffer);
  }
}
