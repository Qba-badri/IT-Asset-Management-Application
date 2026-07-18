import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    UpdateDateColumn,
} from 'typeorm';

// Rate semantics match EXCHANGE_RATES / CurrencyContext: rateToBase = "1 [code] = X INR".
@Entity('currency_rates')
export class CurrencyRate {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 3, unique: true })
    code: string;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'varchar', length: 10 })
    symbol: string;

    @Column({ name: 'rate_to_base', type: 'decimal', precision: 18, scale: 8, default: 1 })
    rateToBase: number;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
