import { NotFoundException } from '@nestjs/common';
import { getMetadataStorage } from 'class-validator';
import { ValidationSchemaService } from './validation-schema.service';
import { FORM_SCHEMA_REGISTRY } from './form-schema.registry';
import { getRequiredWhenRules } from './required-when.decorator';

/**
 * The schema service reads class-validator's metadata storage, a semi-internal
 * API. These assertions pin the exact shape it depends on so a version bump
 * fails here — loudly and with an obvious cause — instead of silently
 * reflecting empty schemas into every form.
 */
describe('class-validator metadata contract', () => {
  it('identifies built-in decorators via `name`, not `type`', () => {
    const dto = FORM_SCHEMA_REGISTRY['inventory-assignment.create'];
    const metas = getMetadataStorage().getTargetValidationMetadatas(
      dto,
      dto.name,
      true,
      false,
    ) as Array<{ type: string; name?: string; propertyName: string }>;

    const isNumberMeta = metas.find(
      (m) => m.propertyName === 'itemId' && m.name === 'isNumber',
    );

    expect(isNumberMeta).toBeDefined();
    // If this ever stops being 'customValidation', re-read the storage shape.
    expect(isNumberMeta?.type).toBe('customValidation');
  });

  it('registers @IsOptional as a named conditionalValidation entry', () => {
    const dto = FORM_SCHEMA_REGISTRY['inventory-assignment.create'];
    const metas = getMetadataStorage().getTargetValidationMetadatas(
      dto,
      dto.name,
      true,
      false,
    ) as Array<{ type: string; name?: string; propertyName: string }>;

    const optional = metas.find(
      (m) => m.propertyName === 'department' && m.name === 'isOptional',
    );

    expect(optional?.type).toBe('conditionalValidation');
  });
});

describe('ValidationSchemaService', () => {
  let service: ValidationSchemaService;

  beforeEach(() => {
    service = new ValidationSchemaService();
  });

  it('lists the registered form keys', () => {
    expect(service.getFormKeys()).toEqual(
      expect.arrayContaining(['inventory-assignment.create']),
    );
  });

  it('404s for an unregistered form', () => {
    expect(() => service.getSchema('nope.create')).toThrow(NotFoundException);
  });

  it('caches the reflected schema', () => {
    expect(service.getSchema('inventory-assignment.create')).toBe(
      service.getSchema('inventory-assignment.create'),
    );
  });

  it('is serializable — no closures leak into the payload', () => {
    const schema = service.getSchema('inventory-assignment.create');
    expect(() => JSON.stringify(schema)).not.toThrow();
  });

  describe('reflecting CreateInventoryAssignmentDto', () => {
    it('marks a bare @IsNumber field as required', () => {
      const schema = service.getSchema('inventory-assignment.create');
      const itemId = schema.fields.find((f) => f.name === 'itemId');

      expect(itemId).toMatchObject({ required: true, type: 'number' });
    });

    it('marks an @IsOptional field as not required', () => {
      const schema = service.getSchema('inventory-assignment.create');
      const department = schema.fields.find((f) => f.name === 'department');

      expect(department?.required).toBe(false);
    });

    it('exposes conditional rules instead of a blanket required', () => {
      const schema = service.getSchema('inventory-assignment.create');
      const userId = schema.fields.find((f) => f.name === 'userId');

      expect(userId?.required).toBe(false);
      expect(userId?.requiredWhen).toEqual([
        { field: 'targetType', equals: ['PERSON'], defaultsTo: 'PERSON' },
      ]);
    });

    it('carries the LOCATION branch the client previously lacked', () => {
      const schema = service.getSchema('inventory-assignment.create');
      const location = schema.fields.find((f) => f.name === 'location');

      expect(location?.requiredWhen).toEqual([
        { field: 'targetType', equals: ['LOCATION'] },
      ]);
    });

    it('derives select options from @IsEnum', () => {
      const schema = service.getSchema('inventory-assignment.create');
      const targetType = schema.fields.find((f) => f.name === 'targetType');

      expect(targetType?.type).toBe('select');
      expect(targetType?.rules.options).toEqual(
        expect.arrayContaining(['PERSON', 'LOCATION']),
      );
    });

    it('carries @Min through as a numeric rule', () => {
      const schema = service.getSchema('inventory-assignment.create');
      const quantity = schema.fields.find((f) => f.name === 'quantity');

      expect(quantity?.rules.min).toBe(1);
    });

    it('types a date field from @IsDateString', () => {
      const schema = service.getSchema('inventory-assignment.create');
      const returnDate = schema.fields.find(
        (f) => f.name === 'expectedReturnDate',
      );

      expect(returnDate?.type).toBe('date');
    });
  });

  it('derives select options from @IsIn', () => {
    const schema = service.getSchema('inventory-return.create');
    const condition = schema.fields.find((f) => f.name === 'condition');

    expect(condition?.type).toBe('select');
    expect(condition?.rules.options).toEqual([
      'good',
      'fair',
      'damaged',
      'lost',
    ]);
  });

  /**
   * AC5: the client cannot hold a rule the DTO does not have. The schema is
   * reflected from the DTO rather than re-declared, so this asserts the
   * derivation itself stays faithful.
   */
  describe('contract with the DTOs (AC5)', () => {
    it.each(Object.keys(FORM_SCHEMA_REGISTRY))(
      '%s exposes every conditional rule declared on its DTO',
      (formKey) => {
        const dto = FORM_SCHEMA_REGISTRY[formKey];
        const declared = getRequiredWhenRules(dto);
        const schema = service.getSchema(formKey);

        for (const rule of declared) {
          const field = schema.fields.find((f) => f.name === rule.property);
          expect(field).toBeDefined();
          expect(field?.requiredWhen).toContainEqual(
            expect.objectContaining({ field: rule.field, equals: rule.equals }),
          );
        }
      },
    );

    it.each(Object.keys(FORM_SCHEMA_REGISTRY))(
      '%s never marks a conditional field unconditionally required',
      (formKey) => {
        const schema = service.getSchema(formKey);

        for (const field of schema.fields) {
          if (field.requiredWhen?.length) {
            expect(field.required).toBe(false);
          }
        }
      },
    );
  });
});
