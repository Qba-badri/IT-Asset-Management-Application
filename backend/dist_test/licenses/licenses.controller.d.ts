import { LicensesService } from './licenses.service';
import { License } from '../entities/license.entity';
import { CreateLicenseDto, UpdateLicenseDto, AssignLicenseDto, RenewLicenseDto, AdjustSeatsDto } from './dto/license.dto';
export declare class LicensesController {
    private readonly licensesService;
    constructor(licensesService: LicensesService);
    findAll(): Promise<License[]>;
    getStatistics(): Promise<{
        total: number;
        totalSeats: number;
        usedSeats: number;
        availableSeats: number;
    }>;
    findOne(id: number): Promise<License>;
    create(data: CreateLicenseDto): Promise<License>;
    update(id: number, data: UpdateLicenseDto): Promise<License>;
    findByUser(userId: number): Promise<import("../entities/license-assignment.entity").LicenseAssignment[]>;
    assign(id: number, data: AssignLicenseDto): Promise<import("../entities/license-assignment.entity").LicenseAssignment>;
    unassign(id: number, reason?: string): Promise<void>;
    delete(id: number): Promise<void>;
    renew(id: number, data: RenewLicenseDto, req: any): Promise<License>;
    getHistory(id: number): Promise<import("../entities/license-history.entity").LicenseHistory[]>;
    adjustSeats(id: number, data: AdjustSeatsDto, req: any): Promise<License>;
}
