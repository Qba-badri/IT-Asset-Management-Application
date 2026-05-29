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
  Check,
} from 'typeorm';
import { CatalogItem } from './catalog-item.entity';
import { AssetUnit } from './asset-unit.entity';
import { ReturnTransaction } from './return-transaction.entity';
import { Location } from './location.entity';
import { Department } from './department.entity';
import { User } from './user.entity';

/**
 * Assignment status lifecycle:
 * ACTIVE → RETURNED | PARTIALLY_RETURNED | OVERDUE | WRITTEN_OFF
 * PARTIALLY_RETURNED → RETURNED | WRITTEN_OFF
 * OVERDUE → RETURNED | PARTIALLY_RETURNED | WRITTEN_OFF
 */
export enum AssignmentStatus {
  ACTIVE = 'active',
  RETURNED = 'returned',
  PARTIALLY_RETURNED = 'partially_returned',
  OVERDUE = 'overdue',
  WRITTEN_OFF = 'written_off',
}

/**
 * Assignment handles both Serialized and BulkQty items:
 * - Serialized: assetUnit is set, quantity = 1
 * - BulkQty: assetUnit is null, quantity >= 1
 *
 * CONSTRAINT: Serialized items cannot be double-assigned (enforced via AssetUnit.status).
 */
@Entity('assignments')
@Index(['assigneeId', 'status'])
@Index(['catalogItemId'])
@Index(['assetUnitId'])
@Index(['dueDate'])
@Index(['status'])
@Check('"quantity" > 0')
export class Assignment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CatalogItem, { eager: true })
  @JoinColumn({ name: 'catalogItemId' })
  catalogItem: CatalogItem;

  @Column()
  catalogItemId: number;

  /**
   * Only set for Serialized (TrackMode.SERIALIZED) items.
   * Null for BulkQty items.
   */
  @ManyToOne(() => AssetUnit, { nullable: true, eager: true })
  @JoinColumn({ name: 'assetUnitId' })
  assetUnit: AssetUnit;

  @Column({ nullable: true })
  assetUnitId: number;

  /**
   * The employee receiving the item(s).
   */
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'assigneeId' })
  assignee: User;

  @Column()
  assigneeId: number;

  /**
   * The IT staff member who performed the issuance.
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'assignedById' })
  assignedBy: User;

  @Column()
  assignedById: number;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'locationId' })
  issuedFromLocation: Location;

  @Column({ nullable: true })
  locationId: number;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @Column({ nullable: true })
  departmentId: number;

  /**
   * For BulkQty: number of units issued.
   * For Serialized: always 1.
   */
  @Column({ type: 'int', default: 1 })
  quantity: number;

  /**
   * Running count of how many units have been returned (for partial return support).
   */
  @Column({ type: 'int', default: 0 })
  returnedQuantity: number;

  /**
   * Due date for returnable items. Null for consumables/assign-once.
   */
  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.ACTIVE,
  })
  status: AssignmentStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => ReturnTransaction, (rt) => rt.assignment)
  returnTransactions: ReturnTransaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
