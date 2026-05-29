import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { InventoryItem } from './inventory-item.entity';

export enum AuditStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Entity('inventory_audits')
export class InventoryAudit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'audit_date',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  auditDate: Date;

  @Column({ name: 'auditor_id' })
  auditorId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'auditor_id' })
  auditor: User;

  @Column({ type: 'enum', enum: AuditStatus, default: AuditStatus.IN_PROGRESS })
  status: AuditStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => InventoryAuditDetail, (detail) => detail.audit, {
    cascade: true,
  })
  details: InventoryAuditDetail[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('inventory_audit_details')
export class InventoryAuditDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'audit_id' })
  auditId: number;

  @ManyToOne(() => InventoryAudit, (audit) => audit.details, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'audit_id' })
  audit: InventoryAudit;

  @Column({ name: 'item_id' })
  itemId: number;

  @ManyToOne(() => InventoryItem)
  @JoinColumn({ name: 'item_id' })
  item: InventoryItem;

  @Column({ name: 'system_quantity' })
  systemQuantity: number;

  @Column({ name: 'physical_quantity' })
  physicalQuantity: number;

  @Column()
  variance: number;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
