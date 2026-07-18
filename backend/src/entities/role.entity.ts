import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Permission } from './permission.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string; // e.g., 'Admin', 'Storekeeper'

  @Column({ nullable: true })
  description: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  /**
   * Built-in roles (the seeded Admin role) are marked as system roles.
   * A system role cannot be renamed, deactivated, or deleted. This flag is
   * never writable through the API — only migrations/seeds set it.
   */
  @Column({ default: false, name: 'is_system' })
  isSystem: boolean;

  @ManyToMany(() => Permission)
  @JoinTable({
    name: 'role_permissions', // Name of the junction table
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
