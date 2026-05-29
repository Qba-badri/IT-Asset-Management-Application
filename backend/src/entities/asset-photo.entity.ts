import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Asset } from './asset.entity';

export enum PhotoCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  DAMAGED = 'damaged',
}

@Entity('asset_photos')
export class AssetPhoto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'asset_id' })
  assetId: number;

  @ManyToOne(() => Asset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column({ name: 'filename' })
  filename: string;

  @Column({ name: 'file_path' })
  filePath: string;

  @Column({ name: 'file_size' })
  fileSize: number;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({
    type: 'enum',
    enum: PhotoCondition,
    default: PhotoCondition.GOOD,
  })
  condition: PhotoCondition;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;
}
