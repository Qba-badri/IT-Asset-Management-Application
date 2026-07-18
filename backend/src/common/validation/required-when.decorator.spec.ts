import {
  getMetadataStorage,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  validate,
} from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  RequiredWhen,
  findOptionalConflicts,
  getRequiredWhenRules,
} from './required-when.decorator';

enum TargetType {
  PERSON = 'PERSON',
  LOCATION = 'LOCATION',
}

class AssignmentDto {
  @IsOptional()
  @IsEnum(TargetType)
  targetType?: TargetType;

  @RequiredWhen({
    field: 'targetType',
    equals: [TargetType.PERSON],
    defaultsTo: TargetType.PERSON,
  })
  @IsNumber()
  userId?: number;

  @RequiredWhen({ field: 'targetType', equals: [TargetType.LOCATION] })
  @IsString()
  location?: string;
}

async function errorsFor(payload: Record<string, unknown>) {
  const dto = plainToInstance(AssignmentDto, payload);
  const errors = await validate(dto);
  return errors.map((e) => e.property);
}

describe('RequiredWhen', () => {
  describe('the PERSON branch', () => {
    it('requires userId when targetType is PERSON', async () => {
      expect(await errorsFor({ targetType: TargetType.PERSON })).toContain(
        'userId',
      );
    });

    it('accepts userId when targetType is PERSON', async () => {
      expect(
        await errorsFor({ targetType: TargetType.PERSON, userId: 1 }),
      ).not.toContain('userId');
    });

    // The defaultsTo case: the server treats an absent targetType as PERSON,
    // so userId must still be required.
    it('requires userId when targetType is absent (defaults to PERSON)', async () => {
      expect(await errorsFor({})).toContain('userId');
    });

    it('does not require userId when targetType is LOCATION', async () => {
      expect(
        await errorsFor({ targetType: TargetType.LOCATION, location: 'Room 1' }),
      ).not.toContain('userId');
    });
  });

  // This branch had no frontend counterpart before the migration — the client
  // enforced only the PERSON half, so the two sides disagreed.
  describe('the LOCATION branch', () => {
    it('requires location when targetType is LOCATION', async () => {
      expect(await errorsFor({ targetType: TargetType.LOCATION })).toContain(
        'location',
      );
    });

    it('accepts location when targetType is LOCATION', async () => {
      expect(
        await errorsFor({ targetType: TargetType.LOCATION, location: 'Room 1' }),
      ).not.toContain('location');
    });

    it('does not require location when targetType is PERSON', async () => {
      expect(
        await errorsFor({ targetType: TargetType.PERSON, userId: 1 }),
      ).not.toContain('location');
    });

    it('does not require location when targetType is absent', async () => {
      expect(await errorsFor({ userId: 1 })).not.toContain('location');
    });
  });

  // The bug that motivated this work: the old frontend `custom` rule only ran
  // when the value was truthy, so a conditional-required check on an empty
  // value never fired. Guard against the decorator regressing the same way.
  it('fires on an empty value, not only a truthy one', async () => {
    expect(
      await errorsFor({ targetType: TargetType.PERSON, userId: undefined }),
    ).toContain('userId');
    expect(
      await errorsFor({ targetType: TargetType.LOCATION, location: '' }),
    ).toContain('location');
  });

  describe('metadata', () => {
    it('records conditions as serializable data, not closures', () => {
      const rules = getRequiredWhenRules(AssignmentDto);

      expect(rules).toEqual(
        expect.arrayContaining([
          {
            property: 'userId',
            field: 'targetType',
            equals: [TargetType.PERSON],
            defaultsTo: TargetType.PERSON,
          },
          {
            property: 'location',
            field: 'targetType',
            equals: [TargetType.LOCATION],
          },
        ]),
      );

      // Must survive the wire — this is the whole point of the decorator.
      expect(() => JSON.stringify(rules)).not.toThrow();
    });

    it('returns an empty list for a DTO with no conditional rules', () => {
      class Plain {}
      expect(getRequiredWhenRules(Plain)).toEqual([]);
    });
  });

  /**
   * @IsOptional skips validation entirely when a value is absent — which is
   * exactly when a conditional-required rule must fire. Pairing the two
   * silently disables the rule, reproducing the class of bug this framework
   * exists to remove, so it is detected rather than tolerated.
   */
  describe('the @IsOptional conflict', () => {
    class ConflictedDto {
      @IsOptional()
      @IsEnum(TargetType)
      targetType?: TargetType;

      @RequiredWhen({ field: 'targetType', equals: [TargetType.PERSON] })
      @IsOptional()
      @IsNumber()
      userId?: number;
    }

    function metadatasFor(dto: Function) {
      return getMetadataStorage().getTargetValidationMetadatas(
        dto,
        dto.name,
        true,
        false,
      ) as Array<{ propertyName: string; name?: string }>;
    }

    it('confirms @IsOptional really does defeat the rule', async () => {
      const instance = plainToInstance(ConflictedDto, {
        targetType: TargetType.PERSON,
      });
      const errors = await validate(instance);

      // userId is absent and required — yet no error, because @IsOptional won.
      expect(errors.map((e) => e.property)).not.toContain('userId');
    });

    it('detects the conflict', () => {
      expect(findOptionalConflicts(ConflictedDto, metadatasFor(ConflictedDto))).toEqual(
        ['userId'],
      );
    });

    it('reports no conflict for a correctly written DTO', () => {
      expect(findOptionalConflicts(AssignmentDto, metadatasFor(AssignmentDto))).toEqual(
        [],
      );
    });
  });
});
