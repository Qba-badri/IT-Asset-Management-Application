import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string; // e.g., 'assets.create'

  @Column()
  description: string; // e.g., 'Can create new assets'

  @Column()
  module: string; // e.g., 'Assets', 'Users'

  /**
   * Soft-deactivation. An inactive permission stays attached to its roles
   * (mappings are preserved) but grants no access and cannot be newly
   * assigned. Enforced in effectivePermissions() and RbacService.
   */
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
