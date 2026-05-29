import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { InventoryItem } from './inventory-item.entity';
import { User } from './user.entity';

export enum InventoryTransactionType {
    IN = 'IN',
    OUT = 'OUT',
    RETURN = 'RETURN',
    ADJUSTMENT = 'ADJUSTMENT',
}

@Entity('inventory_transactions')
export class InventoryTransaction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'item_id', type: 'int' })
    @Index()
    itemId: number;

    @ManyToOne(() => InventoryItem, (item) => item.transactions)
    @JoinColumn({ name: 'item_id' })
    item: InventoryItem;

    @Column({
        type: 'enum',
        enum: InventoryTransactionType,
    })
    type: InventoryTransactionType;

    @Column({ type: 'int' })
    quantity: number;

    @Column({ name: 'reference_id', type: 'int', nullable: true })
    referenceId: number;

    @Column({ name: 'reference_type', type: 'varchar', length: 50, nullable: true })
    referenceType: string; // 'purchase', 'assignment', 'return', 'manual'

    @CreateDateColumn({ name: 'transaction_date' })
    transactionDate: Date;

    @Column({ name: 'performed_by_id', type: 'int', nullable: true })
    performedById: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'performed_by_id' })
    performedBy: User;

    @Column({ type: 'text', nullable: true })
    notes: string;
}
