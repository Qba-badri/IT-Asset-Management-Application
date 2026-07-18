import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Admin-configurable integration credentials (Azure AD, QPeople HRMS, ...).
 * Secret values are stored AES-256-GCM encrypted; the API only ever returns
 * a masked preview for secrets.
 */
@Entity('integration_settings')
export class IntegrationSetting {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  key: string;

  // Encrypted payload in the form iv:authTag:ciphertext (hex).
  @Column({ type: 'text', nullable: true })
  value: string;

  @Column({ name: 'is_secret', type: 'boolean', default: false })
  isSecret: boolean;

  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updatedBy: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
