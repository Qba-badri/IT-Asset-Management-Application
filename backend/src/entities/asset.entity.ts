import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { AssetPhoto } from './asset-photo.entity';
import { Brand } from './brand.entity';
import { Vendor } from './vendor.entity';

export enum AssetStatus {
    AVAILABLE = 'available',
    DEPLOYED = 'deployed',
    MAINTENANCE = 'maintenance',
    DISPOSED = 'disposed',
    RETIRED = 'retired',
    REPAIR = 'repair',
    IN_REPAIR = 'in repair',
    LOST = 'lost',
    STOLEN = 'stolen',
}

export enum AssetCategory {
    LAPTOP = 'laptop',
    DESKTOP = 'desktop',
    MOBILE = 'mobile',
    TABLET = 'tablet',
    PRINTER = 'printer',
    MONITOR = 'monitor',
    NETWORK = 'network',
    SERVER = 'server',
    OTHER = 'other',
}

export enum AssetCondition {
    NEW = 'new',
    EXCELLENT = 'excellent',
    GOOD = 'good',
    FAIR = 'fair',
    POOR = 'poor',
}

export enum AcquisitionType {
    PURCHASED = 'purchased',
    RENTED = 'rented',
}

@Entity('assets')
export class Asset {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'asset_tag', unique: true })
    assetTag: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    hostname: string;

    @Column({ type: 'varchar', length: 50 })
    category: AssetCategory;

    @Column({ nullable: true })
    brand: string;

    @Column({ name: 'brand_id', nullable: true })
    brandId: number;

    @ManyToOne(() => Brand, { nullable: true })
    @JoinColumn({ name: 'brand_id' })
    brandObj: Brand;

    @Column({ nullable: true })
    vendor: string;

    @Column({ name: 'vendor_id', nullable: true })
    vendorId: number;

    @ManyToOne(() => Vendor, { nullable: true })
    @JoinColumn({ name: 'vendor_id' })
    vendorObj: Vendor;

    @Column({ name: 'received_from_vendor_date', type: 'date', nullable: true })
    receivedFromVendorDate: Date;

    @Column({
        name: 'vendor_monthly_rent',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    vendorMonthlyRent: number;

    @Column({ nullable: true })
    model: string;

    @Column({ name: 'serial_number', nullable: true })
    serialNumber: string;

    @Column({ type: 'varchar', length: 50, default: AssetStatus.AVAILABLE })
    status: AssetStatus;

    @Column({ type: 'varchar', length: 50, default: AssetCondition.GOOD })
    condition: AssetCondition;

    @Column({
        name: 'acquisition_type',
        type: 'varchar',
        length: 20,
        default: AcquisitionType.PURCHASED
    })
    acquisitionType: AcquisitionType;

    // Acquisition Details
    @Column({ name: 'purchase_date', type: 'date', nullable: true })
    purchaseDate: Date;

    @Column({
        name: 'purchase_cost',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    purchaseCost: number;

    @Column({ name: 'currency', length: 3, default: 'INR' })
    currency: string;

    @Column({ name: 'warranty_expiry', type: 'date', nullable: true })
    warrantyExpiry: Date;

    @Column({ name: 'warranty_start', type: 'date', nullable: true })
    warrantyStart: Date;

    @Column({ name: 'warranty_type', nullable: true })
    warrantyType: string; // e.g., On-site, Depot, CarePack

    @Column({ name: 'po_number', nullable: true })
    poNumber: string;

    @Column({ name: 'invoice_number', nullable: true })
    invoiceNumber: string;

    @Column({ name: 'cost_center', nullable: true })
    costCenter: string;

    @Column({ name: 'business_owner_id', nullable: true })
    businessOwnerId: number;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'business_owner_id' })
    businessOwner: User;

    // Deployment Details
    @Column({ name: 'assigned_to_id', type: 'int', nullable: true })
    assignedToId: number;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'assigned_to_id' })
    assignedTo: User;

    @Column({ name: 'deployment_date', type: 'date', nullable: true })
    deploymentDate: Date;

    @Column({ nullable: true })
    location: string; // Keep for legacy/notes

    @Column({ nullable: true })
    site: string;

    @Column({ nullable: true })
    building: string;

    @Column({ nullable: true })
    floor: string;

    @Column({ name: 'room_desk', nullable: true })
    roomDesk: string;

    // Maintenance Details
    @Column({ name: 'last_maintenance_date', type: 'date', nullable: true })
    lastMaintenanceDate: Date;

    @Column({ name: 'next_maintenance_date', type: 'date', nullable: true })
    nextMaintenanceDate: Date;

    @Column({ name: 'maintenance_notes', type: 'text', nullable: true })
    maintenanceNotes: string;

    @Column({ name: 'maintenance_cycle_days', type: 'int', nullable: true })
    maintenanceCycleDays: number;

    // Depreciation Details
    @Column({ name: 'useful_life_years', type: 'int', default: 3 })
    usefulLifeYears: number;

    @Column({
        name: 'salvage_value',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    salvageValue: number;

    @Column({
        name: 'current_value',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    currentValue: number;

    // Disposal Details
    @Column({ name: 'disposal_date', type: 'date', nullable: true })
    disposalDate: Date;

    @Column({ name: 'disposal_method', nullable: true })
    disposalMethod: string;

    @Column({ name: 'disposal_notes', type: 'text', nullable: true })
    disposalNotes: string;

    // Additional Info
    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt: Date;

    @OneToMany(() => AssetPhoto, (photo) => photo.asset)
    photos: AssetPhoto[];
}
