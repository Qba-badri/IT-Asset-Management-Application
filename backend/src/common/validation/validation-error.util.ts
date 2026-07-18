import { ValidationError } from 'class-validator';

/** Field name -> list of human-readable messages for that field. */
export type FieldErrorMap = Record<string, string[]>;

/**
 * The body returned for a validation failure.
 *
 * `message` is retained as a string[] — identical to Nest's stock shape — so
 * existing call sites that pass it straight to a toast keep working unchanged.
 * `errors` is additive, and is what field-aware forms consume.
 */
export interface ValidationErrorBody {
  statusCode: number;
  error: string;
  message: string[];
  errors: FieldErrorMap;
  correlationId: string;
}

/**
 * Flattens class-validator's nested ValidationError tree into a field->messages
 * map. Nested properties are dot-pathed (`address.city`), array items keep
 * their index (`items.0.name`), matching how forms name their inputs.
 */
export function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): FieldErrorMap {
  const map: FieldErrorMap = {};

  for (const error of errors) {
    const path = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (error.constraints) {
      const messages = Object.values(error.constraints);
      map[path] = [...(map[path] ?? []), ...messages];
    }

    if (error.children?.length) {
      const childMap = flattenValidationErrors(error.children, path);
      for (const [childPath, childMessages] of Object.entries(childMap)) {
        map[childPath] = [...(map[childPath] ?? []), ...childMessages];
      }
    }
  }

  return map;
}
