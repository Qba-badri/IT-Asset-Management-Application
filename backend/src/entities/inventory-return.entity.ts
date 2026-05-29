import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToOne,
} from 'typeorm';
import { InventoryAssignment } from './inventory-assignment.entity';
import { InventoryItem } from './inventory-item.entity';
import { User } from './user.entity';

@Entity('inventory_returns')
export class InventoryReturn {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'assignment_id', type: 'int' })
    assignmentId: number;

    @OneToOne(() => InventoryAssignment)
    @JoinColumn({ name: 'assignment_id' })
    assignment: InventoryAssignment;

    @Column({ name: 'item_id', type: 'int' })
    itemId: number;

    @ManyToOne(() => InventoryItem)
    @JoinColumn({ name: 'item_id' })
    item: InventoryItem;

    @Column({ name: 'return_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    returnDate: Date;

    @Column({ name: 'item_condition', type: 'varchar', length: 100, nullable: true })
    condition: string;

    @Column({ name: 'approved_by_id', type: 'int', nullable: true })
    approvedById: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'approved_by_id' })
    approvedBy: User;

    @Column({ type: 'text', nullable: true })
    remarks: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
