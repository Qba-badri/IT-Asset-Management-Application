import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationTemplateService, TemplateKey } from './notification-template.service';
import { NotificationTemplate } from '../../entities/notification-template.entity';

describe('NotificationTemplateService', () => {
  let service: NotificationTemplateService;
  const repo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((partial: any) => partial),
    save: jest.fn(async (entity: any) => ({ ...entity, updatedAt: new Date() })),
    remove: jest.fn(async (entity: any) => entity),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationTemplateService,
        { provide: getRepositoryToken(NotificationTemplate), useValue: repo },
      ],
    }).compile();
    service = moduleRef.get(NotificationTemplateService);
  });

  describe('render', () => {
    it('falls back to DEFAULT_TEMPLATES when no DB row exists', async () => {
      repo.findOne.mockResolvedValue(null);
      const { subject, bodyHtml } = await service.render(TemplateKey.WARRANTY_EXPIRY, {
        assetTag: 'AST-1',
        assetName: 'Laptop',
        warrantyExpiry: '2026-08-01',
        daysRemaining: 7,
      });
      expect(subject).toBe('Warranty expiring in 7 day(s): AST-1');
      expect(bodyHtml).toContain('AST-1');
      expect(bodyHtml).toContain('Laptop');
    });

    it('uses the DB row when present, overriding the default', async () => {
      repo.findOne.mockResolvedValue({
        key: TemplateKey.LOW_STOCK,
        subject: 'Custom subject for {{itemName}}',
        bodyHtml: '<p>Custom body: {{itemName}} at {{currentStock}}</p>',
        updatedBy: 1,
        updatedAt: new Date(),
      });
      const { subject, bodyHtml } = await service.render(TemplateKey.LOW_STOCK, {
        itemName: 'USB Cable',
        currentStock: 2,
        minStockLevel: 5,
      });
      expect(subject).toBe('Custom subject for USB Cable');
      expect(bodyHtml).toBe('<p>Custom body: USB Cable at 2</p>');
    });

    it('substitutes placeholders and blanks out missing tokens', async () => {
      repo.findOne.mockResolvedValue(null);
      const { bodyHtml } = await service.render(TemplateKey.LOW_STOCK, {
        itemName: 'USB Cable',
        currentStock: 2,
        minStockLevel: 5,
        // reorderPoint intentionally omitted
      });
      expect(bodyHtml).toContain('USB Cable');
      expect(bodyHtml).not.toContain('{{reorderPoint}}');
    });
  });

  describe('resetToDefault', () => {
    it('deletes the DB row if present', async () => {
      const existing = { key: TemplateKey.ASSIGNMENT };
      repo.findOne.mockResolvedValue(existing);
      const result = await service.resetToDefault(TemplateKey.ASSIGNMENT);
      expect(repo.remove).toHaveBeenCalledWith(existing);
      expect(result.isCustomized).toBe(false);
    });

    it('is a no-op when no row exists', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.resetToDefault(TemplateKey.ASSIGNMENT);
      expect(repo.remove).not.toHaveBeenCalled();
      expect(result.isCustomized).toBe(false);
    });
  });

  describe('list', () => {
    it('returns all 5 keys, marking DB-backed ones as customized', async () => {
      repo.find.mockResolvedValue([
        { key: TemplateKey.STATUS_CHANGE, subject: 'Custom', bodyHtml: '<p>x</p>', updatedAt: new Date() },
      ]);
      const result = await service.list();
      expect(result).toHaveLength(5);
      const statusChange = result.find((r) => r.key === TemplateKey.STATUS_CHANGE);
      expect(statusChange?.isCustomized).toBe(true);
      const warranty = result.find((r) => r.key === TemplateKey.WARRANTY_EXPIRY);
      expect(warranty?.isCustomized).toBe(false);
    });
  });
});
