import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { InventoryCategory } from './inventory-category.entity';
import { InventoryTransaction } from './inventory-transaction.entity';
import { InventoryAssignment } from './inventory-assignment.entity';
import { InventoryPurchase } from './inventory-purchase.entity';

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'category_id', type: 'int' })
  categoryId: number;

  @ManyToOne(() => InventoryCategory, (category) => category.items)
  @JoinColumn({ name: 'category_id' })
  category: InventoryCategory;

  @Column({ name: 'is_refundable', type: 'boolean', default: false })
  isRefundable: boolean;

  @Column({ name: 'total_stock', type: 'int', default: 0 })
  totalStock: number;

  @Column({ name: 'available_stock', type: 'int', default: 0 })
  availableStock: number;

  @Column({ name: 'min_stock_level', type: 'int', default: 5 })
  minStockLevel: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vendor: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  supplier: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string; // 'active' | 'inactive'

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @OneToMany(() => InventoryTransaction, (tx) => tx.item)
  transactions: InventoryTransaction[];

  @OneToMany(() => InventoryAssignment, (ca) => ca.item)
  assignments: InventoryAssignment[];

  @OneToMany(() => InventoryPurchase, (p) => p.item)
  purchases: InventoryPurchase[];
}
