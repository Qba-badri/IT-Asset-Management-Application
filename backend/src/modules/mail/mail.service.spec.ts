import { Test } from '@nestjs/testing';
import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';
import { IntegrationSettingsService } from '../settings/integration-settings.service';
import { NotificationTemplateService, TemplateKey } from './notification-template.service';

jest.mock('nodemailer');

describe('MailService — new notification templates', () => {
  const configValues: Record<string, string> = {};
  const integrationSettingsService = {
    get: jest.fn(async (key: string) => configValues[key] ?? null),
  };
  const templateService = {
    render: jest.fn(async (key: TemplateKey, data: Record<string, any>) => {
      const def = (NotificationTemplateService as any).DEFAULT_TEMPLATES[key];
      const interpolate = (tpl: string) =>
        tpl.replace(/\{\{(\w+)\}\}/g, (_: string, token: string) =>
          data[token] !== undefined && data[token] !== null ? String(data[token]) : '',
        );
      return { subject: interpolate(def.subject), bodyHtml: interpolate(def.bodyHtml) };
    }),
  };

  const buildService = async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: IntegrationSettingsService, useValue: integrationSettingsService },
        { provide: NotificationTemplateService, useValue: templateService },
      ],
    }).compile();
    return moduleRef.get(MailService);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(configValues).forEach((k) => delete configValues[k]);
  });

  describe('when SMTP_HOST is unset (transporter disabled)', () => {
    it('sendWarrantyExpiryReminder no-ops without throwing', async () => {
      const service = await buildService();
      await expect(
        service.sendWarrantyExpiryReminder('user@example.com', {
          assetTag: 'AST-1',
          assetName: 'Laptop',
          warrantyExpiry: new Date(),
          daysRemaining: 7,
        }),
      ).resolves.toBeUndefined();
    });

    it('sendLicenseExpiryReminder no-ops without throwing', async () => {
      const service = await buildService();
      await expect(
        service.sendLicenseExpiryReminder('user@example.com', {
          licenseName: 'Office 365',
          expiryDate: new Date(),
          daysRemaining: 15,
        }),
      ).resolves.toBeUndefined();
    });

    it('sendLowStockAlert no-ops without throwing', async () => {
      const service = await buildService();
      await expect(
        service.sendLowStockAlert('user@example.com', {
          itemName: 'USB Cable',
          currentStock: 2,
          minStockLevel: 5,
        }),
      ).resolves.toBeUndefined();
    });

    it('sendAssignmentEmail no-ops without throwing', async () => {
      const service = await buildService();
      await expect(
        service.sendAssignmentEmail('user@example.com', {
          entityType: 'asset',
          entityName: 'Laptop-001',
          action: 'assigned',
        }),
      ).resolves.toBeUndefined();
    });

    it('sendStatusChangeEmail no-ops without throwing', async () => {
      const service = await buildService();
      await expect(
        service.sendStatusChangeEmail('user@example.com', {
          assetTag: 'AST-1',
          assetName: 'Laptop',
          oldStatus: 'AVAILABLE',
          newStatus: 'REPAIR',
        }),
      ).resolves.toBeUndefined();
    });

    it('sendPasswordResetOtp remains unchanged and still no-ops safely', async () => {
      const service = await buildService();
      await expect(service.sendPasswordResetOtp('user@example.com', '123456')).resolves.toBeUndefined();
    });

    it('sendTestEmail throws when SMTP is not configured', async () => {
      const service = await buildService();
      await expect(service.sendTestEmail('user@example.com')).rejects.toThrow();
    });

    it('isEnabled resolves to false', async () => {
      const service = await buildService();
      await expect(service.isEnabled()).resolves.toBe(false);
    });
  });

  describe('when SMTP is configured', () => {
    const sendMail = jest.fn().mockResolvedValue(undefined);

    beforeEach(() => {
      configValues['SMTP_HOST'] = 'smtp.example.com';
      (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
      sendMail.mockClear();
    });

    it('calls transporter.sendMail with the expected subject/html for a warranty reminder', async () => {
      const service = await buildService();
      await service.sendWarrantyExpiryReminder('user@example.com', {
        assetTag: 'AST-1',
        assetName: 'Laptop',
        warrantyExpiry: new Date('2026-08-01'),
        daysRemaining: 7,
      });

      expect(sendMail).toHaveBeenCalledTimes(1);
      const call = sendMail.mock.calls[0][0];
      expect(call.to).toBe('user@example.com');
      expect(call.subject).toContain('AST-1');
      expect(call.html).toContain('AST-1');
      expect(call.html).toContain('Laptop');
    });

    it('calls transporter.sendMail for a low-stock alert', async () => {
      const service = await buildService();
      await service.sendLowStockAlert('ops@example.com', {
        itemName: 'USB Cable',
        currentStock: 2,
        minStockLevel: 5,
      });

      expect(sendMail).toHaveBeenCalledTimes(1);
      const call = sendMail.mock.calls[0][0];
      expect(call.subject).toContain('USB Cable');
      expect(call.html).toContain('USB Cable');
    });

    it('does not affect sendPasswordResetOtp behavior', async () => {
      const service = await buildService();
      await service.sendPasswordResetOtp('user@example.com', '654321');

      expect(sendMail).toHaveBeenCalledTimes(1);
      const call = sendMail.mock.calls[0][0];
      expect(call.subject).toBe('Your password reset code');
      expect(call.text).toContain('654321');
      expect(call.html).toBeUndefined();
    });

    it('sendTestEmail sends a confirmation email', async () => {
      const service = await buildService();
      await service.sendTestEmail('admin@example.com');

      expect(sendMail).toHaveBeenCalledTimes(1);
      const call = sendMail.mock.calls[0][0];
      expect(call.to).toBe('admin@example.com');
      expect(call.subject).toContain('SMTP test');
    });

    it('isEnabled resolves to true', async () => {
      const service = await buildService();
      await expect(service.isEnabled()).resolves.toBe(true);
    });
  });
});
