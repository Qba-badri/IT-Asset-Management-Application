import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StockService } from './stock.service';
import { StockByLocation } from '../../entities/stock-by-location.entity';
import { StockLedger, LedgerReason } from '../../entities/stock-ledger.entity';
import { CatalogItem, TrackMode } from '../../entities/catalog-item.entity';
import { AuditEvent } from '../../entities/audit-event.entity';

describe('StockService — adjustments (F-05/F-06)', () => {
  let service: StockService;

  const catalogRepo = { findOne: jest.fn() };
  const saved: { entity: any; value: any }[] = [];

  const manager = {
    findOne: jest.fn(),
    save: jest.fn(async (entity: any, value: any) => {
      saved.push({ entity, value });
      return value;
    }),
    create: jest.fn((_entity: any, value: any) => value),
  };
  const dataSource = {
    transaction: jest.fn(async (cb: any) => cb(manager)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    saved.length = 0;
    const moduleRef = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: getRepositoryToken(StockByLocation), useValue: {} },
        { provide: getRepositoryToken(StockLedger), useValue: {} },
        { provide: getRepositoryToken(CatalogItem), useValue: catalogRepo },
        { provide: getRepositoryToken(AuditEvent), useValue: {} },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = moduleRef.get(StockService);
  });

  const dto = {
    catalogItemId: 3,
    locationId: 2,
    newQuantity: 15,
    reason: 'cycle count',
    notes: 'UAT check',
  };

  it('creates a correct ledger entry and audit event on adjustment', async () => {
    catalogRepo.findOne.mockResolvedValue({
      id: 3,
      trackMode: TrackMode.BULK_QTY,
    });
    manager.findOne.mockResolvedValue({
      id: 8,
      catalogItemId: 3,
      locationId: 2,
      quantity: 10,
    });

    const result = await service.adjustStock(dto as any, 42);

    expect(result.quantity).toBe(15);
    const ledger = saved.find((s) => s.entity === StockLedger)?.value;
    expect(ledger).toMatchObject({
      quantityChange: 5,
      runningBalance: 15,
      reason: LedgerReason.ADJUSTMENT,
      createdById: 42, // actor comes from the authenticated user
    });
    const audit = saved.find((s) => s.entity === AuditEvent)?.value;
    expect(audit).toMatchObject({
      actorId: 42,
      metadata: expect.objectContaining({
        oldQuantity: 10,
        newQuantity: 15,
        change: 5,
      }),
    });
  });

  it('rejects negative stock quantities', async () => {
    catalogRepo.findOne.mockResolvedValue({
      id: 3,
      trackMode: TrackMode.BULK_QTY,
    });
    await expect(
      service.adjustStock({ ...dto, newQuantity: -1 } as any, 42),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rejects adjustment for non-bulk (serialized) items', async () => {
    catalogRepo.findOne.mockResolvedValue({
      id: 3,
      trackMode: TrackMode.SERIALIZED,
    });
    await expect(service.adjustStock(dto as any, 42)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects adjustment for an unknown catalog item', async () => {
    catalogRepo.findOne.mockResolvedValue(null);
    await expect(service.adjustStock(dto as any, 42)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('keeps ledger running balance consistent with the stored quantity', async () => {
    catalogRepo.findOne.mockResolvedValue({
      id: 3,
      trackMode: TrackMode.BULK_QTY,
    });
    manager.findOne.mockResolvedValue({ id: 8, quantity: 20 });
    await service.adjustStock({ ...dto, newQuantity: 7 } as any, 42);
    const stock = saved.find((s) => s.entity === StockByLocation)?.value;
    const ledger = saved.find((s) => s.entity === StockLedger)?.value;
    expect(ledger.runningBalance).toBe(stock.quantity);
    expect(ledger.quantityChange).toBe(-13);
  });
});
