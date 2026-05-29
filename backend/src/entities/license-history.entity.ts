import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { License } from './license.entity';
import { User } from './user.entity';

export enum LicenseAction {
    CREATED = 'created',
    UPDATED = 'updated',
    ASSIGNED = 'assigned',
    UNASSIGNED = 'unassigned',
    RENEWED = 'renewed',
    AUDITED = 'audited',
    SEAT_ADJUSTMENT = 'seat_adjustment',
}

@Entity('license_history')
export class LicenseHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'license_id' })
    licenseId: number;

    @ManyToOne(() => License, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'license_id' })
    license: License;

    @Column({ type: 'enum', enum: LicenseAction })
    action: LicenseAction;

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

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn({ name: 'action_date' })
    actionDate: Date;
}
