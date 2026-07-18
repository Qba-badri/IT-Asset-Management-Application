import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { MailService } from '../mail/mail.service';
import { User } from '../../entities/user.entity';
import { Asset } from '../../entities/asset.entity';
import { License } from '../../entities/license.entity';
import { NotificationLog } from '../../entities/notification-log.entity';
import {
  NotificationCategory,
  NotificationRecipientConfig,
  RecipientType,
} from '../../entities/notification-recipient-config.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const logRepo = {
    findOne: jest.fn(),
    create: jest.fn((r) => r),
    save: jest.fn(async (r) => r),
  };
  const configRepo = {
    find: jest.fn(),
    create: jest.fn((r) => r),
    save: jest.fn(async (r) => r),
    findOne: jest.fn(),
    remove: jest.fn(),
  };
  const userRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
  };
  const assetRepo = {
    createQueryBuilder: jest.fn(),
  };
  const licenseRepo = {
    createQueryBuilder: jest.fn(),
  };
  const mailService = {
    sendWarrantyExpiryReminder: jest.fn(),
    sendLicenseExpiryReminder: jest.fn(),
    sendLowStockAlert: jest.fn(),
    sendAssignmentEmail: jest.fn(),
    sendStatusChangeEmail: jest.fn(),
    sendGeneric: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(NotificationLog), useValue: logRepo },
        { provide: getRepositoryToken(NotificationRecipientConfig), useValue: configRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Asset), useValue: assetRepo },
        { provide: getRepositoryToken(License), useValue: licenseRepo },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();
    service = moduleRef.get(NotificationsService);
  });

  describe('recipient resolution', () => {
    it('resolves ASSIGNED_USER to the context.assignedUserId email', async () => {
      configRepo.find.mockResolvedValue([
        {
          id: 1,
          notificationType: NotificationCategory.ASSIGNMENT_STATUS_CHANGE,
          recipientType: RecipientType.ASSIGNED_USER,
          isActive: true,
        },
      ]);
      userRepo.findOne.mockResolvedValue({ id: 5, email: 'assignee@example.com' });

      await service.notifyAssignment({
        assignedUserId: 5,
        entityType: 'asset',
        entityName: 'Laptop-001',
        action: 'assigned',
      });

      expect(mailService.sendAssignmentEmail).toHaveBeenCalledWith(
        'assignee@example.com',
        expect.objectContaining({ entityName: 'Laptop-001', action: 'assigned' }),
      );
    });

    it('resolves STATIC_EMAIL to the literal configured address', async () => {
      configRepo.find.mockResolvedValue([
        {
          id: 2,
          notificationType: NotificationCategory.LOW_STOCK,
          recipientType: RecipientType.STATIC_EMAIL,
          recipientValue: 'procurement@example.com',
          isActive: true,
        },
      ]);

      await service.notifyLowStock({
        id: 10,
        name: 'USB Cable',
        availableStock: 2,
        minStockLevel: 5,
      });

      expect(mailService.sendLowStockAlert).toHaveBeenCalledWith(
        'procurement@example.com',
        expect.objectContaining({ itemName: 'USB Cable' }),
      );
    });

    it('resolves USER_ID to that user\'s email', async () => {
      configRepo.find.mockResolvedValue([
        {
          id: 3,
          notificationType: NotificationCategory.LOW_STOCK,
          recipientType: RecipientType.USER_ID,
          recipientValue: '42',
          isActive: true,
        },
      ]);
      userRepo.findOne.mockResolvedValue({ id: 42, email: 'specific-user@example.com' });

      await service.notifyLowStock({
        id: 11,
        name: 'Mouse',
        availableStock: 1,
        minStockLevel: 5,
      });

      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: 42 } });
      expect(mailService.sendLowStockAlert).toHaveBeenCalledWith(
        'specific-user@example.com',
        expect.anything(),
      );
    });

    it('resolves DEPARTMENT_ADMIN to active users in the department whose role name contains "admin"', async () => {
      configRepo.find.mockResolvedValue([
        {
          id: 4,
          notificationType: NotificationCategory.ASSIGNMENT_STATUS_CHANGE,
          recipientType: RecipientType.DEPARTMENT_ADMIN,
          isActive: true,
        },
      ]);
      userRepo.find.mockResolvedValue([
        { id: 1, email: 'dept-admin@example.com', role: { name: 'Department Admin' } },
        { id: 2, email: 'regular@example.com', role: { name: 'Employee' } },
      ]);

      await service.notifyStatusChange({
        departmentId: 7,
        assetTag: 'AST-1',
        assetName: 'Laptop',
        oldStatus: 'AVAILABLE',
        newStatus: 'REPAIR',
      });

      expect(mailService.sendStatusChangeEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendStatusChangeEmail).toHaveBeenCalledWith(
        'dept-admin@example.com',
        expect.anything(),
      );
    });

    it('sends nothing when there are no active recipient configs', async () => {
      configRepo.find.mockResolvedValue([]);

      await service.notifyLowStock({
        id: 12,
        name: 'Keyboard',
        availableStock: 0,
        minStockLevel: 3,
      });

      expect(mailService.sendLowStockAlert).not.toHaveBeenCalled();
    });

    it('one bad recipient does not block sending to the others', async () => {
      configRepo.find.mockResolvedValue([
        {
          id: 5,
          notificationType: NotificationCategory.LOW_STOCK,
          recipientType: RecipientType.STATIC_EMAIL,
          recipientValue: 'bad@example.com',
          isActive: true,
        },
        {
          id: 6,
          notificationType: NotificationCategory.LOW_STOCK,
          recipientType: RecipientType.STATIC_EMAIL,
          recipientValue: 'good@example.com',
          isActive: true,
        },
      ]);
      mailService.sendLowStockAlert.mockImplementation((to: string) => {
        if (to === 'bad@example.com') throw new Error('SMTP rejected');
        return Promise.resolve();
      });

      await service.notifyLowStock({
        id: 13,
        name: 'Monitor',
        availableStock: 1,
        minStockLevel: 5,
      });

      expect(mailService.sendLowStockAlert).toHaveBeenCalledTimes(2);
    });
  });

  describe('expiry dedupe', () => {
    it('skips sending when a NotificationLog row already exists for the threshold', async () => {
      const targetAsset = {
        id: 1,
        assetTag: 'AST-1',
        name: 'Laptop',
        warrantyExpiry: new Date(),
        assignedToId: null,
        deletedAt: null,
      };
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([targetAsset]),
      };
      assetRepo.createQueryBuilder.mockReturnValue(qb);
      // Existing log row found for every threshold — dedupe blocks resend.
      logRepo.findOne.mockResolvedValue({ id: 1 });

      await service.scanAssetWarrantyExpiry();

      expect(configRepo.find).not.toHaveBeenCalled();
      expect(mailService.sendWarrantyExpiryReminder).not.toHaveBeenCalled();
      expect(logRepo.save).not.toHaveBeenCalled();
    });

    it('sends and logs when no dedupe row exists yet', async () => {
      const targetAsset = {
        id: 2,
        assetTag: 'AST-2',
        name: 'Desktop',
        warrantyExpiry: new Date(),
        assignedToId: 9,
        deletedAt: null,
      };
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([targetAsset]),
      };
      assetRepo.createQueryBuilder.mockReturnValue(qb);
      logRepo.findOne.mockResolvedValue(null);
      configRepo.find.mockResolvedValue([
        {
          id: 1,
          notificationType: NotificationCategory.ASSET_WARRANTY_EXPIRY,
          recipientType: RecipientType.ASSIGNED_USER,
          isActive: true,
        },
      ]);
      userRepo.findOne.mockResolvedValue({ id: 9, email: 'owner@example.com' });

      await service.scanAssetWarrantyExpiry();

      // One send per threshold bucket (30/15/7) since the mocked query
      // returns the same asset for every threshold in this simplified test.
      expect(mailService.sendWarrantyExpiryReminder).toHaveBeenCalledWith(
        'owner@example.com',
        expect.objectContaining({ assetTag: 'AST-2' }),
      );
      expect(logRepo.save).toHaveBeenCalled();
    });
  });

  describe('notifyLowStock', () => {
    it('sends the low-stock alert email to resolved recipients', async () => {
      // The threshold-crossing decision (previousStock vs new stock) lives in
      // InventoryManagementService.maybeAlertLowStock — see
      // inventory-mgmt.service.spec.ts — this only covers that once called,
      // notifyLowStock resolves recipients and sends.
      configRepo.find.mockResolvedValue([
        {
          id: 1,
          notificationType: NotificationCategory.LOW_STOCK,
          recipientType: RecipientType.STATIC_EMAIL,
          recipientValue: 'ops@example.com',
          isActive: true,
        },
      ]);

      await service.notifyLowStock({ id: 1, name: 'Item', availableStock: 4, minStockLevel: 5 });
      expect(mailService.sendLowStockAlert).toHaveBeenCalledTimes(1);
    });
  });
});
