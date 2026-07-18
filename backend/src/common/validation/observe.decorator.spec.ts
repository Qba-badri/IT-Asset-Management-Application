import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { IsNotEmpty, IsString, ValidationError } from 'class-validator';
import { Observe, getObservedProperties, observedRulesAreEnforced } from './observe.decorator';
import {
  createValidationPipe,
  partitionObservedErrors,
} from './validation-pipe.factory';
import { ValidationObservationService } from './validation-observation.service';

class BackfilledDto {
  // Pre-existing rule: enforced from day one.
  @IsString()
  @IsNotEmpty()
  alreadyEnforced: string;

  // Backfilled rule: observed, not enforced.
  @Observe('trial')
  @IsString()
  @IsNotEmpty()
  newlyObserved: string;
}

function makeError(property: string): ValidationError {
  const error = new ValidationError();
  error.property = property;
  error.constraints = { isNotEmpty: `${property} should not be empty` };
  return error;
}

const BODY: ArgumentMetadata = { type: 'body', metatype: BackfilledDto, data: '' };

describe('Observe', () => {
  const original = process.env.VALIDATION_ENFORCE_OBSERVED;
  afterEach(() => {
    process.env.VALIDATION_ENFORCE_OBSERVED = original;
  });

  describe('metadata', () => {
    it('records which properties are observed', () => {
      expect(getObservedProperties(BackfilledDto)).toEqual({
        newlyObserved: 'trial',
      });
    });

    it('returns an empty map for an unmarked class', () => {
      class Plain {}
      expect(getObservedProperties(Plain)).toEqual({});
    });

    it('is safe for an undefined metatype (primitive params)', () => {
      expect(getObservedProperties(undefined)).toEqual({});
    });
  });

  describe('observedRulesAreEnforced', () => {
    it('defaults to false so a backfilled rule cannot enforce by accident', () => {
      delete process.env.VALIDATION_ENFORCE_OBSERVED;
      expect(observedRulesAreEnforced()).toBe(false);
    });

    it('is false for any value other than the exact string "true"', () => {
      process.env.VALIDATION_ENFORCE_OBSERVED = 'yes';
      expect(observedRulesAreEnforced()).toBe(false);
    });

    it('is true only when explicitly set', () => {
      process.env.VALIDATION_ENFORCE_OBSERVED = 'true';
      expect(observedRulesAreEnforced()).toBe(true);
    });
  });
});

describe('partitionObservedErrors', () => {
  it('separates observed from enforced', () => {
    const { enforced, observed } = partitionObservedErrors(
      [makeError('alreadyEnforced'), makeError('newlyObserved')],
      { newlyObserved: 'trial' },
    );

    expect(enforced.map((e) => e.property)).toEqual(['alreadyEnforced']);
    expect(observed.map((e) => e.property)).toEqual(['newlyObserved']);
  });

  it('treats everything as enforced when nothing is observed', () => {
    const { enforced, observed } = partitionObservedErrors(
      [makeError('alreadyEnforced')],
      {},
    );

    expect(enforced).toHaveLength(1);
    expect(observed).toHaveLength(0);
  });
});

describe('AppValidationPipe observation mode', () => {
  const original = process.env.VALIDATION_ENFORCE_OBSERVED;
  let observations: { record: jest.Mock };
  let pipe: ReturnType<typeof createValidationPipe>;

  beforeEach(() => {
    delete process.env.VALIDATION_ENFORCE_OBSERVED;
    observations = { record: jest.fn().mockResolvedValue(undefined) };
    pipe = createValidationPipe(
      observations as unknown as ValidationObservationService,
    );
  });

  afterEach(() => {
    process.env.VALIDATION_ENFORCE_OBSERVED = original;
  });

  it('lets a request through when only observed rules fail', async () => {
    const value = { alreadyEnforced: 'ok', newlyObserved: '' };

    await expect(pipe.transform(value, BODY)).resolves.toMatchObject({
      alreadyEnforced: 'ok',
    });
  });

  it('records the observed failure rather than silently ignoring it', async () => {
    await pipe.transform({ alreadyEnforced: 'ok', newlyObserved: '' }, BODY);

    expect(observations.record).toHaveBeenCalledTimes(1);
    expect(observations.record.mock.calls[0][0]).toEqual([
      {
        field: 'newlyObserved',
        constraint: 'isNotEmpty',
        message: 'newlyObserved should not be empty',
      },
    ]);
  });

  /**
   * The reason observation is per-property rather than a global switch: a
   * blanket "enforce nothing" mode would stop enforcing rules that already
   * work, so the release intended to be safe would be the one admitting bad
   * data.
   */
  it('still rejects a pre-existing rule while observing a new one', async () => {
    const value = { alreadyEnforced: '', newlyObserved: '' };

    await expect(pipe.transform(value, BODY)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('omits observed errors from the response the user sees', async () => {
    expect.assertions(2);
    try {
      await pipe.transform({ alreadyEnforced: '', newlyObserved: '' }, BODY);
    } catch (error) {
      const body = (error as BadRequestException).getResponse() as {
        errors: Record<string, string[]>;
      };
      expect(body.errors).toHaveProperty('alreadyEnforced');
      expect(body.errors).not.toHaveProperty('newlyObserved');
    }
  });

  it('enforces observed rules once promoted', async () => {
    process.env.VALIDATION_ENFORCE_OBSERVED = 'true';

    await expect(
      pipe.transform({ alreadyEnforced: 'ok', newlyObserved: '' }, BODY),
    ).rejects.toThrow(BadRequestException);
  });

  it('does not record anything when a request is valid', async () => {
    await pipe.transform(
      { alreadyEnforced: 'ok', newlyObserved: 'ok' },
      BODY,
    );

    expect(observations.record).not.toHaveBeenCalled();
  });

  it('survives a recording failure — observation must not break the request', async () => {
    observations.record.mockRejectedValue(new Error('db down'));

    await expect(
      pipe.transform({ alreadyEnforced: 'ok', newlyObserved: '' }, BODY),
    ).resolves.toBeDefined();
  });

  it('rejects normally for a DTO with no observed properties', async () => {
    class PlainDto {
      @IsString()
      @IsNotEmpty()
      name: string;
    }

    await expect(
      pipe.transform({ name: '' }, { type: 'body', metatype: PlainDto, data: '' }),
    ).rejects.toThrow(BadRequestException);
  });
});
