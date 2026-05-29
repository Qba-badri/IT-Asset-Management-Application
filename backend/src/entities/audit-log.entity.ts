import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
@Index(['userId'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'integer', nullable: true })
  userId: number;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 50, nullable: true })
  entityType: string;

  @Column({ name: 'entity_id', type: 'integer', nullable: true })
  entityId: number;

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues: any;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues: any;

  @Column({ name: 'ip_address', type: 'varchar', length: 50, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
