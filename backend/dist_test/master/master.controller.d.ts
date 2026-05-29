import { MasterService } from './master.service';
export declare class MasterController {
    private readonly masterService;
    constructor(masterService: MasterService);
    getBrands(): Promise<import("../entities/brand.entity").Brand[]>;
    createBrand(data: any): Promise<import("../entities/brand.entity").Brand[]>;
    updateBrand(id: number, data: any): Promise<import("../entities/brand.entity").Brand>;
    deleteBrand(id: number): Promise<import("typeorm").DeleteResult>;
    getVendors(): Promise<import("../entities/vendor.entity").Vendor[]>;
    createVendor(data: any): Promise<import("../entities/vendor.entity").Vendor[]>;
    updateVendor(id: number, data: any): Promise<import("../entities/vendor.entity").Vendor>;
    deleteVendor(id: number): Promise<import("typeorm").DeleteResult>;
    getVendorPlans(id: number): Promise<import("../entities/license-plan.entity").LicensePlan[]>;
    getPlans(): Promise<import("../entities/license-plan.entity").LicensePlan[]>;
    createPlan(data: any): Promise<import("../entities/license-plan.entity").LicensePlan[]>;
    updatePlan(id: number, data: any): Promise<import("../entities/license-plan.entity").LicensePlan>;
    deletePlan(id: number): Promise<import("typeorm").DeleteResult>;
    getLookups(type?: string): Promise<import("../entities/lookup.entity").Lookup[]>;
    createLookup(data: any): Promise<import("../entities/lookup.entity").Lookup[]>;
    updateLookup(id: number, data: any): Promise<import("../entities/lookup.entity").Lookup>;
    deleteLookup(id: number): Promise<import("typeorm").DeleteResult>;
}
