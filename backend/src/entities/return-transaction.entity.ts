import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
  Check,
} from 'typeorm';
import { Assignment } from './assignment.entity';
import { User } from './user.entity';
import { AssetCondition } from './asset-unit.entity';

/**
 * ReturnTransaction records each return event against an Assignment.
 * Supports partial returns: multiple ReturnTransactions can reference
 * the same Assignment until returnedQuantity == quantity.
 *
 * For Serialized items: quantity is always 1.
 * For BulkQty items: quantity can be 1..remaining.
 */
@Entity('return_transactions')
@Index(['assignmentId'])
@Index(['createdAt'])
@Check('"quantity" > 0')
export class ReturnTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Assignment, (a) => a.returnTransactions)
  @JoinColumn({ name: 'assignmentId' })
  assignment: Assignment;

  @Column()
  assignmentId: number;

  /**
   * Quantity being returned in this transaction.
   */
  @Column({ type: 'int' })
  quantity: number;

  /**
   * Condition of the item(s) upon return.
   */
  @Column({ type: 'enum', enum: AssetCondition, default: AssetCondition.GOOD })
  conditionOnReturn: AssetCondition;

  /**
   * The employee returning the item(s).
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'returnedById' })
  returnedBy: User;

  @Column()
  returnedById: number;

  /**
   * The IT staff member processing the return.
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'processedById' })
  processedBy: User;

  @Column()
  processedById: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  // NOTE: No @UpdateDateColumn — return records are immutable
}
