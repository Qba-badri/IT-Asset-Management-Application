import { IsNotEmpty, ValidateIf } from 'class-validator';
import 'reflect-metadata';

export const REQUIRED_WHEN_METADATA = Symbol('requiredWhen');

export interface RequiredWhenCondition {
  /** The field whose value gates this one. */
  field: string;
  /** The value(s) of `field` that make this field required. */
  equals: unknown[];
  /**
   * Value assumed for `field` when it is absent. Mirrors defaults applied
   * server-side (e.g. targetType defaults to PERSON).
   */
  defaultsTo?: unknown;
}

export interface RequiredWhenEntry extends RequiredWhenCondition {
  property: string;
}

function matches(actual: unknown, condition: RequiredWhenCondition): boolean {
  const effective =
    actual === undefined || actual === null ? condition.defaultsTo : actual;
  return condition.equals.some((candidate) => candidate === effective);
}

/**
 * Marks a property required only when another property holds a given value.
 *
 * Wraps @ValidateIf — so class-validator enforces it server-side — while also
 * recording the condition as serializable metadata. That metadata is what lets
 * the same rule reach the client: a raw @ValidateIf predicate is a closure and
 * cannot be sent over the wire.
 *
 *   @RequiredWhen({ field: 'targetType', equals: ['PERSON'], defaultsTo: 'PERSON' })
 *   @IsNumber()
 *   userId?: number;
 *
 * The decorator asserts presence itself (via @IsNotEmpty) rather than relying
 * on the type validators it sits above: @IsString() accepts '', so a bare
 * @ValidateIf + @IsString pair would let an empty string through a field the
 * rule claims is required. Any other validators on the property still apply —
 * @ValidateIf governs whether they run, and they check what the value is.
 *
 * @IsNotEmpty rejects '', null and undefined but accepts 0 and false, which is
 * the intended reading of "required" for numeric and boolean fields.
 *
 * IMPORTANT: never combine this with @IsOptional. @IsOptional skips all
 * validation when a value is null/undefined, which silently defeats the
 * conditional rule — the exact case it exists to catch. A property carrying
 * @RequiredWhen is optional by virtue of the condition; it needs no @IsOptional.
 * assertNoOptionalConflict() below fails loudly if the two are ever paired.
 */
export function RequiredWhen(
  condition: RequiredWhenCondition,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const property = String(propertyKey);

    const existing: RequiredWhenEntry[] =
      Reflect.getMetadata(REQUIRED_WHEN_METADATA, target.constructor) ?? [];

    Reflect.defineMetadata(
      REQUIRED_WHEN_METADATA,
      [...existing, { property, ...condition }],
      target.constructor,
    );

    IsNotEmpty()(target, propertyKey);

    ValidateIf((dto: Record<string, unknown>) =>
      matches(dto?.[condition.field], condition),
    )(target, propertyKey);
  };
}

/** Reads the conditional-required rules declared on a DTO class. */
export function getRequiredWhenRules(target: Function): RequiredWhenEntry[] {
  return Reflect.getMetadata(REQUIRED_WHEN_METADATA, target) ?? [];
}

/**
 * Names properties that carry both @RequiredWhen and @IsOptional — a
 * combination in which @IsOptional silently wins and the conditional rule never
 * fires. Returns an empty array when the DTO is sound.
 *
 * Called by the schema service at boot so a misconfigured DTO surfaces
 * immediately rather than as a validation gap in production.
 */
export function findOptionalConflicts(
  target: Function,
  metadatas: Array<{ propertyName: string; name?: string }>,
): string[] {
  const conditional = new Set(
    getRequiredWhenRules(target).map((rule) => rule.property),
  );

  return [
    ...new Set(
      metadatas
        .filter((m) => m.name === 'isOptional' && conditional.has(m.propertyName))
        .map((m) => m.propertyName),
    ),
  ];
}
