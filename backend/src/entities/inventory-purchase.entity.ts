import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { InventoryItem } from './inventory-item.entity';

@Entity('inventory_purchases')
export class InventoryPurchase {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'vendor_name', type: 'varchar', length: 255 })
    vendorName: string;

    @Column({ name: 'invoice_number', type: 'varchar', length: 100, nullable: true })
    invoiceNumber: string;

    @Column({ name: 'purchase_date', type: 'timestamp' })
    purchaseDate: Date;

    @Column({ name: 'item_id', type: 'int' })
    itemId: number;

    @ManyToOne(() => InventoryItem)
    @JoinColumn({ name: 'item_id' })
    item: InventoryItem;

    @Column({ type: 'int' })
    quantity: number;

    @Column({ name: 'unit_cost', type: 'decimal', precision: 12, scale: 2 })
    unitCost: number;

    @Column({ name: 'total_cost', type: 'decimal', precision: 12, scale: 2 })
    totalCost: number;

    @Column({ type: 'text', nullable: true })
    remarks: string;

    @Column({ type: 'varchar', length: 10, default: 'USD' })
    currency: string;

    @Column({ name: 'invoice_attachment', type: 'varchar', length: 500, nullable: true })
    invoiceAttachment: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt: Date;
}
