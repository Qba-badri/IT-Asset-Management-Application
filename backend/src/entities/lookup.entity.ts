import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('lookups')
export class Lookup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string; // e.g., 'ASSET_CONDITION', 'DISPOSAL_METHOD', 'ASSET_STATUS'

  @Column()
  label: string;

  @Column()
  value: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
