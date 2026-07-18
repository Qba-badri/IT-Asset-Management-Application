export type FieldType =
    | 'text'
    | 'number'
    | 'date'
    | 'select'
    | 'multiselect'
    | 'checkbox'
    | 'radio'
    | 'file'
    | 'unknown';

/** Sentinel values a select uses for "nothing chosen". */
const SELECT_PLACEHOLDERS = new Set(['', '-- Select --', 'none', 'null', 'undefined']);

/**
 * Whether a value counts as "missing" for a required field of the given type.
 *
 * Type matters: 0 is a legitimate number, false is a legitimate boolean, and an
 * empty array is an empty multi-select. Treating all of them as falsy — the
 * usual `if (!value)` shortcut — is the classic required-field bug.
 */
export function isEmptyValue(value: unknown, type: FieldType = 'unknown'): boolean {
    if (value === null || value === undefined) return true;

    switch (type) {
        case 'number':
            // 0 is a real value; only a non-number is missing.
            return typeof value === 'number'
                ? Number.isNaN(value)
                : String(value).trim() === '' || Number.isNaN(Number(value));

        case 'checkbox':
            // For a required checkbox, "required" means it must be checked.
            return value === false;

        case 'multiselect':
            return !Array.isArray(value) || value.length === 0;

        case 'date': {
            if (value instanceof Date) return Number.isNaN(value.getTime());
            if (typeof value === 'string') {
                if (!value.trim()) return true;
                return Number.isNaN(new Date(value).getTime());
            }
            return true;
        }

        case 'select':
        case 'radio':
            return typeof value === 'string'
                ? SELECT_PLACEHOLDERS.has(value.trim())
                : false;

        case 'file': {
            if (typeof File !== 'undefined' && value instanceof File) {
                return value.size === 0;
            }
            if (Array.isArray(value)) return value.length === 0;
            return typeof value === 'string' ? !value.trim() : false;
        }

        case 'text':
            return typeof value === 'string' ? !value.trim() : false;

        default:
            if (typeof value === 'string') return !value.trim();
            if (Array.isArray(value)) return value.length === 0;
            return false;
    }
}
