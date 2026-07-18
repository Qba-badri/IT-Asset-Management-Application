import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { getMetadataStorage } from 'class-validator';
import { ValidationMetadata } from 'class-validator/types/metadata/ValidationMetadata';
import {
  findOptionalConflicts,
  getRequiredWhenRules,
} from './required-when.decorator';
import {
  FieldRules,
  FieldSchema,
  FieldType,
  FormSchema,
} from './validation-schema.types';
import { FORM_SCHEMA_REGISTRY } from './form-schema.registry';

/**
 * class-validator (0.14.x) registers every built-in decorator with
 * `type: 'customValidation'` and carries the decorator's identity in `name`
 * ('isString', 'isEnum', …). `name` is therefore the discriminator, not `type`.
 *
 * @IsOptional is the exception: it registers as a conditionalValidation entry
 * named 'isOptional'. Our own @RequiredWhen also emits a conditionalValidation
 * entry, but an unnamed one — which is how the two are told apart below.
 *
 * This shape is a semi-internal API. The contract tests in
 * validation-schema.service.spec.ts fail loudly if an upgrade changes it.
 */
const CONSTRAINT = {
  isOptional: 'isOptional',
  isNotEmpty: 'isNotEmpty',
  isDefined: 'isDefined',
  isString: 'isString',
  isNumber: 'isNumber',
  isInt: 'isInt',
  isBoolean: 'isBoolean',
  isDate: 'isDate',
  isDateString: 'isDateString',
  isEnum: 'isEnum',
  isArray: 'isArray',
  isEmail: 'isEmail',
  minLength: 'minLength',
  maxLength: 'maxLength',
  length: 'length',
  min: 'min',
  max: 'max',
  isIn: 'isIn',
} as const;

/** The constraint identity, e.g. 'isString'. Absent on our @ValidateIf entry. */
function constraintName(meta: ValidationMetadata): string | undefined {
  return (meta as ValidationMetadata & { name?: string }).name;
}

function typeFor(names: Set<string>): FieldType {
  if (names.has(CONSTRAINT.isArray)) return 'multiselect';
  if (names.has(CONSTRAINT.isEnum) || names.has(CONSTRAINT.isIn)) return 'select';
  if (names.has(CONSTRAINT.isBoolean)) return 'checkbox';
  if (names.has(CONSTRAINT.isDate) || names.has(CONSTRAINT.isDateString)) {
    return 'date';
  }
  if (names.has(CONSTRAINT.isNumber) || names.has(CONSTRAINT.isInt)) {
    return 'number';
  }
  if (names.has(CONSTRAINT.isString) || names.has(CONSTRAINT.isEmail)) {
    return 'text';
  }
  return 'unknown';
}

@Injectable()
export class ValidationSchemaService {
  private readonly logger = new Logger(ValidationSchemaService.name);
  private readonly cache = new Map<string, FormSchema>();

  /**
   * Identifies this deploy. Schemas are reflected from code at boot and cannot
   * change at runtime, so a per-process id is a sufficient cache key for the
   * client.
   */
  private readonly buildId = `${process.env.BUILD_ID ?? process.pid}-${Date.now()}`;

  getFormKeys(): string[] {
    return Object.keys(FORM_SCHEMA_REGISTRY);
  }

  getSchema(formKey: string): FormSchema {
    const cached = this.cache.get(formKey);
    if (cached) return cached;

    const dto = FORM_SCHEMA_REGISTRY[formKey];
    if (!dto) {
      throw new NotFoundException(`No validation schema for form '${formKey}'`);
    }

    const schema = this.buildSchema(formKey, dto);
    this.cache.set(formKey, schema);
    return schema;
  }

  /**
   * Reflects a DTO's class-validator metadata into a serializable schema.
   *
   * This is deliberately derived rather than re-declared: the client cannot
   * hold a rule the DTO does not have, so the two cannot silently disagree.
   */
  private buildSchema(formKey: string, dto: Function): FormSchema {
    const storage = getMetadataStorage();

    // `true` includes metadata inherited from parent classes — DTOs in this
    // codebase use PartialType/inheritance for update variants.
    const metadatas = storage.getTargetValidationMetadatas(
      dto,
      dto.name,
      true,
      false,
    );

    // @IsOptional beats @RequiredWhen, so pairing them silently disables the
    // conditional rule. Fail at boot rather than ship a validation hole.
    const conflicts = findOptionalConflicts(
      dto,
      metadatas as Array<ValidationMetadata & { name?: string }>,
    );
    if (conflicts.length) {
      throw new Error(
        `${dto.name}: @RequiredWhen cannot be combined with @IsOptional on ` +
          `${conflicts.join(', ')} — @IsOptional skips validation when the value ` +
          `is absent, which is exactly when the conditional rule must fire. ` +
          `Remove @IsOptional from these properties.`,
      );
    }

    const byProperty = new Map<string, ValidationMetadata[]>();
    for (const meta of metadatas) {
      const list = byProperty.get(meta.propertyName) ?? [];
      list.push(meta);
      byProperty.set(meta.propertyName, list);
    }

    const requiredWhenRules = getRequiredWhenRules(dto);
    const fields: FieldSchema[] = [];

    for (const [property, metas] of byProperty) {
      const names = new Set(
        metas.map(constraintName).filter((n): n is string => !!n),
      );

      const conditions = requiredWhenRules
        .filter((rule) => rule.property === property)
        .map(({ property: _p, ...condition }) => condition);

      // @IsOptional registers as a CONDITIONAL_VALIDATION entry. A field is
      // unconditionally required when it is not optional and carries no
      // conditional rule of its own.
      const isOptional = names.has(CONSTRAINT.isOptional);
      const required = !isOptional && conditions.length === 0;

      fields.push({
        name: property,
        type: typeFor(names),
        required,
        ...(conditions.length ? { requiredWhen: conditions } : {}),
        rules: this.extractRules(metas),
      });
    }

    this.logger.log(
      `Reflected schema '${formKey}' from ${dto.name}: ${fields.length} fields`,
    );

    return { formKey, buildId: this.buildId, fields };
  }

  private extractRules(metas: ValidationMetadata[]): FieldRules {
    const rules: FieldRules = {};

    for (const meta of metas) {
      const [first, second] = meta.constraints ?? [];

      switch (constraintName(meta)) {
        case CONSTRAINT.minLength:
          rules.minLength = first as number;
          break;
        case CONSTRAINT.maxLength:
          rules.maxLength = first as number;
          break;
        case CONSTRAINT.length:
          if (typeof first === 'number') rules.minLength = first;
          if (typeof second === 'number') rules.maxLength = second;
          break;
        case CONSTRAINT.min:
          rules.min = first as number;
          break;
        case CONSTRAINT.max:
          rules.max = first as number;
          break;
        case CONSTRAINT.isEmail:
          rules.email = true;
          break;
        case CONSTRAINT.isEnum: {
          // class-validator stores the enum object as the first constraint.
          const enumObject = first as Record<string, unknown> | undefined;
          if (enumObject && typeof enumObject === 'object') {
            rules.options = Object.values(enumObject).map(String);
          }
          break;
        }
        case CONSTRAINT.isIn:
          if (Array.isArray(first)) rules.options = first.map(String);
          break;
      }
    }

    return rules;
  }
}
