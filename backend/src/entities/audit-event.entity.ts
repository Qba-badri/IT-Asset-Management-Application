import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

/**
 * Business action types recorded in audit events.
 */
export enum AuditAction {
  ISSUE = 'issue',
  RETURN = 'return',
  PARTIAL_RETURN = 'partial_return',
  TRANSFER = 'transfer',
  REPAIR_START = 'repair_start',
  REPAIR_END = 'repair_end',
  LOST = 'lost',
  WRITE_OFF = 'write_off',
  ADJUST = 'adjust',
  DISPOSE = 'dispose',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  APPROVAL = 'approval',
  REJECTION = 'rejection',
}

/**
 * AuditEvent is an APPEND-ONLY event log for all business actions.
 * Every mutation in the system MUST write an AuditEvent entry.
 *
 * IMMUTABLE: No UPDATE or DELETE operations should ever be performed.
 *
 * metadata (JSONB) stores action-specific context:
 * - Issue: { assignmentId, catalogItemId, assigneeId, quantity, dueDate }
 * - Return: { returnTransactionId, assignmentId, quantity, condition }
 * - Transfer: { fromUserId, toUserId, fromLocationId, toLocationId }
 * - WriteOff: { reason, approvedById, assetUnitId }
 * - Adjust: { catalogItemId, locationId, oldQty, newQty, reason }
 */
@Entity('audit_events')
@Index(['action'])
@Index(['entityType', 'entityId'])
@Index(['actorId'])
@Index(['createdAt'])
@Index(['entityType', 'createdAt'])
export class AuditEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  /**
   * The type of entity this event relates to.
   * Examples: 'assignment', 'asset_unit', 'catalog_item', 'stock', 'user'
   */
  @Column({ length: 50 })
  entityType: string;

  /**
   * The ID of the entity this event relates to.
   */
  @Column({ nullable: true })
  entityId: number;

  /**
   * The user who performed the action.
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'actorId' })
  actor: User;

  @Column({ nullable: true })
  actorId: number;

  /**
   * JSON metadata with action-specific context.
   */
  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @Column({ length: 50, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;

  // NOTE: No @UpdateDateColumn — audit events are immutable
}
