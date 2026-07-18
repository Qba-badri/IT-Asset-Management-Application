import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InventoryManagementService } from './inventory-mgmt.service';
import { InventoryCategory } from '../../entities/inventory-category.entity';
import { InventoryItem } from '../../entities/inventory-item.entity';
import { InventoryPurchase } from '../../entities/inventory-purchase.entity';
import { InventoryAssignment } from '../../entities/inventory-assignment.entity';
import { InventoryReturn } from '../../entities/inventory-return.entity';
import { InventoryTransaction, InventoryTransactionType } from '../../entities/inventory-transaction.entity';
import { AuditEvent } from '../../entities/audit-event.entity';
import { NotificationsService } from '../notifications/notifications.service';

describe('InventoryManagementService — low-stock crossing (adjustStock)', () => {
  let service: InventoryManagementService;

  const itemRepo = { findOne: jest.fn() };
  const notificationsService = { notifyLowStock: jest.fn(), notifyAssignment: jest.fn() };

  const makeManager = (item: any) => ({
    findOne: jest.fn().mockResolvedValue(item),
    save: jest.fn(async (_entity: any, value: any) => value),
    create: jest.fn((_entity: any, value: any) => value),
  });

  const dataSource = {
    transaction: jest.fn(async (cb: any) => cb(makeManager(currentItem))),
  } as unknown as DataSource;

  let currentItem: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        InventoryManagementService,
        { provide: getRepositoryToken(InventoryCategory), useValue: {} },
        { provide: getRepositoryToken(InventoryItem), useValue: itemRepo },
        { provide: getRepositoryToken(InventoryPurchase), useValue: {} },
        { provide: getRepositoryToken(InventoryAssignment), useValue: {} },
        { provide: getRepositoryToken(InventoryReturn), useValue: {} },
        { provide: getRepositoryToken(InventoryTransaction), useValue: {} },
        { provide: getRepositoryToken(AuditEvent), useValue: {} },
        { provide: DataSource, useValue: dataSource },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();
    service = moduleRef.get(InventoryManagementService);
  });

  it('fires the low-stock alert when stock crosses below minStockLevel', async () => {
    // availableStock starts at 6 (>= minStockLevel 5); OUT of 2 drops it to 4 (< 5): crossing.
    currentItem = { id: 1, name: 'Widget', availableStock: 6, minStockLevel: 5, totalStock: 20 };
    (dataSource.transaction as jest.Mock).mockImplementation((cb: any) => cb(makeManager(currentItem)));
    itemRepo.findOne.mockResolvedValue({ ...currentItem, availableStock: 4 });

    await service.adjustStock(
      { itemId: 1, type: InventoryTransactionType.OUT, quantity: 2, notes: 'count correction' } as any,
      1,
    );

    expect(notificationsService.notifyLowStock).toHaveBeenCalledTimes(1);
    expect(notificationsService.notifyLowStock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, availableStock: 4, minStockLevel: 5 }),
    );
  });

  it('does not fire again once stock is already below the threshold (no re-crossing)', async () => {
    // availableStock already at 4 (< 5) before this OUT — previousStock is also < threshold,
    // so this is not a crossing event.
    currentItem = { id: 1, name: 'Widget', availableStock: 4, minStockLevel: 5, totalStock: 20 };
    (dataSource.transaction as jest.Mock).mockImplementation((cb: any) => cb(makeManager(currentItem)));
    itemRepo.findOne.mockResolvedValue({ ...currentItem, availableStock: 3 });

    await service.adjustStock(
      { itemId: 1, type: InventoryTransactionType.OUT, quantity: 1, notes: 'count correction' } as any,
      1,
    );

    expect(notificationsService.notifyLowStock).not.toHaveBeenCalled();
  });

  it('does not fire on an IN adjustment that keeps stock above threshold', async () => {
    currentItem = { id: 1, name: 'Widget', availableStock: 10, minStockLevel: 5, totalStock: 20 };
    (dataSource.transaction as jest.Mock).mockImplementation((cb: any) => cb(makeManager(currentItem)));
    itemRepo.findOne.mockResolvedValue({ ...currentItem, availableStock: 15 });

    await service.adjustStock(
      { itemId: 1, type: InventoryTransactionType.IN, quantity: 5, notes: 'restock' } as any,
      1,
    );

    expect(notificationsService.notifyLowStock).not.toHaveBeenCalled();
  });
});
