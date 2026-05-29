import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { Category } from './category.entity';

/**
 * ReturnPolicy determines how items are handled after issuance.
 * - RETURNABLE: Must be returned; supports partial returns and overdue tracking.
 * - CONSUMABLE: Stock is reduced on issue; no return expected.
 * - ASSIGN_ONCE: Permanently assigned to an employee; auditable, no return.
 */
export enum ReturnPolicy {
  RETURNABLE = 'returnable',
  CONSUMABLE = 'consumable',
  ASSIGN_ONCE = 'assign_once',
}

/**
 * TrackMode determines how inventory is tracked.
 * - SERIALIZED: Each unit has a unique asset tag / serial number (AssetUnit).
 * - BULK_QTY: Tracked by quantity only (StockByLocation).
 */
export enum TrackMode {
  SERIALIZED = 'serialized',
  BULK_QTY = 'bulk_qty',
}

@Entity('catalog_items')
@Index(['sku'], { unique: true })
@Index(['returnPolicy'])
@Index(['trackMode'])
@Index(['isActive'])
export class CatalogItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  sku: string;

  @Column({ length: 300 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => Category, { nullable: true, eager: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ nullable: true })
  categoryId: number;

  @Column({ type: 'enum', enum: ReturnPolicy })
  returnPolicy: ReturnPolicy;

  @Column({ type: 'enum', enum: TrackMode })
  trackMode: TrackMode;

  @Column({ length: 50, default: 'each' })
  unitOfMeasure: string;

  @Column({ type: 'int', default: 0 })
  reorderPoint: number;

  @Column({ length: 100, nullable: true })
  brand: string;

  @Column({ length: 100, nullable: true })
  model: string;

  @Column({ length: 500, nullable: true })
  imageUrl: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  unitCost: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
