/**
 * Central catalog of client-side validation messages.
 *
 * Mirrors backend/src/common/validation/validation-messages.ts. Messages are
 * addressed by key so a translation provider can be dropped in later without
 * touching call sites — there is no i18n library in the app today, so
 * `resolveValidationMessage` returns the default English string.
 *
 * To localize: replace the DEFAULT_MESSAGES lookup with a `t(key, params)`
 * call. No call site changes.
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
    mustBeChecked: 'validation.mustBeChecked',
    file: 'validation.file',
    submitBlocked: 'validation.submitBlocked',
} as const;

type Interpolations = Record<string, string | number>;

const DEFAULT_MESSAGES: Record<string, string> = {
    [VALIDATION_MESSAGE_KEYS.required]: '{label} is required.',
    [VALIDATION_MESSAGE_KEYS.requiredWhen]: '{label} is required when {whenLabel} is {whenValue}.',
    [VALIDATION_MESSAGE_KEYS.email]: '{label} must be a valid email address.',
    [VALIDATION_MESSAGE_KEYS.phone]: '{label} must be a valid phone number.',
    [VALIDATION_MESSAGE_KEYS.minLength]: '{label} must be at least {min} characters.',
    [VALIDATION_MESSAGE_KEYS.maxLength]: '{label} must be at most {max} characters.',
    [VALIDATION_MESSAGE_KEYS.min]: '{label} must be at least {min}.',
    [VALIDATION_MESSAGE_KEYS.max]: '{label} must be at most {max}.',
    [VALIDATION_MESSAGE_KEYS.pattern]: '{label} is not in the expected format.',
    [VALIDATION_MESSAGE_KEYS.number]: '{label} must be a number.',
    [VALIDATION_MESSAGE_KEYS.date]: '{label} must be a valid date.',
    [VALIDATION_MESSAGE_KEYS.enum]: '{label} must be one of: {options}.',
    [VALIDATION_MESSAGE_KEYS.mustBeChecked]: '{label} must be checked.',
    [VALIDATION_MESSAGE_KEYS.file]: '{label} must be a valid file.',
    [VALIDATION_MESSAGE_KEYS.submitBlocked]: 'Please fix the highlighted fields before saving.',
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

export function resolveValidationMessage(key: string, interpolations: Interpolations = {}): string {
    const template = DEFAULT_MESSAGES[key];
    if (!template) return key;

    return template.replace(/\{(\w+)\}/g, (match, token: string) =>
        token in interpolations ? String(interpolations[token]) : match,
    );
}
