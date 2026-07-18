import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IssueDto, ReturnDto } from './assignment.dto';
import { getObservedProperties } from '../../../common/validation/observe.decorator';

async function errorFields(
  dtoClass: new () => object,
  payload: Record<string, any>,
): Promise<string[]> {
  const dto = plainToInstance(dtoClass, payload);
  const errors = await validate(dto);
  return errors.map((e) => e.property);
}

describe('IssueDto', () => {
  const VALID = { catalogItemId: 1, assigneeId: 5 };

  it('accepts a minimal valid issue', async () => {
    expect(await errorFields(IssueDto, VALID)).toEqual([]);
  });

  describe('assigneeId', () => {
    /**
     * The form coerces an empty input to 0, and 0 is a legitimate number in
     * general — so the required check cannot catch it. @Min(1) does, and only
     * rejects ids that would fail on the foreign key anyway.
     */
    it('rejects 0', async () => {
      expect(await errorFields(IssueDto, { ...VALID, assigneeId: 0 })).toContain(
        'assigneeId',
      );
    });

    it('rejects a negative id', async () => {
      expect(
        await errorFields(IssueDto, { ...VALID, assigneeId: -1 }),
      ).toContain('assigneeId');
    });

    it('accepts 1', async () => {
      expect(
        await errorFields(IssueDto, { ...VALID, assigneeId: 1 }),
      ).not.toContain('assigneeId');
    });

    it('is still required when missing', async () => {
      expect(await errorFields(IssueDto, { catalogItemId: 1 })).toContain(
        'assigneeId',
      );
    });

    // The rule is new, so it observes before it enforces.
    it('is marked @Observe pending the rollout review', () => {
      expect(getObservedProperties(IssueDto)).toHaveProperty('assigneeId');
    });
  });

  /**
   * assetUnitId and locationId are required depending on the catalog item's
   * trackMode, which is not in this payload — AssignmentsService reads it from
   * the database. @RequiredWhen only gates on sibling properties, so these stay
   * as imperative service checks and the DTO must not reject them.
   */
  describe('the trackMode-dependent fields', () => {
    it('does not reject a missing assetUnitId', async () => {
      expect(await errorFields(IssueDto, VALID)).not.toContain('assetUnitId');
    });

    it('does not reject a missing locationId', async () => {
      expect(await errorFields(IssueDto, VALID)).not.toContain('locationId');
    });
  });

  describe('quantity', () => {
    // Stays optional: issueBulk() defaults an absent quantity to 1.
    it('is optional so existing API callers keep working', async () => {
      expect(await errorFields(IssueDto, VALID)).not.toContain('quantity');
    });

    it('rejects 0 when supplied', async () => {
      expect(await errorFields(IssueDto, { ...VALID, quantity: 0 })).toContain(
        'quantity',
      );
    });

    it('accepts 1', async () => {
      expect(
        await errorFields(IssueDto, { ...VALID, quantity: 1 }),
      ).not.toContain('quantity');
    });
  });
});

describe('ReturnDto', () => {
  const VALID = { assignmentId: 1 };

  it('accepts a minimal valid return', async () => {
    expect(await errorFields(ReturnDto, VALID)).toEqual([]);
  });

  it('requires assignmentId', async () => {
    expect(await errorFields(ReturnDto, {})).toContain('assignmentId');
  });

  it('rejects a quantity of 0', async () => {
    expect(await errorFields(ReturnDto, { ...VALID, quantity: 0 })).toContain(
      'quantity',
    );
  });

  it('rejects a condition outside the enum', async () => {
    expect(
      await errorFields(ReturnDto, { ...VALID, condition: 'pristine' }),
    ).toContain('condition');
  });

  it('accepts a valid condition', async () => {
    expect(
      await errorFields(ReturnDto, { ...VALID, condition: 'damaged' }),
    ).not.toContain('condition');
  });
});
