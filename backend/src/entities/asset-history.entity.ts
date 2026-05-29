import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Asset } from './asset.entity';
import { User } from './user.entity';

export enum AssetAction {
  CREATED = 'created',
  UPDATED = 'updated',
  CHECKOUT = 'checkout',
  CHECKIN = 'checkin',
  MAINTENANCE_START = 'maintenance_start',
  MAINTENANCE_END = 'maintenance_end',
  DISPOSED = 'disposed',
  LOCATION_CHANGE = 'location_change',
  DEPRECIATION = 'depreciation',
}

@Entity('asset_history')
export class AssetHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'asset_id' })
  assetId: number;

  @ManyToOne(() => Asset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column({ type: 'enum', enum: AssetAction })
  action: AssetAction;

  @Column({ name: 'performed_by_id', nullable: true })
  performedById: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'performed_by_id' })
  performedBy: User;

  @Column({ name: 'assigned_to_id', nullable: true })
  assignedToId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo: User;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'jsonb', nullable: true })
  changes: any;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'action_date' })
  actionDate: Date;
}
