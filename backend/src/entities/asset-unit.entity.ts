import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { CatalogItem } from './catalog-item.entity';
import { Location } from './location.entity';

/**
 * Status lifecycle for a serialized asset unit.
 */
export enum AssetUnitStatus {
  IN_STOCK = 'in_stock',
  ASSIGNED = 'assigned',
  IN_MAINTENANCE = 'in_maintenance',
  IN_REPAIR = 'in_repair',
  LOST = 'lost',
  WRITTEN_OFF = 'written_off',
  DISPOSED = 'disposed',
}

export enum AssetCondition {
  NEW = 'new',
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  DAMAGED = 'damaged',
}

@Entity('asset_units')
@Index(['assetTag'], { unique: true })
@Index(['serialNumber'])
@Index(['status'])
@Index(['catalogItemId', 'status'])
export class AssetUnit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  assetTag: string;

  @ManyToOne(() => CatalogItem, { eager: true })
  @JoinColumn({ name: 'catalogItemId' })
  catalogItem: CatalogItem;

  @Column()
  catalogItemId: number;

  @Column({ length: 100, nullable: true })
  serialNumber: string;

  @Column({
    type: 'enum',
    enum: AssetUnitStatus,
    default: AssetUnitStatus.IN_STOCK,
  })
  status: AssetUnitStatus;

  @Column({ type: 'enum', enum: AssetCondition, default: AssetCondition.NEW })
  condition: AssetCondition;

  @ManyToOne(() => Location, { nullable: true, eager: true })
  @JoinColumn({ name: 'locationId' })
  location: Location;

  @Column({ nullable: true })
  locationId: number;

  @Column({ type: 'date', nullable: true })
  purchaseDate: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  purchaseCost: number;

  @Column({ name: 'currency', length: 3, default: 'INR' })
  currency: string;

  @Column({ length: 200, nullable: true })
  vendor: string;

  @Column({ type: 'date', nullable: true })
  warrantyExpiry: Date;

  @Column({ type: 'int', nullable: true })
  usefulLifeYears: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  salvageValue: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
