import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplate } from '../../entities/notification-template.entity';

export enum TemplateKey {
  WARRANTY_EXPIRY = 'WARRANTY_EXPIRY',
  LICENSE_EXPIRY = 'LICENSE_EXPIRY',
  LOW_STOCK = 'LOW_STOCK',
  ASSIGNMENT = 'ASSIGNMENT',
  STATUS_CHANGE = 'STATUS_CHANGE',
}

export interface TemplateDefault {
  label: string;
  subject: string;
  bodyHtml: string;
  placeholders: string[];
}

export interface TemplateListEntry {
  key: TemplateKey;
  label: string;
  subject: string;
  bodyHtml: string;
  placeholders: string[];
  isCustomized: boolean;
  updatedAt: Date | null;
}

/**
 * Default (fallback) subject + body content for each notification email,
 * moved verbatim from the previous hardcoded strings in MailService's
 * send* methods. These are what "Reset to Default" reverts to, and what's
 * used whenever no admin-edited row exists in `notification_templates`.
 */
const DEFAULT_TEMPLATES: Record<TemplateKey, TemplateDefault> = {
  [TemplateKey.WARRANTY_EXPIRY]: {
    label: 'Asset Warranty Expiry Reminder',
    subject: 'Warranty expiring in {{daysRemaining}} day(s): {{assetTag}}',
    bodyHtml: `<p>The warranty for the following asset is expiring soon:</p>
       <ul>
         <li><strong>Asset Tag:</strong> {{assetTag}}</li>
         <li><strong>Asset Name:</strong> {{assetName}}</li>
         <li><strong>Warranty Expiry:</strong> {{warrantyExpiry}}</li>
         <li><strong>Days Remaining:</strong> {{daysRemaining}}</li>
       </ul>
       <p>Please arrange renewal or replacement before the warranty lapses.</p>`,
    placeholders: ['assetTag', 'assetName', 'warrantyExpiry', 'daysRemaining'],
  },
  [TemplateKey.LICENSE_EXPIRY]: {
    label: 'License Expiry Reminder',
    subject: 'License expiring in {{daysRemaining}} day(s): {{licenseName}}',
    bodyHtml: `<p>The following software license is expiring soon:</p>
       <ul>
         <li><strong>License:</strong> {{licenseName}}</li>
         <li><strong>Expiry Date:</strong> {{expiryDate}}</li>
         <li><strong>Days Remaining:</strong> {{daysRemaining}}</li>
       </ul>
       <p>Please renew this license before it expires to avoid service disruption.</p>`,
    placeholders: ['licenseName', 'expiryDate', 'daysRemaining'],
  },
  [TemplateKey.LOW_STOCK]: {
    label: 'Low Stock Alert',
    subject: 'Low stock alert: {{itemName}}',
    bodyHtml: `<p>The following inventory item has fallen below its minimum stock level:</p>
       <ul>
         <li><strong>Item:</strong> {{itemName}}</li>
         <li><strong>Current Stock:</strong> {{currentStock}}</li>
         <li><strong>Minimum Stock Level:</strong> {{minStockLevel}}</li>
         <li><strong>Reorder Point:</strong> {{reorderPoint}}</li>
       </ul>
       <p>Please arrange a restock.</p>`,
    placeholders: ['itemName', 'currentStock', 'minStockLevel', 'reorderPoint'],
  },
  [TemplateKey.ASSIGNMENT]: {
    label: 'Assignment / Unassignment Notice',
    subject: '{{verb}}: {{entityName}}',
    bodyHtml: `<p>The following {{entityType}} was <strong>{{action}}</strong>:</p>
       <ul>
         <li><strong>Item:</strong> {{entityName}}</li>
         <li><strong>Performed By:</strong> {{performedBy}}</li>
       </ul>`,
    placeholders: ['entityType', 'entityName', 'action', 'verb', 'performedBy'],
  },
  [TemplateKey.STATUS_CHANGE]: {
    label: 'Asset Status Change',
    subject: 'Status changed: {{assetTag}} is now {{newStatus}}',
    bodyHtml: `<p>The status of the following asset has changed:</p>
       <ul>
         <li><strong>Asset Tag:</strong> {{assetTag}}</li>
         <li><strong>Asset Name:</strong> {{assetName}}</li>
         <li><strong>Previous Status:</strong> {{oldStatus}}</li>
         <li><strong>New Status:</strong> {{newStatus}}</li>
       </ul>`,
    placeholders: ['assetTag', 'assetName', 'oldStatus', 'newStatus'],
  },
};

function interpolate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, token) =>
    data[token] !== undefined && data[token] !== null ? String(data[token]) : '',
  );
}

@Injectable()
export class NotificationTemplateService {
  static readonly DEFAULT_TEMPLATES = DEFAULT_TEMPLATES;

  constructor(
    @InjectRepository(NotificationTemplate)
    private readonly templateRepo: Repository<NotificationTemplate>,
  ) {}

  /**
   * Renders the subject + raw (unwrapped) body HTML for `key`, substituting
   * `{{token}}` placeholders with `data`. Falls back to DEFAULT_TEMPLATES
   * when no admin override row exists. Caller (MailService) is responsible
   * for wrapping the returned bodyHtml in the shared branded shell.
   */
  async render(
    key: TemplateKey,
    data: Record<string, any>,
  ): Promise<{ subject: string; bodyHtml: string }> {
    const row = await this.templateRepo.findOne({ where: { key } });
    const source = row
      ? { subject: row.subject, bodyHtml: row.bodyHtml }
      : { subject: DEFAULT_TEMPLATES[key].subject, bodyHtml: DEFAULT_TEMPLATES[key].bodyHtml };

    return {
      subject: interpolate(source.subject, data),
      bodyHtml: interpolate(source.bodyHtml, data),
    };
  }

  async list(): Promise<TemplateListEntry[]> {
    const rows = await this.templateRepo.find();
    const byKey = new Map(rows.map((r) => [r.key, r]));

    return (Object.keys(DEFAULT_TEMPLATES) as TemplateKey[]).map((key) => {
      const row = byKey.get(key);
      const def = DEFAULT_TEMPLATES[key];
      return {
        key,
        label: def.label,
        subject: row ? row.subject : def.subject,
        bodyHtml: row ? row.bodyHtml : def.bodyHtml,
        placeholders: def.placeholders,
        isCustomized: !!row,
        updatedAt: row ? row.updatedAt : null,
      };
    });
  }

  async update(
    key: TemplateKey,
    dto: { subject: string; bodyHtml: string },
    updatedBy: number | null,
  ): Promise<TemplateListEntry> {
    let row = await this.templateRepo.findOne({ where: { key } });
    if (!row) {
      row = this.templateRepo.create({ key });
    }
    row.subject = dto.subject;
    row.bodyHtml = dto.bodyHtml;
    row.updatedBy = updatedBy;
    await this.templateRepo.save(row);

    const def = DEFAULT_TEMPLATES[key];
    return {
      key,
      label: def.label,
      subject: row.subject,
      bodyHtml: row.bodyHtml,
      placeholders: def.placeholders,
      isCustomized: true,
      updatedAt: row.updatedAt,
    };
  }

  async resetToDefault(key: TemplateKey): Promise<TemplateListEntry> {
    const row = await this.templateRepo.findOne({ where: { key } });
    if (row) {
      await this.templateRepo.remove(row);
    }
    const def = DEFAULT_TEMPLATES[key];
    return {
      key,
      label: def.label,
      subject: def.subject,
      bodyHtml: def.bodyHtml,
      placeholders: def.placeholders,
      isCustomized: false,
      updatedAt: null,
    };
  }
}
