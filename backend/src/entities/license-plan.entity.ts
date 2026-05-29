import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Vendor } from './vendor.entity';

@Entity('license_plans')
export class LicensePlan {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string; // e.g. "Microsoft 365 E5"

    @Column({ name: 'product_family', nullable: true })
    productFamily: string; // e.g. "Office 365", "Dynamics 365"

    @Column({ name: 'vendor_id' })
    vendorId: number;

    @ManyToOne(() => Vendor, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'vendor_id' })
    vendor: Vendor;

    @Column({ nullable: true })
    type: string; // master value: 'User-based', 'Device-based'

    @Column({ nullable: true })
    category: string; // master value: 'SaaS', 'On-prem'

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
