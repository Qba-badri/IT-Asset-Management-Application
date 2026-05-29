import apiClient from './apiClient';
import { Vendor, LicensePlan as MasterLicensePlan } from './masterService';

export enum LicenseType {
    USER = 'user',
    DEVICE = 'device',
    SITE = 'site',
    USAGE = 'usage',
    CONCURRENT = 'concurrent',
}

export enum LicenseCategory {
    SAAS_SUB = 'saas_sub',
    SAAS_USAGE = 'saas_usage',
    ON_PREM_SUB = 'on_prem_sub',
    ON_PREM_PERPETUAL = 'on_prem_perpetual',
    SUPPORT_ONLY = 'support_only',
}

export enum BillingFrequency {
    MONTHLY = 'monthly',
    QUARTERLY = 'quarterly',
    YEARLY = 'yearly',
    ONE_TIME = 'one_time',
}

export interface LicenseAssignment {
    id: number;
    licenseId: number;
    userId: number;
    user?: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
    };
    assignedAt: string;
    notes?: string;
}

export interface LicenseRenewal {
    id: number;
    licenseId: number;
    oldExpiryDate: string;
    newExpiryDate: string;
    costChange: number;
    remarks?: string;
    renewedAt: string;
    renewedBy?: number;
}


export interface LicenseHistory {
    id: number;
    licenseId: number;
    action: 'created' | 'updated' | 'assigned' | 'unassigned' | 'renewed' | 'audited';
    performedById?: number;
    performedBy?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
    assignedToId?: number;
    assignedTo?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
    notes?: string;
    actionDate: string;
}

export interface License {
    id: number;
    softwareName: string;

    vendor?: string; // Legacy
    vendorId?: number;
    vendorObj?: Vendor;

    category: string; // Now string based on lookup
    type: string; // Now string based on lookup

    planName?: string; // Legacy
    licensePlanId?: number;
    licensePlan?: MasterLicensePlan;

    productKey?: string;
    contractId?: string;
    tenantId?: string;

    // Coverage
    totalSeats: number;
    usedSeats: number;
    cloudMode: boolean; // true=cloud, false=on-prem

    // Billing
    unitPrice?: number;
    currency: string;
    billingFrequency: string; // Now string based on lookup
    commitmentTerm?: string;
    purchaseCost?: number; // legacy field kept for compatibility or total upfront
    totalCost?: number;

    // Dates
    purchaseDate?: string;
    expiryDate?: string;
    nextRenewalDate?: string;
    noticePeriodDays: number;

    // Status
    renewalStatus?: string;
    complianceRisk?: string;

    notes?: string;

    createdAt: string;
    updatedAt: string;

    assignments?: LicenseAssignment[];
    renewals?: LicenseRenewal[];
}

export const licenseService = {
    getLicenses: async (): Promise<License[]> => {
        const response = await apiClient.get('/licenses');
        return response.data;
    },

    getLicense: async (id: number): Promise<License> => {
        const response = await apiClient.get(`/licenses/${id}`);
        return response.data;
    },

    getStatistics: async () => {
        const response = await apiClient.get('/licenses/statistics');
        return response.data;
    },

    createLicense: async (data: Partial<License>): Promise<License> => {
        const response = await apiClient.post('/licenses', data);
        return response.data;
    },

    updateLicense: async (id: number, data: Partial<License>): Promise<License> => {
        const response = await apiClient.put(`/licenses/${id}`, data);
        return response.data;
    },

    deleteLicense: async (id: number): Promise<void> => {
        await apiClient.delete(`/licenses/${id}`);
    },

    assignLicense: async (licenseId: number, userId: number, notes?: string): Promise<LicenseAssignment> => {
        const response = await apiClient.post(`/licenses/${licenseId}/assign`, { userId, notes });
        return response.data;
    },

    unassignLicense: async (assignmentId: number, reason?: string): Promise<void> => {
        await apiClient.delete(`/licenses/assignments/${assignmentId}`, { params: { reason } });
    },

    getUserLicenses: async (userId: number): Promise<LicenseAssignment[]> => {
        const response = await apiClient.get(`/licenses/user/${userId}`);
        return response.data;
    },

    renewLicense: async (licenseId: number, data: { newExpiryDate: string; costChange: number; remarks?: string }): Promise<License> => {
        const response = await apiClient.post(`/licenses/${licenseId}/renew`, data);
        return response.data;
    },

    getHistory: async (licenseId: number): Promise<LicenseHistory[]> => {
        const response = await apiClient.get(`/licenses/${licenseId}/history`);
        return response.data;
    },

    adjustSeats: async (licenseId: number, data: { seats: number; reason?: string }): Promise<License> => {
        const response = await apiClient.patch(`/licenses/${licenseId}/adjust-seats`, data);
        return response.data;
    },

    validateImport: async (file: File): Promise<{ data: any[] }> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post<{ data: any[] }>('/licenses/import/validate', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    confirmImport: async (licenses: any[]): Promise<{ success: number; failed: number; errors: any[] }> => {
        const response = await apiClient.post<{ success: number; failed: number; errors: any[] }>('/licenses/import/confirm', { licenses });
        return response.data;
    }
};
