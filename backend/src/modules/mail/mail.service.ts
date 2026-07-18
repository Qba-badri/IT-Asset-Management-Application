import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { IntegrationSettingsService } from '../settings/integration-settings.service';
import { NotificationTemplateService, TemplateKey } from './notification-template.service';

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string | null;
  password: string | null;
  from: string;
}

/**
 * Thin wrapper around nodemailer driven by the SMTP_* settings, resolved via
 * IntegrationSettingsService (DB value first, environment variable as
 * fallback) on every send so admin-configured changes take effect
 * immediately, without a server restart.
 * Injected as a class so tests can replace it with a mock.
 *
 * SECURITY: never log message bodies — they contain OTPs.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly integrationSettingsService: IntegrationSettingsService,
    private readonly templateService: NotificationTemplateService,
  ) {}

  private async getConfig(): Promise<SmtpConfig | null> {
    const host = await this.integrationSettingsService.get('SMTP_HOST');
    if (!host) {
      return null;
    }
    const port = await this.integrationSettingsService.get('SMTP_PORT');
    const secure = await this.integrationSettingsService.get('SMTP_SECURE');
    const user = await this.integrationSettingsService.get('SMTP_USER');
    const password = await this.integrationSettingsService.get('SMTP_PASSWORD');
    const from = await this.integrationSettingsService.get('EMAIL_FROM');

    return {
      host,
      port: parseInt(port || '587', 10),
      secure: secure === 'true',
      user,
      password,
      from: from || 'no-reply@itam.local',
    };
  }

  private async getTransporter(): Promise<{
    transporter: nodemailer.Transporter;
    config: SmtpConfig;
  } | null> {
    const config = await this.getConfig();
    if (!config) {
      return null;
    }
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user
        ? {
            user: config.user,
            pass: config.password,
          }
        : undefined,
    });
    return { transporter, config };
  }

  async isEnabled(): Promise<boolean> {
    return (await this.getConfig()) !== null;
  }

  async sendPasswordResetOtp(to: string, otp: string): Promise<void> {
    const resolved = await this.getTransporter();
    if (!resolved) {
      // Do NOT log the OTP itself.
      this.logger.error(
        `Password reset OTP could not be emailed to ${to}: SMTP is not configured.`,
      );
      return;
    }

    await resolved.transporter.sendMail({
      from: resolved.config.from,
      to,
      subject: 'Your password reset code',
      text:
        `Your IT Asset Management password reset code is: ${otp}\n\n` +
        'The code expires in 15 minutes. If you did not request a password ' +
        'reset, you can ignore this email.',
    });
    this.logger.log(`Password reset OTP email sent to ${to}`);
  }

  /**
   * Sends a short confirmation email using the currently-resolved SMTP
   * config. Used by the "Test Connection" action in System Settings. Throws
   * (rather than swallowing) any nodemailer error so the caller can report
   * the failure back to the admin.
   */
  async sendTestEmail(to: string): Promise<void> {
    const resolved = await this.getTransporter();
    if (!resolved) {
      throw new Error('SMTP is not configured.');
    }
    await resolved.transporter.sendMail({
      from: resolved.config.from,
      to,
      subject: 'IT Asset Management — SMTP test',
      text: 'Your SMTP settings are working. This is a test email from IT Asset Management.',
    });
    this.logger.log(`Test email sent to ${to}`);
  }

  /**
   * Minimal inline-styled HTML shell shared by all templated notification
   * emails below. No templating engine is installed/needed — plain string
   * interpolation is sufficient for this small a set of emails.
   */
  private wrapHtml(title: string, bodyHtml: string): string {
    return `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, Helvetica, sans-serif; background-color: #f4f5f7; padding: 24px; margin: 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
      <tr>
        <td style="background-color: #1f2937; padding: 16px 24px;">
          <h2 style="color: #ffffff; margin: 0; font-size: 18px;">${title}</h2>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px; color: #111827; font-size: 14px; line-height: 1.6;">
          ${bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 24px; background-color: #f9fafb; color: #6b7280; font-size: 12px;">
          This is an automated notification from IT Asset Management.
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }

  /** Generic templated send, used by NotificationsService.notify() for ad-hoc content. */
  async sendGeneric(to: string, subject: string, html: string): Promise<void> {
    await this.send(to, subject, html);
  }

  /**
   * Wraps raw body HTML in the shared branded shell and sends it. Used by
   * NotificationTemplateController's "send test" action so it doesn't need
   * to duplicate wrapHtml()/send() logic.
   */
  async sendTemplatedTest(subject: string, bodyHtml: string, to: string): Promise<void> {
    await this.send(to, subject, this.wrapHtml(subject, bodyHtml));
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    const resolved = await this.getTransporter();
    if (!resolved) {
      this.logger.warn(
        `Notification email to ${to} was not sent: SMTP is not configured. Subject: "${subject}"`,
      );
      return;
    }

    await resolved.transporter.sendMail({
      from: resolved.config.from,
      to,
      subject,
      html,
    });
    this.logger.log(`Notification email sent to ${to}: "${subject}"`);
  }

  async sendWarrantyExpiryReminder(
    to: string,
    data: {
      assetTag: string;
      assetName: string;
      warrantyExpiry: string | Date;
      daysRemaining: number;
    },
  ): Promise<void> {
    const { subject, bodyHtml } = await this.templateService.render(TemplateKey.WARRANTY_EXPIRY, {
      assetTag: data.assetTag,
      assetName: data.assetName,
      warrantyExpiry: new Date(data.warrantyExpiry).toLocaleDateString(),
      daysRemaining: data.daysRemaining,
    });
    const html = this.wrapHtml('Asset Warranty Expiry Reminder', bodyHtml);
    await this.send(to, subject, html);
  }

  async sendLicenseExpiryReminder(
    to: string,
    data: {
      licenseName: string;
      expiryDate: string | Date;
      daysRemaining: number;
    },
  ): Promise<void> {
    const { subject, bodyHtml } = await this.templateService.render(TemplateKey.LICENSE_EXPIRY, {
      licenseName: data.licenseName,
      expiryDate: new Date(data.expiryDate).toLocaleDateString(),
      daysRemaining: data.daysRemaining,
    });
    const html = this.wrapHtml('License Expiry Reminder', bodyHtml);
    await this.send(to, subject, html);
  }

  async sendLowStockAlert(
    to: string,
    data: {
      itemName: string;
      currentStock: number;
      minStockLevel: number;
      reorderPoint?: number;
    },
  ): Promise<void> {
    const { subject, bodyHtml } = await this.templateService.render(TemplateKey.LOW_STOCK, {
      itemName: data.itemName,
      currentStock: data.currentStock,
      minStockLevel: data.minStockLevel,
      reorderPoint: data.reorderPoint,
    });
    const html = this.wrapHtml('Low Stock Alert', bodyHtml);
    await this.send(to, subject, html);
  }

  async sendAssignmentEmail(
    to: string,
    data: {
      entityType: string;
      entityName: string;
      action: 'assigned' | 'unassigned';
      performedBy?: string;
    },
  ): Promise<void> {
    const verb = data.action === 'assigned' ? 'Assigned' : 'Unassigned';
    const { subject, bodyHtml } = await this.templateService.render(TemplateKey.ASSIGNMENT, {
      entityType: data.entityType,
      entityName: data.entityName,
      action: data.action,
      verb,
      performedBy: data.performedBy,
    });
    const html = this.wrapHtml(`${data.entityType} ${verb}`, bodyHtml);
    await this.send(to, subject, html);
  }

  async sendStatusChangeEmail(
    to: string,
    data: {
      assetTag: string;
      assetName: string;
      oldStatus: string;
      newStatus: string;
    },
  ): Promise<void> {
    const { subject, bodyHtml } = await this.templateService.render(TemplateKey.STATUS_CHANGE, {
      assetTag: data.assetTag,
      assetName: data.assetName,
      oldStatus: data.oldStatus,
      newStatus: data.newStatus,
    });
    const html = this.wrapHtml('Asset Status Change', bodyHtml);
    await this.send(to, subject, html);
  }
}
