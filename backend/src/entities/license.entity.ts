import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LicenseAssignment } from './license-assignment.entity';
import { LicenseRenewal } from './license-renewal.entity';
import { Vendor } from './vendor.entity';
import { LicensePlan } from './license-plan.entity';

@Entity('licenses')
export class License {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'software_name' })
  softwareName: string;

  @Column({ nullable: true })
  vendor: string;

  @Column({ name: 'vendor_id', nullable: true })
  vendorId: number;

  @ManyToOne(() => Vendor, { nullable: true })
  @JoinColumn({ name: 'vendor_id' })
  vendorObj: Vendor;

  @Column({ default: 'saas_sub' })
  category: string;

  @Column({ default: 'user' })
  type: string;

  // Plan Details
  @Column({ name: 'plan_name', nullable: true })
  planName: string; // E.g. "E5", "Enterprise", "Standard"

  @Column({ name: 'license_plan_id', nullable: true })
  licensePlanId: number;

  @ManyToOne(() => LicensePlan, { nullable: true })
  @JoinColumn({ name: 'license_plan_id' })
  licensePlan: LicensePlan;

  @Column({ name: 'product_key', nullable: true })
  productKey: string;

  @Column({ name: 'contract_id', nullable: true })
  contractId: string;

  @Column({ name: 'tenant_id', nullable: true })
  tenantId: string; // AWS Account ID, Azure Tenant ID

  // Coverage
  @Column({ name: 'total_seats', default: 1 })
  totalSeats: number;

  @Column({ name: 'used_seats', default: 0 })
  usedSeats: number;

  @Column({ name: 'cloud_mode', default: true })
  cloudMode: boolean; // True = Cloud, False = On-prem

  // Billing & Cost
  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  unitPrice: number;

  @Column({
    name: 'total_cost',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    nullable: true,
  })
  totalCost: number;

  @Column({ name: 'currency', length: 3, default: 'USD' })
  currency: string;

  @Column({
    name: 'billing_frequency',
    default: 'monthly',
  })
  billingFrequency: string;

  @Column({ name: 'commitment_term', nullable: true })
  commitmentTerm: string; // e.g. "12 Months", "3 Years"

  // Dates
  @Column({ name: 'purchase_date', type: 'date', nullable: true })
  purchaseDate: Date;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ name: 'next_renewal_date', type: 'date', nullable: true })
  nextRenewalDate: Date;

  @Column({ name: 'notice_period_days', default: 30 })
  noticePeriodDays: number;

  // Audit
  @Column({ name: 'renewal_status', nullable: true })
  renewalStatus: string;

  @Column({ name: 'compliance_risk', nullable: true })
  complianceRisk: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => LicenseAssignment, (assignment) => assignment.license)
  assignments: LicenseAssignment[];

  @OneToMany(() => LicenseRenewal, (renewal) => renewal.license)
  renewals: LicenseRenewal[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
