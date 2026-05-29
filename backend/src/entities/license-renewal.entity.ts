import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { License } from './license.entity';

@Entity('license_renewals')
export class LicenseRenewal {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'license_id' })
    licenseId: number;

    @ManyToOne(() => License, (license) => license.renewals, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'license_id' })
    license: License;

    @Column({ name: 'old_expiry_date', type: 'date', nullable: true })
    oldExpiryDate: Date;

    @Column({ name: 'new_expiry_date', type: 'date' })
    newExpiryDate: Date;

    @Column({ name: 'cost_change', type: 'decimal', precision: 10, scale: 2, default: 0 })
    costChange: number;

    @Column({ type: 'text', nullable: true })
    remarks: string;

    @Column({ name: 'renewed_by', nullable: true })
    renewedBy: number; // User ID

    @CreateDateColumn({ name: 'renewed_at' })
    renewedAt: Date;
}
