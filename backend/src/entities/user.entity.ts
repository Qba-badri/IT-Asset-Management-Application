import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PasswordResetToken } from './password-reset-token.entity';
import { Role } from './role.entity';
import { Asset } from './asset.entity';
import { LicenseAssignment } from './license-assignment.entity';

// ... (existing imports)

@Entity('users')
@Index(['email'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  // New Relation
  @Column({ name: 'role_id', type: 'int', nullable: true })
  roleId: number;

  @ManyToOne(() => Role, { eager: true }) // Eager load role to check permissions easily
  @JoinColumn({ name: 'role_id' })
  role: Role;

  // ... rest of class

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: true })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: true })
  lastName: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin: Date;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'phone_number' })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string;

  @Column({ name: 'token_version', type: 'int', default: 0 })
  tokenVersion: number;

  @Column({ type: 'json', nullable: true })
  settings: any;

  @Column({
    name: 'azure_id',
    type: 'varchar',
    length: 255,
    nullable: true,
    unique: true,
  })
  azureId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @OneToMany(() => PasswordResetToken, (token) => token.user, { cascade: true })
  passwordResetTokens: PasswordResetToken[];

  @OneToMany(() => Asset, (asset) => asset.assignedTo)
  assignedAssets: Asset[];

  @OneToMany(() => LicenseAssignment, (la) => la.user)
  licenseAssignments: LicenseAssignment[];
}
