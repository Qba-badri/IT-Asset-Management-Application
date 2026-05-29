import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
  Check,
  Unique,
} from 'typeorm';
import { CatalogItem } from './catalog-item.entity';
import { Location } from './location.entity';

/**
 * StockByLocation tracks the current quantity of BulkQty catalog items
 * at each location. For Serialized items, stock is derived from AssetUnit status.
 *
 * CONSTRAINT: quantity >= 0 (no negative stock)
 */
@Entity('stock_by_location')
@Unique(['catalogItemId', 'locationId'])
@Check('"quantity" >= 0')
@Index(['catalogItemId'])
@Index(['locationId'])
export class StockByLocation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CatalogItem, { eager: true })
  @JoinColumn({ name: 'catalogItemId' })
  catalogItem: CatalogItem;

  @Column()
  catalogItemId: number;

  @ManyToOne(() => Location, { eager: true })
  @JoinColumn({ name: 'locationId' })
  location: Location;

  @Column()
  locationId: number;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
