import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DeployAssetDto } from './asset.dto';

async function errorFields(payload: Record<string, unknown>): Promise<string[]> {
  const dto = plainToInstance(DeployAssetDto, payload);
  const errors = await validate(dto);
  return errors.map((e) => e.property);
}

const PERSON_DEPLOY = { targetType: 'PERSON', userId: 5, reason: 'New hire' };
const LOCATION_DEPLOY = {
  targetType: 'LOCATION',
  location: 'Room 302',
  reason: 'Moved to lab',
};

describe('DeployAssetDto', () => {
  it('accepts a valid PERSON deploy', async () => {
    expect(await errorFields(PERSON_DEPLOY)).toEqual([]);
  });

  it('accepts a valid LOCATION deploy', async () => {
    expect(await errorFields(LOCATION_DEPLOY)).toEqual([]);
  });

  describe('reason', () => {
    // AssetsService.deploy() already threw on an empty reason; @IsString()
    // alone did not catch it, since '' is a valid string.
    it('rejects an empty reason', async () => {
      expect(await errorFields({ ...PERSON_DEPLOY, reason: '' })).toContain(
        'reason',
      );
    });

    it('rejects a missing reason', async () => {
      const { reason, ...withoutReason } = PERSON_DEPLOY;
      expect(await errorFields(withoutReason)).toContain('reason');
    });
  });

  describe('targetType', () => {
    it('rejects an empty targetType', async () => {
      expect(await errorFields({ ...PERSON_DEPLOY, targetType: '' })).toContain(
        'targetType',
      );
    });
  });

  describe('userId (conditional on PERSON)', () => {
    it('is required when targetType is PERSON', async () => {
      const { userId, ...withoutUser } = PERSON_DEPLOY;
      expect(await errorFields(withoutUser)).toContain('userId');
    });

    it('is not required when targetType is LOCATION', async () => {
      expect(await errorFields(LOCATION_DEPLOY)).not.toContain('userId');
    });
  });

  describe('location (conditional on LOCATION)', () => {
    it('is required when targetType is LOCATION', async () => {
      const { location, ...withoutLocation } = LOCATION_DEPLOY;
      expect(await errorFields(withoutLocation)).toContain('location');
    });

    it('rejects an empty location string when targetType is LOCATION', async () => {
      expect(
        await errorFields({ ...LOCATION_DEPLOY, location: '' }),
      ).toContain('location');
    });

    it('is not required when targetType is PERSON', async () => {
      expect(await errorFields(PERSON_DEPLOY)).not.toContain('location');
    });
  });

  describe('deploymentDate', () => {
    // Deliberately optional: the service defaults an absent date to now, and
    // API callers depend on that. The form requires it as a UI-level rule.
    it('stays optional so existing API callers keep working', async () => {
      expect(await errorFields(PERSON_DEPLOY)).not.toContain('deploymentDate');
    });

    it('accepts a supplied date', async () => {
      expect(
        await errorFields({ ...PERSON_DEPLOY, deploymentDate: '2026-07-16' }),
      ).not.toContain('deploymentDate');
    });
  });
});
