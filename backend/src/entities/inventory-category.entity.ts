import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    OneToMany,
} from 'typeorm';
import { InventoryItem } from './inventory-item.entity';

@Entity('inventory_categories')
export class InventoryCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 100, unique: true })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    /**
     * Soft-deactivation, distinct from deleted_at: a deleted category is
     * hidden everywhere; an inactive one stays visible in admin screens and
     * on existing items but is excluded from new selections.
     */
    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt: Date;

    @OneToMany(() => InventoryItem, (item) => item.category)
    items: InventoryItem[];
}
