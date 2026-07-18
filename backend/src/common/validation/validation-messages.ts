/**
 * Central catalog of validation messages.
 *
 * Messages are addressed by key so they can be routed through a translation
 * provider later without touching call sites. There is no i18n library in the
 * app today, so `resolve` returns the default English string; swapping in a
 * provider means changing this file only.
 */

export const VALIDATION_MESSAGE_KEYS = {
  required: 'validation.required',
  requiredWhen: 'validation.requiredWhen',
  email: 'validation.email',
  phone: 'validation.phone',
  minLength: 'validation.minLength',
  maxLength: 'validation.maxLength',
  min: 'validation.min',
  max: 'validation.max',
  pattern: 'validation.pattern',
  number: 'validation.number',
  date: 'validation.date',
  enum: 'validation.enum',
  boolean: 'validation.boolean',
  array: 'validation.array',
  mustBeChecked: 'validation.mustBeChecked',
  file: 'validation.file',
} as const;

export type ValidationMessageKey =
  (typeof VALIDATION_MESSAGE_KEYS)[keyof typeof VALIDATION_MESSAGE_KEYS];

type Interpolations = Record<string, string | number>;

const DEFAULT_MESSAGES: Record<string, string> = {
  [VALIDATION_MESSAGE_KEYS.required]: '{label} is required.',
  [VALIDATION_MESSAGE_KEYS.requiredWhen]:
    '{label} is required when {whenLabel} is {whenValue}.',
  [VALIDATION_MESSAGE_KEYS.email]: '{label} must be a valid email address.',
  [VALIDATION_MESSAGE_KEYS.phone]: '{label} must be a valid phone number.',
  [VALIDATION_MESSAGE_KEYS.minLength]:
    '{label} must be at least {min} characters.',
  [VALIDATION_MESSAGE_KEYS.maxLength]:
    '{label} must be at most {max} characters.',
  [VALIDATION_MESSAGE_KEYS.min]: '{label} must be at least {min}.',
  [VALIDATION_MESSAGE_KEYS.max]: '{label} must be at most {max}.',
  [VALIDATION_MESSAGE_KEYS.pattern]: '{label} is not in the expected format.',
  [VALIDATION_MESSAGE_KEYS.number]: '{label} must be a number.',
  [VALIDATION_MESSAGE_KEYS.date]: '{label} must be a valid date.',
  [VALIDATION_MESSAGE_KEYS.enum]: '{label} must be one of: {options}.',
  [VALIDATION_MESSAGE_KEYS.boolean]: '{label} must be true or false.',
  [VALIDATION_MESSAGE_KEYS.array]: '{label} must be a list.',
  [VALIDATION_MESSAGE_KEYS.mustBeChecked]: '{label} must be checked.',
  [VALIDATION_MESSAGE_KEYS.file]: '{label} must be a valid file.',
};

/** Turns `camelCaseFieldName` into `Camel case field name` for message labels. */
export function humanizeFieldName(field: string): string {
  const spaced = field
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  if (!spaced) return field;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

export function resolveValidationMessage(
  key: string,
  interpolations: Interpolations = {},
): string {
  const template = DEFAULT_MESSAGES[key];
  if (!template) return key;

  return template.replace(/\{(\w+)\}/g, (match, token: string) =>
    token in interpolations ? String(interpolations[token]) : match,
  );
}
