import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { InventoryItem } from './inventory-item.entity';
import { User } from './user.entity';

export enum InventoryAssignmentStatus {
    ASSIGNED = 'assigned',
    RETURNED = 'returned',
    CLOSED = 'closed',
}

export enum InventoryAssignmentTargetType {
    PERSON = 'PERSON',
    LOCATION = 'LOCATION',
}

@Entity('inventory_assignments')
export class InventoryAssignment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        name: 'target_type',
        type: 'enum',
        enum: InventoryAssignmentTargetType,
        default: InventoryAssignmentTargetType.PERSON,
    })
    targetType: InventoryAssignmentTargetType;

    @Column({ name: 'user_id', type: 'int', nullable: true })
    @Index()
    userId: number;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'varchar', length: 255, nullable: true })
    location: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    department: string;

    @Column({ name: 'item_id', type: 'int' })
    itemId: number;

    @ManyToOne(() => InventoryItem, (item) => item.assignments)
    @JoinColumn({ name: 'item_id' })
    item: InventoryItem;

    @Column({ type: 'int' })
    quantity: number;

    @Column({ name: 'assignment_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    assignmentDate: Date;

    @Column({ name: 'expected_return_date', type: 'timestamp', nullable: true })
    expectedReturnDate: Date;

    @Column({
        type: 'enum',
        enum: InventoryAssignmentStatus,
        default: InventoryAssignmentStatus.ASSIGNED,
    })
    status: InventoryAssignmentStatus;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt: Date;
}
