import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';
import { IntegrationSetting } from '../../entities/integration-setting.entity';

export interface IntegrationKeyDef {
  key: string;
  isSecret: boolean;
  integration: 'azure' | 'qpeople' | 'smtp';
  label: string;
}

// The only keys this store accepts. Secrets are returned masked; all values
// are encrypted at rest.
export const INTEGRATION_KEYS: IntegrationKeyDef[] = [
  { key: 'AZURE_TENANT_ID', isSecret: false, integration: 'azure', label: 'Tenant ID' },
  { key: 'AZURE_CLIENT_ID', isSecret: false, integration: 'azure', label: 'Client ID' },
  { key: 'AZURE_CLIENT_SECRET', isSecret: true, integration: 'azure', label: 'Client Secret' },
  { key: 'QPEOPLE_API_URL', isSecret: false, integration: 'qpeople', label: 'API URL' },
  { key: 'QPEOPLE_API_TOKEN', isSecret: true, integration: 'qpeople', label: 'API Token' },
  { key: 'SMTP_HOST', isSecret: false, integration: 'smtp', label: 'SMTP Host' },
  { key: 'SMTP_PORT', isSecret: false, integration: 'smtp', label: 'SMTP Port' },
  { key: 'SMTP_SECURE', isSecret: false, integration: 'smtp', label: 'Use SSL/TLS (secure)' },
  { key: 'SMTP_USER', isSecret: false, integration: 'smtp', label: 'SMTP Username' },
  { key: 'SMTP_PASSWORD', isSecret: true, integration: 'smtp', label: 'SMTP Password' },
  { key: 'EMAIL_FROM', isSecret: false, integration: 'smtp', label: 'From Address' },
];

@Injectable()
export class IntegrationSettingsService {
  private readonly encryptionKey: Buffer;

  constructor(
    @InjectRepository(IntegrationSetting)
    private readonly repo: Repository<IntegrationSetting>,
    private readonly configService: ConfigService,
  ) {
    // Prefer a dedicated key; fall back to JWT_SECRET so existing
    // deployments work without new mandatory configuration.
    const keySource =
      this.configService.get<string>('SETTINGS_ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_SECRET');
    this.encryptionKey = createHash('sha256').update(keySource).digest();
  }

  private encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(plain, 'utf8'),
      cipher.final(),
    ]);
    return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
  }

  private decrypt(payload: string): string {
    const [ivHex, tagHex, dataHex] = payload.split(':');
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(ivHex, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ]).toString('utf8');
  }

  private static mask(value: string): string {
    if (!value) return '';
    return `••••${value.slice(-4)}`;
  }

  /**
   * Resolve a setting: DB value (decrypted) first, environment variable as
   * fallback so pre-existing .env-based deployments keep working.
   */
  async get(key: string): Promise<string | null> {
    const row = await this.repo.findOne({ where: { key } });
    if (row?.value) {
      return this.decrypt(row.value);
    }
    return this.configService.get<string>(key) || null;
  }

  /** Masked listing for the admin UI. Never returns secret values. */
  async list() {
    const rows = await this.repo.find();
    const byKey = new Map(rows.map((r) => [r.key, r]));

    return Promise.all(
      INTEGRATION_KEYS.map(async (def) => {
        const row = byKey.get(def.key);
        const dbValue = row?.value ? this.decrypt(row.value) : null;
        const envValue = this.configService.get<string>(def.key) || null;
        const effective = dbValue ?? envValue;
        return {
          key: def.key,
          label: def.label,
          integration: def.integration,
          isSecret: def.isSecret,
          configured: !!effective,
          source: dbValue ? 'database' : envValue ? 'environment' : null,
          value: effective
            ? def.isSecret
              ? IntegrationSettingsService.mask(effective)
              : effective
            : null,
          updatedAt: row?.updatedAt ?? null,
        };
      }),
    );
  }

  /**
   * Upsert a batch of settings. An empty/null value deletes the stored row
   * (falling back to the environment variable, if any).
   */
  async update(entries: Record<string, string | null>, updatedBy: number) {
    const validKeys = new Set(INTEGRATION_KEYS.map((k) => k.key));
    for (const key of Object.keys(entries)) {
      if (!validKeys.has(key)) {
        throw new BadRequestException(`Unknown integration setting: ${key}`);
      }
    }

    for (const [key, value] of Object.entries(entries)) {
      if (value === null || value === undefined || value === '') {
        await this.repo.delete({ key });
        continue;
      }
      const def = INTEGRATION_KEYS.find((k) => k.key === key)!;
      await this.repo.save(
        this.repo.create({
          key,
          value: this.encrypt(value),
          isSecret: def.isSecret,
          updatedBy,
        }),
      );
    }
    return this.list();
  }
}
