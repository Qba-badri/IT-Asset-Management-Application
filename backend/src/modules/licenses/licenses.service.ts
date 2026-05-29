import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { License } from '../../entities/license.entity';
import { LicenseAssignment } from '../../entities/license-assignment.entity';
import { LicenseRenewal } from '../../entities/license-renewal.entity';
import { LicenseHistory, LicenseAction } from '../../entities/license-history.entity';
import {
  RenewLicenseDto,
  AdjustSeatsDto,
} from './dto/license.dto';
import { parse } from 'csv-parse/sync';

@Injectable()
export class LicensesService {
  constructor(
    @InjectRepository(License)
    private readonly licenseRepository: Repository<License>,
    @InjectRepository(LicenseAssignment)
    private readonly assignmentRepository: Repository<LicenseAssignment>,
    @InjectRepository(LicenseRenewal)
    private readonly renewalRepository: Repository<LicenseRenewal>,
    @InjectRepository(LicenseHistory)
    private readonly historyRepository: Repository<LicenseHistory>,
  ) { }

  private async logHistory(
    licenseId: number,
    action: LicenseAction,
    performedById?: number,
    assignedToId?: number,
    notes?: string,
  ) {
    const log = this.historyRepository.create({
      licenseId,
      action,
      performedById,
      assignedToId,
      notes,
    });
    return this.historyRepository.save(log);
  }

  async findAll(user?: any): Promise<License[]> {
    const query = this.licenseRepository.createQueryBuilder('license')
      .leftJoinAndSelect('license.vendorObj', 'vendorObj')
      .leftJoinAndSelect('license.licensePlan', 'licensePlan')
      .leftJoinAndSelect('license.assignments', 'assignments')
      .orderBy('license.createdAt', 'DESC');

    // RBAC: If not Admin, only show licenses assigned to the user
    if (user && user.role?.name !== 'Admin') {
      query.innerJoin('license.assignments', 'userAssignment', 'userAssignment.userId = :userId', { userId: user.id });
    }

    return query.getMany();
  }

  async findUserAssignments(userId: number): Promise<LicenseAssignment[]> {
    return this.assignmentRepository.find({
      where: { userId },
      relations: ['license', 'license.vendorObj', 'license.licensePlan'],
    });
  }

  async assignLicense(
    licenseId: number,
    userId: number,
    notes?: string,
  ): Promise<LicenseAssignment> {
    const license = await this.findOne(licenseId);

    // Check if license is expired
    if (license.expiryDate) {
      const expiryDate = new Date(license.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expiryDate.setHours(0, 0, 0, 0);

      if (expiryDate < today) {
        throw new BadRequestException(
          'Cannot assign expired license. Please renew the license first.',
        );
      }
    }

    // Check if user already has this license assigned
    const existingAssignment = await this.assignmentRepository.findOne({
      where: { licenseId, userId },
    });

    if (existingAssignment) {
      throw new BadRequestException(
        'This license is already assigned to this user',
      );
    }

    // Check if seats available
    if (Number(license.usedSeats) >= Number(license.totalSeats)) {
      throw new BadRequestException('No available seats for this license');
    }

    const assignment = this.assignmentRepository.create({
      licenseId,
      userId,
      notes,
    });

    // Increment used seats
    license.usedSeats = Number(license.usedSeats) + 1;
    await this.licenseRepository.save(license);

    const savedAssignment = await this.assignmentRepository.save(assignment);
    await this.logHistory(licenseId, LicenseAction.ASSIGNED, undefined, userId, notes);
    return savedAssignment;
  }

  async unassignLicense(assignmentId: number, reason?: string): Promise<void> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: ['license'],
    });

    if (!assignment) throw new NotFoundException('Assignment not found');

    const license = assignment.license;
    if (license) {
      license.usedSeats = Math.max(0, Number(license.usedSeats) - 1);
      await this.licenseRepository.save(license);
      await this.logHistory(license.id, LicenseAction.UNASSIGNED, undefined, assignment.userId, reason ? `Reason: ${reason}` : 'No reason provided');
    }

    await this.assignmentRepository.delete(assignmentId);
  }

  async findOne(id: number, user?: any): Promise<License> {
    const license = await this.licenseRepository.findOne({
      where: { id },
      relations: ['assignments', 'assignments.user', 'renewals', 'vendorObj', 'licensePlan'],
    } as any);
    if (!license) {
      throw new NotFoundException(`License with ID ${id} not found`);
    }

    if (user && user.role?.name !== 'Admin') {
      const isAssigned = license.assignments?.some((a: any) => a.userId === user.id);
      if (!isAssigned) {
        throw new ForbiddenException('Access denied to this license');
      }
    }

    return license;
  }

  async create(data: Partial<License>): Promise<License> {
    // Determine next renewal date if not provided
    if (!data.nextRenewalDate && data.expiryDate) {
      data.nextRenewalDate = data.expiryDate;
    }
    const license = this.licenseRepository.create(data);
    const saved = await this.licenseRepository.save(license);
    await this.logHistory(saved.id, LicenseAction.CREATED, undefined, undefined, 'License record created');
    return saved;
  }

  async update(id: number, data: Partial<License>): Promise<License> {
    const license = await this.findOne(id);
    Object.assign(license, data);
    return this.licenseRepository.save(license);
  }

  async delete(id: number): Promise<void> {
    // Prevent deletion if license has active assignments
    const license = await this.licenseRepository.findOne({ where: { id }, relations: ['assignments'] } as any);
    if (!license) {
      throw new NotFoundException(`License with ID ${id} not found`);
    }

    if (license.assignments && license.assignments.length > 0) {
      throw new BadRequestException('Cannot delete license while seats are assigned. Unassign all seats before deleting.');
    }

    const result = await this.licenseRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`License with ID ${id} not found`);
    }
  }

  // Renewal Logic
  async renewLicense(id: number, dto: RenewLicenseDto, userId?: number): Promise<License> {
    const license = await this.findOne(id);

    // Create renewal record
    const renewal = this.renewalRepository.create({
      licenseId: id,
      oldExpiryDate: license.expiryDate,
      newExpiryDate: dto.newExpiryDate,
      costChange: dto.costChange,
      remarks: dto.remarks,
      renewedBy: userId
    });
    await this.renewalRepository.save(renewal);

    // Update license
    license.expiryDate = dto.newExpiryDate;
    // Update next renewal date to match new expiry
    license.nextRenewalDate = dto.newExpiryDate;

    await this.licenseRepository.save(license);
    await this.logHistory(id, LicenseAction.RENEWED, userId, undefined, dto.remarks);
    return license;
  }

  async adjustSeats(id: number, dto: AdjustSeatsDto, userId?: number): Promise<License> {
    const license = await this.findOne(id);
    const oldTotal = license.totalSeats;
    const oldUsed = license.usedSeats;

    // Update total seats if provided
    license.totalSeats = dto.seats;

    // Update used seats if provided (manual override)
    if (dto.usedSeats !== undefined) {
      license.usedSeats = dto.usedSeats;
    }

    // Validation
    if (license.usedSeats > license.totalSeats) {
      throw new BadRequestException(`Used seats (${license.usedSeats}) cannot exceed total seats (${license.totalSeats})`);
    }

    if (license.usedSeats < 0) {
      throw new BadRequestException('Used seats cannot be negative');
    }

    // Recalculate Total Cost if unitPrice exists
    if (license.unitPrice) {
      license.totalCost = Number(license.unitPrice) * license.totalSeats;
    }

    await this.licenseRepository.save(license);

    let adjustmentNote = `Seat adjustment: Total (${oldTotal} -> ${license.totalSeats})`;
    if (dto.usedSeats !== undefined) {
      adjustmentNote += `, Used (${oldUsed} -> ${license.usedSeats})`;
    }
    adjustmentNote += `. Reason: ${dto.reason || 'Not specified'}`;

    await this.logHistory(
      id,
      LicenseAction.SEAT_ADJUSTMENT,
      userId,
      undefined,
      adjustmentNote
    );
    return license;
  }

  async findHistory(licenseId: number, user?: any): Promise<LicenseHistory[]> {
    await this.findOne(licenseId, user); // Verify existence and permission
    return this.historyRepository.find({
      where: { licenseId },
      relations: ['performedBy', 'assignedTo'],
      order: { actionDate: 'DESC' },
    });
  }

  async getStatistics(user?: any) {
    const licenses = await this.findAll(user);
    const total = licenses.length;
    const expiringSoonCount = licenses.filter((l) => {
      if (!l.expiryDate) return false;
      const diff = Math.ceil(
        (new Date(l.expiryDate).getTime() - Date.now()) / 86400000,
      );
      return diff > 0 && diff <= 30;
    }).length;

    const totalSeats = licenses.reduce((sum, l) => sum + (l.totalSeats || 0), 0);
    const usedSeats = licenses.reduce((sum, l) => sum + (l.usedSeats || 0), 0);

    return {
      total,
      expiringSoon: expiringSoonCount,
      utilization: totalSeats > 0 ? (usedSeats / totalSeats) * 100 : 0,
      totalSeats,
      usedSeats,
    };
  }

  async validateImport(fileBuffer: Buffer): Promise<{ data: any[] }> {
    const records = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const mapping: Record<string, string> = {
      'Software Name': 'softwareName',
      'Vendor': 'vendor',
      'Category': 'category',
      'Type': 'type',
      'Plan Name': 'planName',
      'Product Key': 'productKey',
      'Contract ID': 'contractId',
      'Tenant ID': 'tenantId',
      'Total Seats': 'totalSeats',
      'Used Seats': 'usedSeats',
      'Unit Price': 'unitPrice',
      'Currency': 'currency',
      'Billing Frequency': 'billingFrequency',
      'Purchase Date': 'purchaseDate',
      'Expiry Date': 'expiryDate',
      'Notes': 'notes',
    };

    const validatedData = [];
    for (const record of records) {
      const mappedData: any = {};
      Object.keys(record).forEach(key => {
        const targetKey = mapping[key] || key;
        mappedData[targetKey] = record[key];
      });

      const errors = [];
      if (!mappedData.softwareName) errors.push('Software Name is required');

      validatedData.push({
        ...mappedData,
        _errors: errors,
        _isValid: errors.length === 0
      });
    }

    return { data: validatedData };
  }

  async bulkCreate(licenses: any[], userId?: number): Promise<{ success: number; failed: number; errors: any[] }> {
    let success = 0;
    let failed = 0;
    const errors = [];

    for (const data of licenses) {
      try {
        await this.create(data);
        success++;
      } catch (err) {
        failed++;
        errors.push({
          name: data.softwareName || 'Unknown',
          message: err.message,
        });
      }
    }

    return { success, failed, errors };
  }
}
