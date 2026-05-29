import { Repository } from 'typeorm';
import { License } from '../entities/license.entity';
import { LicenseAssignment } from '../entities/license-assignment.entity';
import { LicenseRenewal } from '../entities/license-renewal.entity';
import { LicenseHistory } from '../entities/license-history.entity';
import { RenewLicenseDto, AdjustSeatsDto } from './dto/license.dto';
export declare class LicensesService {
    private readonly licenseRepository;
    private readonly assignmentRepository;
    private readonly renewalRepository;
    private readonly historyRepository;
    constructor(licenseRepository: Repository<License>, assignmentRepository: Repository<LicenseAssignment>, renewalRepository: Repository<LicenseRenewal>, historyRepository: Repository<LicenseHistory>);
    private logHistory;
    findAll(): Promise<License[]>;
    findUserAssignments(userId: number): Promise<LicenseAssignment[]>;
    assignLicense(licenseId: number, userId: number, notes?: string): Promise<LicenseAssignment>;
    unassignLicense(assignmentId: number, reason?: string): Promise<void>;
    findOne(id: number): Promise<License>;
    create(data: Partial<License>): Promise<License>;
    update(id: number, data: Partial<License>): Promise<License>;
    delete(id: number): Promise<void>;
    renewLicense(id: number, dto: RenewLicenseDto, userId?: number): Promise<License>;
    adjustSeats(id: number, dto: AdjustSeatsDto, userId?: number): Promise<License>;
    findHistory(licenseId: number): Promise<LicenseHistory[]>;
    getStatistics(): Promise<{
        total: number;
        totalSeats: number;
        usedSeats: number;
        availableSeats: number;
    }>;
}
