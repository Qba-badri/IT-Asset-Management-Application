import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LicensesService } from './licenses.service';
import { License } from '../../entities/license.entity';
import { LicenseAssignment } from '../../entities/license-assignment.entity';
import { LicenseRenewal } from '../../entities/license-renewal.entity';
import { LicenseHistory } from '../../entities/license-history.entity';
import { NotificationsService } from '../notifications/notifications.service';

describe('LicensesService — renewal (F-16 regression coverage)', () => {
  let service: LicensesService;

  const licenseRepository = {
    update: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const assignmentRepository = { count: jest.fn() };
  const renewalRepository = {
    create: jest.fn((r) => r),
    save: jest.fn(async (r) => ({ id: 99, ...r })),
  };
  const historyRepository = {
    create: jest.fn((h) => h),
    save: jest.fn(async (h) => h),
  };
  const notificationsService = {
    notifyAssignment: jest.fn(),
    notifyStatusChange: jest.fn(),
    notifyLowStock: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        LicensesService,
        { provide: getRepositoryToken(License), useValue: licenseRepository },
        {
          provide: getRepositoryToken(LicenseAssignment),
          useValue: assignmentRepository,
        },
        {
          provide: getRepositoryToken(LicenseRenewal),
          useValue: renewalRepository,
        },
        {
          provide: getRepositoryToken(LicenseHistory),
          useValue: historyRepository,
        },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();
    service = moduleRef.get(LicensesService);
  });

  const license = (overrides: Partial<License> = {}) =>
    ({
      id: 5,
      name: 'Office 365 E3',
      expiryDate: new Date('2026-01-31'),
      totalSeats: 10,
      usedSeats: 4,
      totalCost: 1000,
      unitPrice: 100,
      // relations loaded by findOne — the source of the old 500 error
      assignments: [{ id: 1, userId: 2 }],
      renewals: [{ id: 1 }],
      ...overrides,
    }) as unknown as License;

  const renew = (costChange: number, lic = license()) => {
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValueOnce(lic) // initial load
      .mockResolvedValueOnce(lic); // reload for return value
    return service.renewLicense(
      5,
      {
        newExpiryDate: new Date('2027-01-31'),
        costChange,
        remarks: 'annual renewal',
      },
      7,
    );
  };

  it('renewal with unchanged cost keeps total and unit price', async () => {
    await renew(0);
    expect(licenseRepository.update).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ totalCost: 1000, unitPrice: 100 }),
    );
  });

  it('applies a positive cost change to the total and recalculates unit price', async () => {
    await renew(250);
    expect(licenseRepository.update).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ totalCost: 1250, unitPrice: 125 }),
    );
  });

  it('applies a negative cost change and never goes below zero', async () => {
    await renew(-2000);
    expect(licenseRepository.update).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ totalCost: 0, unitPrice: 0 }),
    );
  });

  it('derives total from unit price when totalCost is missing', async () => {
    await renew(0, license({ totalCost: null, unitPrice: 50 } as any));
    expect(licenseRepository.update).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ totalCost: 500, unitPrice: 50 }),
    );
  });

  it('uses update() with changed columns only — never save() on the relation-loaded entity (7620232 regression)', async () => {
    // Saving the relation-loaded entity made TypeORM diff license.renewals and
    // null out license_id on existing rows → 500. Guard against reintroduction.
    await renew(100);
    expect(licenseRepository.update).toHaveBeenCalledTimes(1);
    const updatePayload = licenseRepository.update.mock.calls[0][1];
    expect(updatePayload).not.toHaveProperty('renewals');
    expect(updatePayload).not.toHaveProperty('assignments');
    expect((licenseRepository as any).save).toBeUndefined();
  });

  it('records the renewal row with old and new expiry and the acting user', async () => {
    await renew(100);
    expect(renewalRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        licenseId: 5,
        costChange: 100,
        renewedBy: 7,
      }),
    );
  });

  it('sets nextRenewalDate to the new expiry', async () => {
    await renew(0);
    expect(licenseRepository.update).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        expiryDate: new Date('2027-01-31'),
        nextRenewalDate: new Date('2027-01-31'),
      }),
    );
  });
});
