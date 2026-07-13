import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { AuditEvent, AuditAction } from '../../entities/audit-event.entity';
import { LicenseHistory } from '../../entities/license-history.entity';
import { InventoryTransaction } from '../../entities/inventory-transaction.entity';
import { Asset } from '../../entities/asset.entity';
import { InventoryAssignment } from '../../entities/inventory-assignment.entity';
import { InventoryReturn } from '../../entities/inventory-return.entity';

export type AuditReportModule = 'Asset' | 'License' | 'Inventory';

export interface AuditReportQueryDto {
  module?: AuditReportModule;
  action?: string;
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
  /** Human-readable name of the entity, e.g. "MacBook Pro 14" */
  entityName: string;
  /** Short code/tag of the entity, e.g. "LAP-003" */
  entityCode: string;
  /** Name of the person who received/returned the item, if applicable */
  personName: string;
  /** Email of that person, if applicable */
  personEmail: string;
  actorName: string;
  actorEmail: string;
  reason: string;
  details: string;
}

export interface AuditReportStats {
  total: number;
  asset: number;
  license: number;
  inventory: number;
}

const COLUMN_HEADERS = ['Timestamp', 'Module', 'Action', 'Entity', 'Received/Returned By', 'Actor', 'Reason', 'Details'];

@Injectable()
export class AuditReportService {
  constructor(
    @InjectRepository(AuditEvent)
    private readonly auditEventRepo: Repository<AuditEvent>,
    @InjectRepository(LicenseHistory)
    private readonly licenseHistoryRepo: Repository<LicenseHistory>,
    @InjectRepository(InventoryTransaction)
    private readonly inventoryTxRepo: Repository<InventoryTransaction>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(InventoryAssignment)
    private readonly inventoryAssignmentRepo: Repository<InventoryAssignment>,
    @InjectRepository(InventoryReturn)
    private readonly inventoryReturnRepo: Repository<InventoryReturn>,
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

  async getStats(query: AuditReportQueryDto): Promise<AuditReportStats> {
    const { module, ...dateOnly } = query;
    const [assetEntries, licenseEntries, inventoryEntries] = await Promise.all([
      this._fetchAssetEvents(dateOnly),
      this._fetchLicenseHistory(dateOnly),
      this._fetchInventoryTransactions(dateOnly),
    ]);
    return {
      total: assetEntries.length + licenseEntries.length + inventoryEntries.length,
      asset: assetEntries.length,
      license: licenseEntries.length,
      inventory: inventoryEntries.length,
    };
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

    const colWidths = [90, 55, 70, 135, 100, 90, 110, 155];
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
        `${e.entityName}${e.entityCode ? ' (' + e.entityCode + ')' : ''}`.trim(),
        e.personName || '—',
        e.actorName,
        e.reason,
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
      { header: 'Entity Name', key: 'entityName', width: 24 },
      { header: 'Entity Code', key: 'entityCode', width: 14 },
      { header: 'Received/Returned By', key: 'personName', width: 22 },
      { header: 'Actor', key: 'actorName', width: 22 },
      { header: 'Reason', key: 'reason', width: 28 },
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
        entityName: e.entityName,
        entityCode: e.entityCode,
        personName: e.personName,
        actorName: e.actorName,
        reason: e.reason,
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

    let combined = [...assetEntries, ...licenseEntries, ...inventoryEntries];
    if (query.action) {
      const wanted = query.action.toLowerCase();
      combined = combined.filter((e) => e.action.toLowerCase() === wanted);
    }
    if (query.search) {
      const s = query.search.toLowerCase();
      combined = combined.filter((e) =>
        [e.actorName, e.actorEmail, e.personName, e.entityName, e.entityCode, e.reason, e.details]
          .some((field) => field?.toLowerCase().includes(s)),
      );
    }

    return combined
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

    const rows = await qb.getMany();

    // Metadata is a point-in-time snapshot — for entityType 'asset' rows, resolve
    // name/tag live from the Asset table so renames/legacy events stay accurate.
    const assetIds = [...new Set(rows.filter((r) => r.entityType === 'asset' && r.entityId).map((r) => r.entityId))];
    const assets = assetIds.length
      ? await this.assetRepo.find({ where: { id: In(assetIds) }, withDeleted: true })
      : [];
    const assetById = new Map(assets.map((a) => [a.id, a]));

    return rows.map((r) => {
      const m = r.metadata || {};
      const personName = m.assignedToName || m.returnedByName || '';
      const personEmail = m.assignedToEmail || m.returnedByEmail || '';
      const liveAsset = r.entityType === 'asset' && r.entityId ? assetById.get(r.entityId) : undefined;
      return {
        id: `asset-${r.id}`,
        module: 'Asset' as const,
        timestamp: r.createdAt,
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId ?? null,
        entityName: liveAsset?.name || m.assetName || m.catalogItemName || '',
        entityCode: liveAsset?.assetTag || m.assetTag || m.catalogItemSku || '',
        personName,
        personEmail,
        actorName: r.actor ? `${r.actor.firstName} ${r.actor.lastName}` : 'System',
        actorEmail: r.actor?.email || '',
        reason: m.reason || '',
        details: this._formatAssetDetails(r.action, r.entityType, m),
      };
    });
  }

  private _formatAssetDetails(
    action: AuditAction,
    entityType: string,
    metadata: Record<string, any>,
  ): string {
    if (!metadata) return '';
    const m = metadata;

    switch (action) {
      case AuditAction.ISSUE:
        if (entityType === 'asset') {
          return `Deployed to ${m.targetType}${m.location ? ': ' + m.location : ''}`;
        }
        return `Issued ${m.quantity ? m.quantity + ' x ' : ''}${m.catalogItemName || m.catalogItemSku || 'item'} to user #${m.assigneeId}${m.dueDate ? ', due ' + new Date(m.dueDate).toLocaleDateString() : ''}`;

      case AuditAction.RETURN:
      case AuditAction.PARTIAL_RETURN:
        if (entityType === 'asset') {
          return 'Returned to inventory';
        }
        return `Returned ${m.returnedQuantity ?? ''}${m.totalIssued ? ' of ' + m.totalIssued : ''}${m.condition ? ' (condition: ' + m.condition + ')' : ''}`;

      case AuditAction.TRANSFER: {
        const parts: string[] = [];
        if (m.fromAssigneeId || m.toAssigneeId) parts.push(`user #${m.fromAssigneeId ?? '?'} → user #${m.toAssigneeId ?? '?'}`);
        if (m.fromLocationId || m.toLocationId) parts.push(`location #${m.fromLocationId ?? '?'} → location #${m.toLocationId ?? '?'}`);
        return `Transferred${parts.length ? ': ' + parts.join(', ') : ''}`;
      }

      case AuditAction.WRITE_OFF:
        return 'Written off';

      case AuditAction.DISPOSE:
        return 'Disposed';

      default:
        return JSON.stringify(m);
    }
  }

  private async _fetchLicenseHistory(query: AuditReportQueryDto): Promise<AuditReportEntry[]> {
    const qb = this.licenseHistoryRepo
      .createQueryBuilder('lh')
      .leftJoinAndSelect('lh.performedBy', 'performedBy')
      .leftJoinAndSelect('lh.license', 'license')
      .leftJoinAndSelect('lh.assignedTo', 'assignedTo')
      // Keep resolving names for soft-deleted licenses — their audit history must stay readable
      .withDeleted()
      .orderBy('lh.actionDate', 'DESC')
      .take(5000);

    if (query.startDate) qb.andWhere('lh.actionDate >= :start', { start: query.startDate });
    if (query.endDate) qb.andWhere('lh.actionDate <= :end', { end: query.endDate });

    const rows = await qb.getMany();
    return rows.map((r) => ({
      id: `license-${r.id}`,
      module: 'License' as const,
      timestamp: r.actionDate,
      action: r.action,
      entityType: 'license',
      entityId: r.licenseId,
      entityName: r.license?.planName || r.license?.softwareName || '',
      entityCode: r.licenseId ? `LIC-${r.licenseId}` : '',
      personName: r.assignedTo ? `${r.assignedTo.firstName} ${r.assignedTo.lastName}` : '',
      personEmail: r.assignedTo?.email || '',
      actorName: r.performedBy ? `${r.performedBy.firstName} ${r.performedBy.lastName}` : 'System',
      actorEmail: r.performedBy?.email || '',
      reason: r.notes || '',
      details: '',
    }));
  }

  private async _fetchInventoryTransactions(query: AuditReportQueryDto): Promise<AuditReportEntry[]> {
    const qb = this.inventoryTxRepo
      .createQueryBuilder('it')
      .leftJoinAndSelect('it.performedBy', 'performedBy')
      .leftJoinAndSelect('it.item', 'item')
      // Keep resolving names for soft-deleted items — their audit history must stay readable
      .withDeleted()
      .orderBy('it.transactionDate', 'DESC')
      .take(5000);

    if (query.startDate) qb.andWhere('it.transactionDate >= :start', { start: query.startDate });
    if (query.endDate) qb.andWhere('it.transactionDate <= :end', { end: query.endDate });

    const rows = await qb.getMany();

    // Transactions of type OUT (issued to someone) reference an InventoryAssignment;
    // RETURN transactions reference an InventoryReturn, which points back at that
    // assignment. Resolve both so we can show who received/returned the item.
    const assignmentIds = [...new Set(
      rows.filter((r) => r.referenceType === 'assignment' && r.referenceId).map((r) => r.referenceId),
    )];
    const returnIds = [...new Set(
      rows.filter((r) => r.referenceType === 'return' && r.referenceId).map((r) => r.referenceId),
    )];

    const [assignments, returns] = await Promise.all([
      assignmentIds.length
        ? this.inventoryAssignmentRepo.find({ where: { id: In(assignmentIds) }, relations: ['user'], withDeleted: true })
        : Promise.resolve([]),
      returnIds.length
        ? this.inventoryReturnRepo.find({ where: { id: In(returnIds) }, relations: ['assignment', 'assignment.user'], withDeleted: true })
        : Promise.resolve([]),
    ]);

    const assignmentById = new Map(assignments.map((a) => [a.id, a]));
    const returnById = new Map(returns.map((rt) => [rt.id, rt]));

    return rows.map((r) => {
      let person: { firstName: string; lastName: string; email: string } | undefined;
      if (r.referenceType === 'assignment' && r.referenceId) {
        person = assignmentById.get(r.referenceId)?.user;
      } else if (r.referenceType === 'return' && r.referenceId) {
        person = returnById.get(r.referenceId)?.assignment?.user;
      }

      return {
        id: `inventory-${r.id}`,
        module: 'Inventory' as const,
        timestamp: r.transactionDate,
        action: r.type,
        entityType: 'inventory_item',
        entityId: r.itemId,
        entityName: r.item?.name || '',
        entityCode: r.itemId ? `INV-${r.itemId}` : '',
        personName: person ? `${person.firstName} ${person.lastName}` : '',
        personEmail: person?.email || '',
        actorName: r.performedBy ? `${r.performedBy.firstName} ${r.performedBy.lastName}` : 'System',
        actorEmail: r.performedBy?.email || '',
        reason: r.notes || '',
        details: `Qty: ${r.quantity}`,
      };
    });
  }
}
