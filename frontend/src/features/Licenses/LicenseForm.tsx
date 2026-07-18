import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { DialogFooter } from '../../components/ui/dialog';
import { Switch } from '../../components/ui/switch';
import { License } from '../../services/licenseService';
import { masterService, Vendor, LicensePlan, Lookup } from '../../services/masterService';
import { Loader2, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip"
import { cn } from "../../lib/utils"
import { useCurrency } from '../../context/CurrencyContext';

interface LicenseFormProps {
    initialData?: Partial<License>;
    onSubmit: (data: Partial<License>) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

const renderInfoTooltip = (text: string) => (
    <TooltipProvider>
        <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground ml-1 cursor-help shrink-0" />
            </TooltipTrigger>
            <TooltipContent>
                <p className="max-w-xs text-xs">{text}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
);

const FormField: React.FC<{
    label: string;
    field?: keyof License;
    required?: boolean;
    tooltip?: string;
    error?: string;
    children: React.ReactNode;
    className?: string;
}> = ({ label, required, tooltip, error, children, className }) => (
    <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between h-5">
            <div className="flex items-center">
                <Label className={error ? "text-destructive" : ""}>
                    {label} {required && <span className="text-destructive">*</span>}
                </Label>
                {tooltip && renderInfoTooltip(tooltip)}
            </div>
        </div>
        {children}
        {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
);

const inputClasses = (errors: Record<string, string>, field?: keyof License) => cn(
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    field && errors[field] && "border-destructive focus-visible:ring-destructive"
);

const selectClasses = (errors: Record<string, string>, field?: keyof License) => cn(
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    field && errors[field] && "border-destructive focus-visible:ring-destructive"
);

const LicenseForm: React.FC<LicenseFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting = false }) => {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [plans, setPlans] = useState<LicensePlan[]>([]);
    const [lookups, setLookups] = useState<Record<string, Lookup[]>>({});
    const [loadingMasters, setLoadingMasters] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { availableCurrencies, defaultCurrency, symbolFor, convertBetween, formatInCurrency } = useCurrency();

    const [formData, setFormData] = useState<Partial<License>>({
        softwareName: '',
        vendorId: undefined,
        licensePlanId: undefined,
        category: 'saas' as any,
        type: 'user' as any,
        productKey: '',
        contractId: '',
        tenantId: '',
        totalSeats: 1,
        usedSeats: 0,
        cloudMode: true,
        unitPrice: 0,
        currency: defaultCurrency,
        billingFrequency: 'monthly' as any,
        commitmentTerm: '',
        purchaseDate: '',
        expiryDate: '',
        nextRenewalDate: '',
        noticePeriodDays: 30,
        renewalStatus: 'active',
        complianceRisk: 'low',
        notes: '',
        ...initialData
    });

    // Load Master Data
    useEffect(() => {
        const loadMasters = async () => {
            try {
                const [vData, lData, pData] = await Promise.all([
                    masterService.getVendors(),
                    masterService.getLookups(),
                    masterService.getPlans()
                ]);
                setVendors(vData);
                setPlans(pData);

                // Group Lookups by Type
                const groupedLookups: Record<string, Lookup[]> = {};
                lData.forEach(l => {
                    if (!groupedLookups[l.type]) groupedLookups[l.type] = [];
                    groupedLookups[l.type].push(l);
                });
                setLookups(groupedLookups);
            } catch (err) {
                console.error("Failed to load master data", err);
            } finally {
                setLoadingMasters(false);
            }
        };
        loadMasters();
    }, []);

    // Set initial data
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    // New licenses default to the org-wide default currency once it has loaded
    useEffect(() => {
        if (!initialData?.currency) {
            setFormData(prev => ({ ...prev, currency: defaultCurrency }));
        }
    }, [defaultCurrency, initialData]);

    // Original amount converted into the org default currency, shown when they differ
    const renderDefaultCurrencyHint = (amount?: number) => {
        const code = formData.currency as string;
        if (!amount || !code || code === defaultCurrency) return null;
        return (
            <p className="text-xs text-muted-foreground mt-1">
                ≈ {formatInCurrency(convertBetween(amount, code, defaultCurrency), defaultCurrency)} {defaultCurrency}
            </p>
        );
    };

    const handleChange = (field: keyof License, value: any) => {
        setFormData(prev => {
            const next = { ...prev, [field]: value };

            // Auto-calculate Total Cost or Unit Price
            if (field === 'unitPrice' || field === 'totalSeats') {
                const up = field === 'unitPrice' ? value : next.unitPrice;
                const ts = field === 'totalSeats' ? value : next.totalSeats;
                next.totalCost = (Number(up) || 0) * (Number(ts) || 1);
            } else if (field === 'totalCost') {
                const ts = next.totalSeats || 1;
                next.unitPrice = Number(value) / ts;
            }

            return next;
        });

        // Clear error when field is modified
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }

        // specific logic for Plan change (Auto-fill)
        if (field === 'licensePlanId') {
            const planId = parseInt(value);
            const plan = plans.find(p => p.id === planId);
            if (plan) {
                const vendor = vendors.find(v => v.id === plan.vendorId);
                setFormData(prev => ({
                    ...prev,
                    licensePlanId: planId,
                    planName: plan.name,
                    softwareName: plan.productFamily || plan.name, // Software Name defaults to Product Family
                    vendorId: plan.vendorId,
                    vendor: vendor?.name || '',
                    category: plan.category || prev.category,
                    type: plan.type || prev.type
                }));
            } else {
                setFormData(prev => ({ ...prev, licensePlanId: undefined, planName: '' }));
            }
        }

        // specific logic for Vendor change
        if (field === 'vendorId') {
            const id = parseInt(value);
            const vendor = vendors.find(v => v.id === id);
            setFormData(prev => ({
                ...prev,
                vendorId: id,
                vendor: vendor?.name === 'Other' ? '' : vendor?.name || '',
            }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.softwareName?.trim()) newErrors.softwareName = "Software name is required";
        if (!formData.vendorId) newErrors.vendorId = "Vendor is required";

        // Check for custom vendor name if 'Other' is selected
        const selectedVendor = vendors.find(v => v.id === formData.vendorId);
        if (selectedVendor?.name === 'Other' && !formData.vendor?.trim()) {
            newErrors.vendor = "Custom vendor name is required";
        }

        if (!formData.totalSeats || formData.totalSeats < 1) newErrors.totalSeats = "Total seats must be at least 1";

        // Mandatory Dates
        if (!formData.purchaseDate) newErrors.purchaseDate = "Purchase date is required";
        if (!formData.expiryDate) newErrors.expiryDate = "Expiry date is required";
        if (!formData.nextRenewalDate) newErrors.nextRenewalDate = "Next renewal date is required";

        if (formData.purchaseDate && formData.expiryDate) {
            if (new Date(formData.expiryDate) <= new Date(formData.purchaseDate)) {
                newErrors.expiryDate = "Expiry date must be after purchase date";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };



    if (loadingMasters) {
        return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    // Group Plans by Product Family. Inactive plans are excluded from new
    // selection; a plan already on this license stays listed.
    const groupedPlans = plans
        .filter(plan => plan.isActive !== false || plan.id === formData.licensePlanId)
        .reduce((acc, plan) => {
            const family = plan.productFamily || 'Other';
            if (!acc[family]) acc[family] = [];
            acc[family].push(plan);
            return acc;
        }, {} as Record<string, LicensePlan[]>);

    return (
        <form onSubmit={handleSubmit} className="space-y-8 pt-4">

            {/* General Information Section */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 pb-2 border-b">General Information</h3>

                    <FormField label="Plan / Product" field="licensePlanId" tooltip="Select a plan/product to auto-fill common details.">
                        <select
                            className={selectClasses(errors, 'licensePlanId')}
                            value={formData.licensePlanId || ''}
                            onChange={(e) => handleChange('licensePlanId', e.target.value)}
                        >
                            <option value="">Search or Select Plan...</option>
                            {Object.entries(groupedPlans).map(([family, familyPlans]) => (
                                <optgroup key={family} label={family}>
                                    {familyPlans.map(p => (
                                        <option key={p.id} value={p.id}>{p.isActive === false ? `${p.name} (Inactive)` : p.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Software Name" field="softwareName" required error={errors.softwareName}>
                        <Input
                            className={inputClasses(errors, 'softwareName')}
                            value={formData.softwareName || ''}
                            onChange={e => handleChange('softwareName', e.target.value)}
                            placeholder="e.g. Adobe Creative Cloud"
                        />
                    </FormField>

                    <FormField label="Vendor" field="vendorId" required error={errors.vendorId}>
                        <select
                            className={selectClasses(errors, 'vendorId')}
                            value={formData.vendorId || ''}
                            onChange={(e) => handleChange('vendorId', e.target.value)}
                        >
                            <option value="">Select vendor...</option>
                            {vendors
                                .filter((vendor) => vendor.isActive !== false || vendor.id === formData.vendorId)
                                .map((vendor) => (
                                <option key={vendor.id} value={vendor.id}>
                                    {vendor.isActive === false ? `${vendor.name} (Inactive)` : vendor.name}
                                </option>
                            ))}
                        </select>
                    </FormField>
                </div>

                {vendors.find(v => v.id === formData.vendorId)?.name === 'Other' && (
                    <FormField label="Custom Vendor Name" field="vendor" required error={errors.vendor}>
                        <Input
                            className={inputClasses(errors, 'vendor')}
                            value={formData.vendor || ''}
                            onChange={e => handleChange('vendor', e.target.value)}
                            placeholder="Enter vendor name"
                        />
                    </FormField>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Category" field="category" required error={errors.category}>
                        <select
                            className={selectClasses(errors, 'category')}
                            value={formData.category as string || ''}
                            onChange={e => handleChange('category', e.target.value)}
                        >
                            <option value="">Select...</option>
                            {lookups['LICENSE_CATEGORY']?.map(opt => (
                                <option key={opt.id} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="Licensing Model" field="type" required error={errors.type}>
                        <select
                            className={selectClasses(errors, 'type')}
                            value={formData.type as string || ''}
                            onChange={e => handleChange('type', e.target.value)}
                        >
                            <option value="">Select...</option>
                            {lookups['LICENSE_TYPE']?.map(opt => (
                                <option key={opt.id} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {formData.type && lookups['LICENSE_TYPE']?.find(l => l.value === formData.type)?.description && (
                            <p className="text-[11px] text-muted-foreground italic mt-1 px-1">
                                {lookups['LICENSE_TYPE'].find(l => l.value === formData.type)?.description}
                            </p>
                        )}
                    </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Product Key" field="productKey">
                        <Input
                            value={formData.productKey || ''}
                            onChange={e => handleChange('productKey', e.target.value)}
                            className={cn(inputClasses(errors, 'productKey'), "font-mono")}
                            placeholder="XXXX-XXXX-XXXX-XXXX"
                        />
                    </FormField>
                    <FormField label="Contract / Agreement ID" field="contractId">
                        <Input
                            value={formData.contractId || ''}
                            onChange={e => handleChange('contractId', e.target.value)}
                            className={inputClasses(errors, 'contractId')}
                            placeholder="Contract #12345"
                        />
                    </FormField>
                </div>

                {['online', 'saas_sub', 'saas_usage'].includes(formData.category as string) && (
                    <FormField label="Tenant / Account ID" field="tenantId">
                        <Input
                            className={inputClasses(errors, 'tenantId')}
                            value={formData.tenantId || ''}
                            onChange={e => handleChange('tenantId', e.target.value)}
                            placeholder="AWS Account ID / Tenant ID"
                        />
                    </FormField>
                )}

                <div className="flex items-center space-x-2 pt-2">
                    <Switch id="cloud-mode" checked={formData.cloudMode} onCheckedChange={(checked) => handleChange('cloudMode', checked)} />
                    <Label htmlFor="cloud-mode" className="cursor-pointer font-medium">Run in Cloud Mode</Label>
                    {renderInfoTooltip("Enable if this software is hosted in the cloud (e.g. SaaS, PaaS).")}
                </div>
            </div>

            <div className="space-y-6">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 pb-2 border-b">Coverage & Usage</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Total Seats" field="totalSeats" required error={errors.totalSeats} tooltip="The total number of licenses purchased.">
                        <Input
                            type="number"
                            min="1"
                            className={inputClasses(errors, 'totalSeats')}
                            value={formData.totalSeats ?? ''}
                            onChange={e => handleChange('totalSeats', e.target.value === '' ? undefined : parseInt(e.target.value))}
                        />
                    </FormField>
                    <FormField label="Used Seats" field="usedSeats" tooltip="Seats currently assigned to users or devices.">
                        <div className="relative">
                            <Input type="number" min="0" readOnly className="bg-muted h-10 w-full" value={formData.usedSeats} />
                            <p className="text-[10px] text-muted-foreground mt-1 absolute -bottom-4 left-0">Updated automatically via assignments</p>
                        </div>
                    </FormField>
                </div>
            </div>

            <div className="space-y-6">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 pb-2 border-b">Billing & Costs</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField label="Unit Price" field="unitPrice">
                        <Input
                            type="number"
                            step="0.01"
                            className={inputClasses(errors, 'unitPrice')}
                            value={formData.unitPrice ?? ''}
                            onChange={e => handleChange('unitPrice', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        />
                        {renderDefaultCurrencyHint(formData.unitPrice)}
                    </FormField>

                    <FormField label="Currency" field="currency">
                        <select
                            className={selectClasses(errors, 'currency')}
                            value={formData.currency as string || ''}
                            onChange={e => handleChange('currency', e.target.value)}
                        >
                            <option value="">Select...</option>
                            {availableCurrencies.map(c => (
                                <option key={c.code} value={c.code}>{c.code}</option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="Frequency" field="billingFrequency">
                        <select
                            className={selectClasses(errors, 'billingFrequency')}
                            value={formData.billingFrequency as string || ''}
                            onChange={e => handleChange('billingFrequency', e.target.value)}
                        >
                            <option value="">Select...</option>
                            {lookups['BILLING_FREQUENCY']?.map(opt => (
                                <option key={opt.id} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Commitment Term" field="commitmentTerm" tooltip="Duration of the contract commitment.">
                        <select
                            className={selectClasses(errors, 'commitmentTerm')}
                            value={formData.commitmentTerm as string || ''}
                            onChange={e => handleChange('commitmentTerm', e.target.value)}
                        >
                            <option value="">Select...</option>
                            {lookups['COMMITMENT_TERM']?.map(opt => (
                                <option key={opt.id} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="Total Cost" field="totalCost">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                                {symbolFor((formData.currency as string) || defaultCurrency)}
                            </span>
                            <Input
                                type="number"
                                step="0.01"
                                className={cn(inputClasses(errors, 'totalCost'), "pl-8")}
                                value={formData.totalCost ?? ''}
                                onChange={e => handleChange('totalCost', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                            />
                        </div>
                        {renderDefaultCurrencyHint(formData.totalCost)}
                    </FormField>
                </div>
            </div>

            <div className="space-y-6">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 pb-2 border-b">Dates & Status</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Purchase / Start Date" field="purchaseDate" required error={errors.purchaseDate}>
                        <Input
                            type="date"
                            className={inputClasses(errors, 'purchaseDate')}
                            value={formData.purchaseDate ? new Date(formData.purchaseDate).toISOString().split('T')[0] : ''}
                            onChange={e => handleChange('purchaseDate', e.target.value)}
                        />
                    </FormField>
                    <FormField label="Expiry Date" field="expiryDate" required error={errors.expiryDate}>
                        <Input
                            className={inputClasses(errors, 'expiryDate')}
                            type="date"
                            value={formData.expiryDate ? new Date(formData.expiryDate).toISOString().split('T')[0] : ''}
                            onChange={e => handleChange('expiryDate', e.target.value)}
                        />
                    </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Next Renewal Date" field="nextRenewalDate" required error={errors.nextRenewalDate}>
                        <Input
                            type="date"
                            className={inputClasses(errors, 'nextRenewalDate')}
                            value={formData.nextRenewalDate ? new Date(formData.nextRenewalDate).toISOString().split('T')[0] : ''}
                            onChange={e => handleChange('nextRenewalDate', e.target.value)}
                        />
                    </FormField>
                    <FormField label="Notice Period" field="noticePeriodDays" tooltip="Days before expiry to receive alerts.">
                        <select
                            className={selectClasses(errors, 'noticePeriodDays')}
                            value={formData.noticePeriodDays as any || ''}
                            onChange={e => handleChange('noticePeriodDays', e.target.value)}
                        >
                            <option value="">Select...</option>
                            {lookups['NOTICE_PERIOD']?.map(opt => (
                                <option key={opt.id} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Renewal Status" field="renewalStatus">
                        <select
                            className={selectClasses(errors, 'renewalStatus')}
                            value={formData.renewalStatus as any || ''}
                            onChange={e => handleChange('renewalStatus', e.target.value)}
                        >
                            {lookups['RENEWAL_STATUS']?.map(opt => (
                                <option key={opt.id} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="Compliance Risk" field="complianceRisk" tooltip="Risk level of being non-compliant.">
                        <select
                            className={selectClasses(errors, 'complianceRisk')}
                            value={formData.complianceRisk as any || ''}
                            onChange={e => handleChange('complianceRisk', e.target.value)}
                        >
                            <option value="">Select...</option>
                            {lookups['COMPLIANCE_RISK']?.map(opt => (
                                <option key={opt.id} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </FormField>
                </div>
            </div>

            <div className="space-y-2 pt-4">
                <Label>Notes</Label>
                <Textarea
                    className="min-h-[100px] resize-none focus-visible:ring-offset-2"
                    value={formData.notes || ''}
                    onChange={e => handleChange('notes', e.target.value)}
                    placeholder="Additional details about this license..."
                />
            </div>

            <DialogFooter className="pt-8 mt-8 border-t gap-2 sm:gap-0">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Please wait
                        </>
                    ) : (initialData?.id ? 'Update License' : 'Create License')}
                </Button>
            </DialogFooter>
        </form>
    );
};

export default LicenseForm;
