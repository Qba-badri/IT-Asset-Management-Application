import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('system_settings')
export class SystemSetting {
    @PrimaryColumn()
    key: string;

    @Column('text', { nullable: true })
    value: string;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
