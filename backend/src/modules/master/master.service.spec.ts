import { NotFoundException } from '@nestjs/common';
import { MasterService } from './master.service';
import { AuditAction } from '../../entities/audit-event.entity';

describe('MasterService status audit', () => {
  let repo: any;
  let manager: any;
  let dataSource: any;
  let auditEvents: any;
  let service: MasterService;

  beforeEach(() => {
    repo = {
      findOneBy: jest.fn(),
      update: jest.fn(),
    };
    manager = {
      getRepository: jest.fn(() => repo),
    };
    dataSource = {
      getRepository: jest.fn(() => repo),
      transaction: jest.fn(async (cb: any) => cb(manager)),
    };
    auditEvents = { logEvent: jest.fn() };
    // Entity repos are unused by updateMasterRecord — it resolves via dataSource.
    service = new MasterService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      dataSource,
      auditEvents,
    );
  });

  it('404s when the target record does not exist', async () => {
    repo.findOneBy.mockResolvedValue(null);
    await expect(
      service.updateBrand(99, { isActive: false }, 1),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('audits (in the transaction) only when isActive actually changes', async () => {
    repo.findOneBy.mockResolvedValue({ id: 3, name: 'Dell', isActive: true });
    await service.updateBrand(3, { isActive: false }, 42);

    expect(dataSource.transaction).toHaveBeenCalled();
    expect(auditEvents.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        entityType: 'Brand',
        entityId: 3,
        actorId: 42,
        metadata: expect.objectContaining({ field: 'isActive', from: true, to: false, name: 'Dell' }),
      }),
      manager,
    );
  });

  it('does not audit an update that leaves isActive unchanged', async () => {
    repo.findOneBy.mockResolvedValue({ id: 3, name: 'Dell', isActive: true });
    await service.updateBrand(3, { name: 'Dell Inc.' } as any, 42);
    expect(auditEvents.logEvent).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});
