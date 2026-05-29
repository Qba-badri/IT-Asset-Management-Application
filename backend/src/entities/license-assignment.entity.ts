import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { License } from './license.entity';

@Entity('license_assignments')
export class LicenseAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'license_id' })
  licenseId: number;

  @ManyToOne(() => License, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'license_id' })
  license: License;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt: Date;

  @Column({ nullable: true })
  notes: string;
}
