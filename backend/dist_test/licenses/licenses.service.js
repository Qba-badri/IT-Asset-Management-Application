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
exports.LicensesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const license_entity_1 = require("../entities/license.entity");
const license_assignment_entity_1 = require("../entities/license-assignment.entity");
const license_renewal_entity_1 = require("../entities/license-renewal.entity");
const license_history_entity_1 = require("../entities/license-history.entity");
let LicensesService = class LicensesService {
    constructor(licenseRepository, assignmentRepository, renewalRepository, historyRepository) {
        this.licenseRepository = licenseRepository;
        this.assignmentRepository = assignmentRepository;
        this.renewalRepository = renewalRepository;
        this.historyRepository = historyRepository;
    }
    async logHistory(licenseId, action, performedById, assignedToId, notes) {
        const log = this.historyRepository.create({
            licenseId,
            action,
            performedById,
            assignedToId,
            notes,
        });
        return this.historyRepository.save(log);
    }
    async findAll() {
        return this.licenseRepository.find({
            order: { createdAt: 'DESC' },
            relations: ['vendorObj', 'licensePlan'],
        });
    }
    async findUserAssignments(userId) {
        return this.assignmentRepository.find({
            where: { userId },
            relations: ['license', 'license.vendorObj', 'license.licensePlan'],
        });
    }
    async assignLicense(licenseId, userId, notes) {
        const license = await this.findOne(licenseId);
        if (license.expiryDate) {
            const expiryDate = new Date(license.expiryDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            expiryDate.setHours(0, 0, 0, 0);
            if (expiryDate < today) {
                throw new common_1.BadRequestException('Cannot assign expired license. Please renew the license first.');
            }
        }
        const existingAssignment = await this.assignmentRepository.findOne({
            where: { licenseId, userId },
        });
        if (existingAssignment) {
            throw new common_1.BadRequestException('This license is already assigned to this user');
        }
        if (Number(license.usedSeats) >= Number(license.totalSeats)) {
            throw new common_1.BadRequestException('No available seats for this license');
        }
        const assignment = this.assignmentRepository.create({
            licenseId,
            userId,
            notes,
        });
        license.usedSeats = Number(license.usedSeats) + 1;
        await this.licenseRepository.save(license);
        const savedAssignment = await this.assignmentRepository.save(assignment);
        await this.logHistory(licenseId, license_history_entity_1.LicenseAction.ASSIGNED, undefined, userId, notes);
        return savedAssignment;
    }
    async unassignLicense(assignmentId, reason) {
        const assignment = await this.assignmentRepository.findOne({
            where: { id: assignmentId },
            relations: ['license'],
        });
        if (!assignment)
            throw new common_1.NotFoundException('Assignment not found');
        const license = assignment.license;
        if (license) {
            license.usedSeats = Math.max(0, Number(license.usedSeats) - 1);
            await this.licenseRepository.save(license);
            await this.logHistory(license.id, license_history_entity_1.LicenseAction.UNASSIGNED, undefined, assignment.userId, reason ? `Reason: ${reason}` : 'No reason provided');
        }
        await this.assignmentRepository.delete(assignmentId);
    }
    async findOne(id) {
        const license = await this.licenseRepository.findOne({
            where: { id },
            relations: ['assignments', 'assignments.user', 'renewals', 'vendorObj', 'licensePlan'],
        });
        if (!license) {
            throw new common_1.NotFoundException(`License with ID ${id} not found`);
        }
        return license;
    }
    async create(data) {
        if (!data.nextRenewalDate && data.expiryDate) {
            data.nextRenewalDate = data.expiryDate;
        }
        const license = this.licenseRepository.create(data);
        const saved = await this.licenseRepository.save(license);
        await this.logHistory(saved.id, license_history_entity_1.LicenseAction.CREATED, undefined, undefined, 'License record created');
        return saved;
    }
    async update(id, data) {
        const license = await this.findOne(id);
        Object.assign(license, data);
        return this.licenseRepository.save(license);
    }
    async delete(id) {
        const result = await this.licenseRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`License with ID ${id} not found`);
        }
    }
    async renewLicense(id, dto, userId) {
        const license = await this.findOne(id);
        const renewal = this.renewalRepository.create({
            licenseId: id,
            oldExpiryDate: license.expiryDate,
            newExpiryDate: dto.newExpiryDate,
            costChange: dto.costChange,
            remarks: dto.remarks,
            renewedBy: userId
        });
        await this.renewalRepository.save(renewal);
        license.expiryDate = dto.newExpiryDate;
        license.nextRenewalDate = dto.newExpiryDate;
        await this.licenseRepository.save(license);
        await this.logHistory(id, license_history_entity_1.LicenseAction.RENEWED, userId, undefined, dto.remarks);
        return license;
    }
    async adjustSeats(id, dto, userId) {
        const license = await this.findOne(id);
        const oldTotal = license.totalSeats;
        const oldUsed = license.usedSeats;
        license.totalSeats = dto.seats;
        if (dto.usedSeats !== undefined) {
            license.usedSeats = dto.usedSeats;
        }
        if (license.usedSeats > license.totalSeats) {
            throw new common_1.BadRequestException(`Used seats (${license.usedSeats}) cannot exceed total seats (${license.totalSeats})`);
        }
        if (license.usedSeats < 0) {
            throw new common_1.BadRequestException('Used seats cannot be negative');
        }
        if (license.unitPrice) {
            license.totalCost = Number(license.unitPrice) * license.totalSeats;
        }
        await this.licenseRepository.save(license);
        let adjustmentNote = `Seat adjustment: Total (${oldTotal} -> ${license.totalSeats})`;
        if (dto.usedSeats !== undefined) {
            adjustmentNote += `, Used (${oldUsed} -> ${license.usedSeats})`;
        }
        adjustmentNote += `. Reason: ${dto.reason || 'Not specified'}`;
        await this.logHistory(id, license_history_entity_1.LicenseAction.SEAT_ADJUSTMENT, userId, undefined, adjustmentNote);
        return license;
    }
    async findHistory(licenseId) {
        return this.historyRepository.find({
            where: { licenseId },
            relations: ['performedBy', 'assignedTo'],
            order: { actionDate: 'DESC' },
        });
    }
    async getStatistics() {
        const total = await this.licenseRepository.count();
        const stats = await this.licenseRepository
            .createQueryBuilder('license')
            .select('SUM(CAST(license.totalSeats AS INTEGER))', 'totalSeats')
            .addSelect('SUM(CAST(license.usedSeats AS INTEGER))', 'usedSeats')
            .getRawOne();
        const totalSeats = parseInt(stats.totalSeats || '0', 10);
        const usedSeats = parseInt(stats.usedSeats || '0', 10);
        return {
            total,
            totalSeats,
            usedSeats,
            availableSeats: Math.max(0, totalSeats - usedSeats),
        };
    }
};
exports.LicensesService = LicensesService;
exports.LicensesService = LicensesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(license_entity_1.License)),
    __param(1, (0, typeorm_1.InjectRepository)(license_assignment_entity_1.LicenseAssignment)),
    __param(2, (0, typeorm_1.InjectRepository)(license_renewal_entity_1.LicenseRenewal)),
    __param(3, (0, typeorm_1.InjectRepository)(license_history_entity_1.LicenseHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], LicensesService);
//# sourceMappingURL=licenses.service.js.map