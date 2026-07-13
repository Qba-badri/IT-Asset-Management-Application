import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { AuditEvent } from '../../entities/audit-event.entity';
import { LicenseHistory } from '../../entities/license-history.entity';
import { InventoryTransaction } from '../../entities/inventory-transaction.entity';

export type AuditReportModule = 'Asset' | 'License' | 'Inventory';

export interface AuditReportQueryDto {
  module?: AuditReportModule;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditReportEntry {
  id: string;
  module: AuditReportModule;
  timestamp: Date;
  action: string;
  entityType: string;
  entityId: number | null;
  entityLabel: string;
  actorName: string;
  details: string;
}

const COLUMN_HEADERS = ['Timestamp', 'Module', 'Action', 'Entity', 'Actor', 'Details'];

@Injectable()
export class AuditReportService {
  constructor(
    @InjectRepository(AuditEvent)
    private readonly auditEventRepo: Repository<AuditEvent>,
    @InjectRepository(LicenseHistory)
    private readonly licenseHistoryRepo: Repository<LicenseHistory>,
    @InjectRepository(InventoryTransaction)
    private readonly inventoryTxRepo: Repository<InventoryTransaction>,
  ) {}

  async findAll(
    query: AuditReportQueryDto,
  ): Promise<{ data: AuditReportEntry[]; total: number }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 25, 100);
    const all = await this._fetchAll(query, 5000);
    const total = all.length;
    const start = (page - 1) * limit;
    return { data: all.slice(start, start + limit), total };
  }

  async exportAll(query: AuditReportQueryDto): Promise<AuditReportEntry[]> {
    return this._fetchAll(query, 5000);
  }

  async generatePdf(query: AuditReportQueryDto): Promise<Buffer> {
    const entries = await this.exportAll(query);
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    doc.fontSize(16).text('Audit Report', { align: 'center' });
    doc.moveDown(0.3);
    const filterLine = [
      query.module ? `Module: ${query.module}` : 'Module: All',
      query.startDate ? `From: ${query.startDate}` : null,
      query.endDate ? `To: ${query.endDate}` : null,
      query.search ? `Search: "${query.search}"` : null,
    ]
      .filter(Boolean)
      .join('   |   ');
    doc.fontSize(9).fillColor('gray').text(filterLine || 'No filters applied', { align: 'center' });
    doc.fillColor('black');
    doc.moveDown(1);

    const colWidths = [95, 60, 80, 160, 110, 260];
    const startX = doc.page.margins.left;
    let y = doc.y;

    const drawRow = (values: string[], isHeader = false) => {
      doc.fontSize(isHeader ? 9 : 8).font(isHeader ? 'Helvetica-Bold' : 'Helvetica');
      let x = startX;
      values.forEach((val, i) => {
        doc.text(val, x, y, { width: colWidths[i], ellipsis: true });
        x += colWidths[i];
      });
      y += isHeader ? 18 : 16;
    };

    drawRow(COLUMN_HEADERS, true);
    doc.moveTo(startX, y - 4).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y - 4).stroke();

    for (const e of entries) {
      if (y > doc.page.height - doc.page.margins.bottom - 20) {
        doc.addPage({ margin: 30, size: 'A4', layout: 'landscape' });
        y = doc.y;
        drawRow(COLUMN_HEADERS, true);
      }
      drawRow([
        e.timestamp.toLocaleString(),
        e.module,
        e.action,
        `${e.entityType}${e.entityId ? ' #' + e.entityId : ''} ${e.entityLabel}`.trim(),
        e.actorName,
        e.details,
      ]);
    }

    doc.end();
    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  async generateExcel(query: AuditReportQueryDto): Promise<Buffer> {
    const entries = await this.exportAll(query);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Audit Report');

    sheet.columns = [
      { header: 'Timestamp', key: 'timestamp', width: 22 },
      { header: 'Module', key: 'module', width: 12 },
      { header: 'Action', key: 'action', width: 16 },
      { header: 'Entity Type', key: 'entityType', width: 18 },
      { header: 'Entity ID', key: 'entityId', width: 10 },
      { header: 'Entity', key: 'entityLabel', width: 28 },
      { header: 'Actor', key: 'actorName', width: 22 },
      { header: 'Details', key: 'details', width: 50 },
    ];
    sheet.getRow(1).font = { bold: true };

    entries.forEach((e) => {
      sheet.addRow({
        timestamp: e.timestamp.toLocaleString(),
        module: e.module,
        action: e.action,
        entityType: e.entityType,
        entityId: e.entityId ?? '',
        entityLabel: e.entityLabel,
        actorName: e.actorName,
        details: e.details,
      });
    });

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  // ─── Private helpers ─────────────────────────────────────────────

  private async _fetchAll(
    query: AuditReportQueryDto,
    cap: number,
  ): Promise<AuditReportEntry[]> {
    const wantsModule = (m: AuditReportModule) => !query.module || query.module === m;

    const [assetEntries, licenseEntries, inventoryEntries] = await Promise.all([
      wantsModule('Asset') ? this._fetchAssetEvents(query) : Promise.resolve([]),
      wantsModule('License') ? this._fetchLicenseHistory(query) : Promise.resolve([]),
      wantsModule('Inventory') ? this._fetchInventoryTransactions(query) : Promise.resolve([]),
    ]);

    return [...assetEntries, ...licenseEntries, ...inventoryEntries]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, cap);
  }

  private async _fetchAssetEvents(query: AuditReportQueryDto): Promise<AuditReportEntry[]> {
    const qb = this.auditEventRepo
      .createQueryBuilder('ae')
      .leftJoinAndSelect('ae.actor', 'actor')
      // Exclude login/auth events — they're user account activity, not asset movement
      .where('ae.entityType != :userType', { userType: 'user' })
      .orderBy('ae.createdAt', 'DESC')
      .take(5000);

    if (query.startDate) qb.andWhere('ae.createdAt >= :start', { start: query.startDate });
    if (query.endDate) qb.andWhere('ae.createdAt <= :end', { end: query.endDate });
    if (query.search) {
      qb.andWhere(
        "(LOWER(actor.firstName) LIKE :s OR LOWER(actor.lastName) LIKE :s OR LOWER(ae.entityType) LIKE :s)",
        { s: `%${query.search.toLowerCase()}%` },
      );
    }

    const rows = await qb.getMany();
    return rows.map((r) => ({
      id: `asset-${r.id}`,
      module: 'Asset' as const,
      timestamp: r.createdAt,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId ?? null,
      entityLabel: '',
      actorName: r.actor ? `${r.actor.firstName} ${r.actor.lastName}` : 'System',
      details: r.metadata ? JSON.stringify(r.metadata) : '',
    }));
  }

  private async _fetchLicenseHistory(query: AuditReportQueryDto): Promise<AuditReportEntry[]> {
    const qb = this.licenseHistoryRepo
      .createQueryBuilder('lh')
      .leftJoinAndSelect('lh.performedBy', 'performedBy')
      .leftJoinAndSelect('lh.license', 'license')
      .orderBy('lh.actionDate', 'DESC')
      .take(5000);

    if (query.startDate) qb.andWhere('lh.actionDate >= :start', { start: query.startDate });
    if (query.endDate) qb.andWhere('lh.actionDate <= :end', { end: query.endDate });
    if (query.search) {
      qb.andWhere(
        "(LOWER(performedBy.firstName) LIKE :s OR LOWER(performedBy.lastName) LIKE :s OR LOWER(license.softwareName) LIKE :s)",
        { s: `%${query.search.toLowerCase()}%` },
      );
    }

    const rows = await qb.getMany();
    return rows.map((r) => ({
      id: `license-${r.id}`,
      module: 'License' as const,
      timestamp: r.actionDate,
      action: r.action,
      entityType: 'license',
      entityId: r.licenseId,
      entityLabel: r.license?.softwareName || '',
      actorName: r.performedBy ? `${r.performedBy.firstName} ${r.performedBy.lastName}` : 'System',
      details: r.notes || '',
    }));
  }

  private async _fetchInventoryTransactions(query: AuditReportQueryDto): Promise<AuditReportEntry[]> {
    const qb = this.inventoryTxRepo
      .createQueryBuilder('it')
      .leftJoinAndSelect('it.performedBy', 'performedBy')
      .leftJoinAndSelect('it.item', 'item')
      .orderBy('it.transactionDate', 'DESC')
      .take(5000);

    if (query.startDate) qb.andWhere('it.transactionDate >= :start', { start: query.startDate });
    if (query.endDate) qb.andWhere('it.transactionDate <= :end', { end: query.endDate });
    if (query.search) {
      qb.andWhere(
        "(LOWER(performedBy.firstName) LIKE :s OR LOWER(performedBy.lastName) LIKE :s OR LOWER(item.name) LIKE :s)",
        { s: `%${query.search.toLowerCase()}%` },
      );
    }

    const rows = await qb.getMany();
    return rows.map((r) => ({
      id: `inventory-${r.id}`,
      module: 'Inventory' as const,
      timestamp: r.transactionDate,
      action: r.type,
      entityType: 'inventory_item',
      entityId: r.itemId,
      entityLabel: r.item?.name || '',
      actorName: r.performedBy ? `${r.performedBy.firstName} ${r.performedBy.lastName}` : 'System',
      details: `Qty: ${r.quantity}${r.notes ? ' — ' + r.notes : ''}`,
    }));
  }
}
