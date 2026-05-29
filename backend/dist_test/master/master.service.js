"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const brand_entity_1 = require("../entities/brand.entity");
const vendor_entity_1 = require("../entities/vendor.entity");
const lookup_entity_1 = require("../entities/lookup.entity");
const license_plan_entity_1 = require("../entities/license-plan.entity");
let MasterService = class MasterService {
    constructor(brandRepo, vendorRepo, lookupRepo, planRepo) {
        this.brandRepo = brandRepo;
        this.vendorRepo = vendorRepo;
        this.lookupRepo = lookupRepo;
        this.planRepo = planRepo;
    }
    async onModuleInit() {
        await this.seedLookups();
        await this.seedVendorsAndPlans();
    }
    async seedLookups() {
        await this.lookupRepo.delete({ type: 'LICENSE_CATEGORY' });
        const lookups = [
            { type: 'LICENSE_CATEGORY', label: 'SaaS (Subscription)', value: 'saas_sub' },
            { type: 'LICENSE_CATEGORY', label: 'SaaS (Consumption / Usage-Based)', value: 'saas_usage' },
            { type: 'LICENSE_CATEGORY', label: 'On-premise (Subscription)', value: 'on_prem_sub' },
            { type: 'LICENSE_CATEGORY', label: 'On-premise (Perpetual)', value: 'on_prem_perpetual' },
            { type: 'LICENSE_CATEGORY', label: 'Support / Maintenance Only', value: 'support_only' },
            { type: 'LICENSE_TYPE', label: 'Per-User / Seat', value: 'user', description: 'Individual users. Best for predictable SaaS usage.' },
            { type: 'LICENSE_TYPE', label: 'Concurrent User', value: 'concurrent', description: 'Simultaneous users. Best for shared tools, shift work.' },
            { type: 'LICENSE_TYPE', label: 'Usage / Metered', value: 'usage', description: 'Actual consumption. Best for variable/heavy workloads.' },
            { type: 'LICENSE_TYPE', label: 'Perpetual (One-time)', value: 'perpetual', description: 'One-time purchase. Best for long-term ownership.' },
            { type: 'LICENSE_TYPE', label: 'Device-based', value: 'device', description: 'Specific hardware. Best for shared workstations/IoT.' },
            { type: 'LICENSE_TYPE', label: 'Feature-based', value: 'feature', description: 'Functionality needed. Best for customizable access.' },
            { type: 'DEPLOYMENT_MODE', label: 'Cloud', value: 'cloud' },
            { type: 'DEPLOYMENT_MODE', label: 'On-premise', value: 'on_prem' },
            { type: 'DEPLOYMENT_MODE', label: 'Hybrid', value: 'hybrid' },
            { type: 'BILLING_FREQUENCY', label: 'Monthly', value: 'monthly' },
            { type: 'BILLING_FREQUENCY', label: 'Quarterly', value: 'quarterly' },
            { type: 'BILLING_FREQUENCY', label: 'Half-Yearly', value: 'half_yearly' },
            { type: 'BILLING_FREQUENCY', label: 'Yearly', value: 'yearly' },
            { type: 'BILLING_FREQUENCY', label: 'One-time', value: 'one_time' },
            { type: 'COMMITMENT_TERM', label: 'Monthly (No Commitment)', value: 'monthly_no_commit' },
            { type: 'COMMITMENT_TERM', label: '1 Year', value: '1_year' },
            { type: 'COMMITMENT_TERM', label: '2 Years', value: '2_years' },
            { type: 'COMMITMENT_TERM', label: '3 Years', value: '3_years' },
            { type: 'COMMITMENT_TERM', label: 'Custom', value: 'custom' },
            { type: 'NOTICE_PERIOD', label: '15 Days', value: '15' },
            { type: 'NOTICE_PERIOD', label: '30 Days', value: '30' },
            { type: 'NOTICE_PERIOD', label: '45 Days', value: '45' },
            { type: 'NOTICE_PERIOD', label: '60 Days', value: '60' },
            { type: 'NOTICE_PERIOD', label: '90 Days', value: '90' },
            { type: 'RENEWAL_STATUS', label: 'Active', value: 'active' },
            { type: 'RENEWAL_STATUS', label: 'Expiring Soon', value: 'expiring_soon' },
            { type: 'RENEWAL_STATUS', label: 'In Renewal Review', value: 'in_review' },
            { type: 'RENEWAL_STATUS', label: 'Renewed', value: 'renewed' },
            { type: 'RENEWAL_STATUS', label: 'Expired', value: 'expired' },
            { type: 'RENEWAL_STATUS', label: 'Cancelled', value: 'cancelled' },
            { type: 'CURRENCY', label: 'USD - US Dollar', value: 'USD' },
            { type: 'CURRENCY', label: 'EUR - Euro', value: 'EUR' },
            { type: 'CURRENCY', label: 'GBP - British Pound', value: 'GBP' },
            { type: 'CURRENCY', label: 'INR - Indian Rupee', value: 'INR' },
            { type: 'CURRENCY', label: 'AED - Dirham', value: 'AED' },
            { type: 'CURRENCY', label: 'SGD - Singapore Dollar', value: 'SGD' },
            { type: 'CURRENCY', label: 'AUD - Australian Dollar', value: 'AUD' },
            { type: 'CURRENCY', label: 'CAD - Canadian Dollar', value: 'CAD' },
            { type: 'CURRENCY', label: 'JPY - Japanese Yen', value: 'JPY' },
            { type: 'AUDIT_STATUS', label: 'Not Audited', value: 'not_audited' },
            { type: 'AUDIT_STATUS', label: 'Pending', value: 'pending' },
            { type: 'AUDIT_STATUS', label: 'Passed', value: 'passed' },
            { type: 'AUDIT_STATUS', label: 'Failed', value: 'failed' },
            { type: 'AUDIT_STATUS', label: 'Needs Review', value: 'needs_review' },
            { type: 'COMPLIANCE_RISK', label: 'Low', value: 'low' },
            { type: 'COMPLIANCE_RISK', label: 'Medium', value: 'medium' },
            { type: 'COMPLIANCE_RISK', label: 'High', value: 'high' },
            { type: 'ASSET_CONDITION', label: 'New', value: 'new' },
            { type: 'ASSET_CONDITION', label: 'Excellent', value: 'excellent' },
            { type: 'ASSET_CONDITION', label: 'Good', value: 'good' },
            { type: 'ASSET_CONDITION', label: 'Fair', value: 'fair' },
            { type: 'ASSET_CONDITION', label: 'Poor', value: 'poor' },
            { type: 'ASSET_CONDITION', label: 'Damaged', value: 'damaged' },
            { type: 'ASSET_STATUS', label: 'Available', value: 'available' },
            { type: 'ASSET_STATUS', label: 'Deployed', value: 'deployed' },
            { type: 'ASSET_STATUS', label: 'In Maintenance', value: 'maintenance' },
            { type: 'ASSET_STATUS', label: 'Under Repair', value: 'repair' },
            { type: 'ASSET_STATUS', label: 'Disposed', value: 'disposed' },
            { type: 'ASSET_STATUS', label: 'Lost', value: 'lost' },
            { type: 'ASSET_STATUS', label: 'Stolen', value: 'stolen' },
            { type: 'DISPOSAL_METHOD', label: 'Auction', value: 'auction' },
            { type: 'DISPOSAL_METHOD', label: 'Donated', value: 'donated' },
            { type: 'DISPOSAL_METHOD', label: 'Recycled', value: 'recycled' },
            { type: 'DISPOSAL_METHOD', label: 'Scrapped', value: 'scrapped' },
            { type: 'DISPOSAL_METHOD', label: 'Sold', value: 'sold' },
            { type: 'DISPOSAL_METHOD', label: 'Trade-in', value: 'trade_in' },
        ];
        for (const item of lookups) {
            const exists = await this.lookupRepo.findOneBy({ type: item.type, value: item.value });
            if (exists) {
                await this.lookupRepo.save({
                    ...exists,
                    label: item.label,
                    description: item.description,
                    sortOrder: lookups.indexOf(item) + 1,
                });
            }
            else {
                await this.lookupRepo.save({
                    ...item,
                    sortOrder: lookups.indexOf(item) + 1,
                    isActive: true,
                });
            }
        }
    }
    async seedVendorsAndPlans() {
        const vendors = [
            'Microsoft',
            'AWS',
            'SAP',
            'Salesforce',
            'Adobe',
            'Atlassian',
            'Autodesk',
            'Google',
            'Oracle',
            'IBM',
            'Other',
        ];
        const plans = {
            Microsoft: [
                { name: 'Microsoft 365 E3', family: 'Microsoft 365', type: 'user', category: 'saas_sub' },
                { name: 'Microsoft 365 E5', family: 'Microsoft 365', type: 'user', category: 'saas_sub' },
                { name: 'Microsoft 365 F1', family: 'Microsoft 365', type: 'user', category: 'saas_sub' },
                { name: 'Microsoft 365 F3', family: 'Microsoft 365', type: 'user', category: 'saas_sub' },
                { name: 'Microsoft 365 Business Basic', family: 'Business', type: 'user', category: 'saas_sub' },
                { name: 'Microsoft 365 Business Standard', family: 'Business', type: 'user', category: 'saas_sub' },
                { name: 'Microsoft 365 Business Premium', family: 'Business', type: 'user', category: 'saas_sub' },
                { name: 'Office 365 E1', family: 'Office 365', type: 'user', category: 'saas_sub' },
                { name: 'Office 365 E3', family: 'Office 365', type: 'user', category: 'saas_sub' },
                { name: 'Office 365 E5', family: 'Office 365', type: 'user', category: 'saas_sub' },
                { name: 'Project Plan 3', family: 'Project', type: 'user', category: 'saas_sub' },
                { name: 'Visio Plan 2', family: 'Visio', type: 'user', category: 'saas_sub' },
            ],
            AWS: [
                { name: 'AWS Consumption', family: 'Infrastructure', type: 'usage', category: 'saas_usage' },
                { name: 'Enterprise Support', family: 'Support', type: 'usage', category: 'support_only' },
                { name: 'Marketplace Subscription', family: 'Marketplace', type: 'usage', category: 'saas_usage' },
                { name: 'Reserved Instance', family: 'Compute', type: 'usage', category: 'saas_usage' },
                { name: 'Savings Plan', family: 'Compute', type: 'usage', category: 'saas_usage' },
            ],
            SAP: [
                { name: 'S/4HANA Cloud', family: 'ERP', type: 'user', category: 'saas_sub' },
                { name: 'S/4HANA On-Premise', family: 'ERP', type: 'user', category: 'on_prem_perpetual' },
                { name: 'SAP SuccessFactors', family: 'HR', type: 'user', category: 'saas_sub' },
                { name: 'SAP Concur', family: 'Expense', type: 'user', category: 'saas_sub' },
                { name: 'SAP Ariba', family: 'Procurement', type: 'user', category: 'saas_sub' },
            ],
            Salesforce: [
                { name: 'Sales Cloud Starter', family: 'Sales Cloud', type: 'user', category: 'saas_sub' },
                { name: 'Sales Cloud Professional', family: 'Sales Cloud', type: 'user', category: 'saas_sub' },
                { name: 'Sales Cloud Enterprise', family: 'Sales Cloud', type: 'user', category: 'saas_sub' },
                { name: 'Sales Cloud Unlimited', family: 'Sales Cloud', type: 'user', category: 'saas_sub' },
                { name: 'Service Cloud Enterprise', family: 'Service Cloud', type: 'user', category: 'saas_sub' },
                { name: 'Marketing Cloud', family: 'Marketing Cloud', type: 'usage', category: 'saas_usage' },
            ],
        };
        for (const vName of vendors) {
            let vendor = await this.vendorRepo.findOneBy({ name: vName });
            if (!vendor) {
                vendor = await this.vendorRepo.save({ name: vName, isActive: true });
            }
            const vendorPlans = plans[vName];
            if (vendorPlans) {
                for (const p of vendorPlans) {
                    const planExists = await this.planRepo.findOneBy({ name: p.name, vendorId: vendor.id });
                    if (planExists) {
                        await this.planRepo.save({
                            ...planExists,
                            productFamily: p.family,
                            type: p.type,
                            category: p.category,
                        });
                    }
                    else {
                        await this.planRepo.save({
                            name: p.name,
                            productFamily: p.family,
                            type: p.type,
                            category: p.category,
                            vendor: vendor,
                            isActive: true,
                        });
                    }
                }
            }
        }
    }
    async findAllBrands() {
        return this.brandRepo.find({ order: { name: 'ASC' } });
    }
    async createBrand(data) {
        const brand = this.brandRepo.create(data);
        return this.brandRepo.save(brand);
    }
    async updateBrand(id, data) {
        await this.brandRepo.update(id, data);
        return this.brandRepo.findOneBy({ id });
    }
    async deleteBrand(id) {
        return this.brandRepo.delete(id);
    }
    async findAllVendors() {
        return this.vendorRepo.find({ order: { name: 'ASC' } });
    }
    async createVendor(data) {
        const vendor = this.vendorRepo.create(data);
        return this.vendorRepo.save(vendor);
    }
    async updateVendor(id, data) {
        await this.vendorRepo.update(id, data);
        return this.vendorRepo.findOneBy({ id });
    }
    async deleteVendor(id) {
        return this.vendorRepo.delete(id);
    }
    async findAllPlans() {
        return this.planRepo.find({
            relations: ['vendor'],
            order: { vendor: { name: 'ASC' }, productFamily: 'ASC', name: 'ASC' },
        });
    }
    async findPlansByVendor(vendorId) {
        return this.planRepo.find({
            where: { vendorId: vendorId, isActive: true },
            order: { productFamily: 'ASC', name: 'ASC' },
        });
    }
    async createPlan(data) {
        const plan = this.planRepo.create(data);
        return this.planRepo.save(plan);
    }
    async updatePlan(id, data) {
        await this.planRepo.update(id, data);
        return this.planRepo.findOneBy({ id });
    }
    async deletePlan(id) {
        return this.planRepo.delete(id);
    }
    async findLookupsByType(type) {
        return this.lookupRepo.find({
            where: { type, isActive: true },
            order: { sortOrder: 'ASC', label: 'ASC' },
        });
    }
    async findAllLookups() {
        return this.lookupRepo.find({ order: { type: 'ASC', sortOrder: 'ASC' } });
    }
    async createLookup(data) {
        const lookup = this.lookupRepo.create(data);
        return this.lookupRepo.save(lookup);
    }
    async updateLookup(id, data) {
        await this.lookupRepo.update(id, data);
        return this.lookupRepo.findOneBy({ id });
    }
    async deleteLookup(id) {
        return this.lookupRepo.delete(id);
    }
};
exports.MasterService = MasterService;
exports.MasterService = MasterService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(brand_entity_1.Brand)),
    __param(1, (0, typeorm_1.InjectRepository)(vendor_entity_1.Vendor)),
    __param(2, (0, typeorm_1.InjectRepository)(lookup_entity_1.Lookup)),
    __param(3, (0, typeorm_1.InjectRepository)(license_plan_entity_1.LicensePlan)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], MasterService);
//# sourceMappingURL=master.service.js.map