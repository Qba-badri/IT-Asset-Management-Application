import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { CatalogItem } from './catalog-item.entity';
import { Location } from './location.entity';
import { User } from './user.entity';

/**
 * Reason codes for stock quantity changes in the ledger.
 */
export enum LedgerReason {
  INITIAL_STOCK = 'initial_stock',
  PROCUREMENT = 'procurement',
  ISSUE = 'issue',
  RETURN = 'return',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  ADJUSTMENT = 'adjustment',
  WRITE_OFF = 'write_off',
  LOST = 'lost',
  DISPOSED = 'disposed',
}

/**
 * StockLedger is an APPEND-ONLY ledger recording every quantity change.
 * - quantityChange: positive = stock increase, negative = stock decrease
 * - runningBalance: cached balance after this entry (for fast queries)
 * - referenceType + referenceId: polymorphic reference to the source transaction
 *
 * IMMUTABLE: No UPDATE or DELETE operations should ever be performed on this table.
 */
@Entity('stock_ledger')
@Index(['catalogItemId', 'locationId'])
@Index(['createdAt'])
@Index(['reason'])
@Index(['referenceType', 'referenceId'])
export class StockLedger {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CatalogItem)
  @JoinColumn({ name: 'catalogItemId' })
  catalogItem: CatalogItem;

  @Column()
  catalogItemId: number;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'locationId' })
  location: Location;

  @Column()
  locationId: number;

  /**
   * Positive = stock added, Negative = stock removed
   */
  @Column({ type: 'int' })
  quantityChange: number;

  /**
   * Running balance at this location after applying this entry.
   * Cached for fast reporting; authoritative balance is StockByLocation.quantity.
   */
  @Column({ type: 'int' })
  runningBalance: number;

  @Column({ type: 'enum', enum: LedgerReason })
  reason: LedgerReason;

  /**
   * Polymorphic reference: 'assignment', 'return_transaction', 'adjustment', etc.
   */
  @Column({ length: 50, nullable: true })
  referenceType: string;

  @Column({ nullable: true })
  referenceId: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: number;

  @CreateDateColumn()
  createdAt: Date;

  // NOTE: No @UpdateDateColumn — ledger entries are immutable
}
