import apiClient from './apiClient';

export interface Vendor {
    id: number;
    name: string;
    contactPerson?: string;
    email?: string;
    isActive: boolean;
}

export interface Brand {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
}

export interface LicensePlan {
    id: number;
    name: string;
    productFamily?: string;
    type?: string;
    category?: string;
    vendorId: number;
    isActive: boolean;
}

export interface Department {
    id: number;
    name: string;
    code: string;
    description?: string;
    isActive: boolean;
}

export interface Location {
    id: number;
    name: string;
    type: string;
    address?: string;
    isActive: boolean;
}

export interface Lookup {
    id: number;
    type: string;
    label: string;
    value: string;
    description?: string;
    sortOrder: number;
    isActive: boolean;
}

export const masterService = {
    // Brands
    async getBrands(): Promise<Brand[]> {
        const response = await apiClient.get<Brand[]>('/masters/brands');
        return response.data;
    },

    async createBrand(data: Partial<Brand>): Promise<Brand> {
        const response = await apiClient.post<Brand>('/masters/brands', data);
        return response.data;
    },

    async updateBrand(id: number, data: Partial<Brand>): Promise<Brand> {
        const response = await apiClient.put<Brand>(`/masters/brands/${id}`, data);
        return response.data;
    },

    async deleteBrand(id: number): Promise<void> {
        await apiClient.delete(`/masters/brands/${id}`);
    },

    // Vendors
    async getVendors(): Promise<Vendor[]> {
        const response = await apiClient.get<Vendor[]>('/masters/vendors');
        return response.data;
    },

    async createVendor(data: Partial<Vendor>): Promise<Vendor> {
        const response = await apiClient.post<Vendor>('/masters/vendors', data);
        return response.data;
    },

    async updateVendor(id: number, data: Partial<Vendor>): Promise<Vendor> {
        const response = await apiClient.put<Vendor>(`/masters/vendors/${id}`, data);
        return response.data;
    },

    async deleteVendor(id: number): Promise<void> {
        await apiClient.delete(`/masters/vendors/${id}`);
    },

    async getVendorPlans(vendorId: number): Promise<LicensePlan[]> {
        const response = await apiClient.get<LicensePlan[]>(`/masters/vendors/${vendorId}/plans`);
        return response.data;
    },

    async getPlans(): Promise<LicensePlan[]> {
        const response = await apiClient.get<LicensePlan[]>('/masters/plans');
        return response.data;
    },

    async createPlan(data: Partial<LicensePlan>): Promise<LicensePlan> {
        const response = await apiClient.post<LicensePlan>('/masters/plans', data);
        return response.data;
    },

    async updatePlan(id: number, data: Partial<LicensePlan>): Promise<LicensePlan> {
        const response = await apiClient.put<LicensePlan>(`/masters/plans/${id}`, data);
        return response.data;
    },

    async deletePlan(id: number): Promise<void> {
        await apiClient.delete(`/masters/plans/${id}`);
    },

    // Departments
    async getDepartments(): Promise<Department[]> {
        const response = await apiClient.get<Department[]>('/api/departments');
        return response.data;
    },

    // Locations
    async getLocations(): Promise<Location[]> {
        const response = await apiClient.get<Location[]>('/api/locations');
        return response.data;
    },

    // Lookups
    async getLookups(type?: string): Promise<Lookup[]> {
        const response = await apiClient.get<Lookup[]>('/masters/lookups', { params: { type } });
        return response.data;
    },

    async createLookup(data: Partial<Lookup>): Promise<Lookup> {
        const response = await apiClient.post<Lookup>('/masters/lookups', data);
        return response.data;
    },

    async updateLookup(id: number, data: Partial<Lookup>): Promise<Lookup> {
        const response = await apiClient.put<Lookup>(`/masters/lookups/${id}`, data);
        return response.data;
    },

    async deleteLookup(id: number): Promise<void> {
        await apiClient.delete(`/masters/lookups/${id}`);
    }
};

export default masterService;
