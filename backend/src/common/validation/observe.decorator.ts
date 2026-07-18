import 'reflect-metadata';

export const OBSERVED_PROPERTIES = Symbol('observedProperties');

/**
 * Marks a validation rule as *observed* rather than enforced.
 *
 * Rules added during the DTO backfill (design doc P4) tighten endpoints that
 * previously accepted looser payloads. Because we have no confirmed inventory
 * of external or automated callers, those rules ship in observation mode
 * first: a failure is recorded with the endpoint and caller identity, and the
 * request is allowed through.
 *
 *   @Observe('Backfilled 2026-07: UI has always required this')
 *   @IsNotEmpty()
 *   name: string;
 *
 * Crucially this is per-property, not global. A blanket "enforce nothing"
 * switch would also stop enforcing rules that already work today, letting bad
 * data in during the very release meant to be safe. Only properties marked
 * here are exempt; everything else keeps rejecting as it always has.
 *
 * Promotion path once the observation window is reviewed:
 *   1. VALIDATION_ENFORCE_OBSERVED=true — enforce them, still easily reverted.
 *   2. Delete the @Observe decorators — the rule is now simply a rule.
 */
export function Observe(reason?: string): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const property = String(propertyKey);
    const existing: Record<string, string | undefined> =
      Reflect.getMetadata(OBSERVED_PROPERTIES, target.constructor) ?? {};

    Reflect.defineMetadata(
      OBSERVED_PROPERTIES,
      { ...existing, [property]: reason },
      target.constructor,
    );
  };
}

/** Property names on a DTO whose rules are observed, not enforced. */
export function getObservedProperties(
  target: Function | undefined,
): Record<string, string | undefined> {
  if (!target) return {};
  return Reflect.getMetadata(OBSERVED_PROPERTIES, target) ?? {};
}

/**
 * Whether observed rules are enforced. Defaults to false: a newly backfilled
 * rule observes first and is promoted deliberately, never by accident.
 */
export function observedRulesAreEnforced(): boolean {
  return process.env.VALIDATION_ENFORCE_OBSERVED === 'true';
}
