/**
 * Helpers for reading the backend's validation error body.
 *
 * The API returns validation failures as:
 *   { statusCode: 400, error: 'Bad Request',
 *     message: string[], errors: { field: string[] }, correlationId: string }
 *
 * `message` is kept as a string[] for backward compatibility with call sites
 * that pass it straight to a toast. Prefer `errors` for field-aware forms.
 */

export type FieldErrorMap = Record<string, string[]>;

interface ValidationErrorBody {
    statusCode?: number;
    error?: string;
    message?: string | string[];
    errors?: FieldErrorMap;
    correlationId?: string;
}

function getBody(error: any): ValidationErrorBody | undefined {
    return error?.response?.data;
}

/** True when this error carries a field-addressable validation payload. */
export function isValidationError(error: any): boolean {
    const body = getBody(error);
    return (
        error?.response?.status === 400 &&
        !!body?.errors &&
        Object.keys(body.errors).length > 0
    );
}

/** Field -> first message, shaped for a form's `errors` state. */
export function getFieldErrors(error: any): Record<string, string> {
    const body = getBody(error);
    if (!body?.errors) return {};

    return Object.entries(body.errors).reduce<Record<string, string>>(
        (acc, [field, messages]) => {
            if (messages?.length) acc[field] = messages[0];
            return acc;
        },
        {},
    );
}

/**
 * A single human-readable string for any API error.
 *
 * This is what fixes the comma-blob: Nest returns `message` as an array, and
 * call sites passing it straight to a toast rendered it joined by commas.
 */
export function getErrorMessage(error: any, fallback = 'Something went wrong.'): string {
    const body = getBody(error);
    const message = body?.message;

    if (Array.isArray(message)) {
        if (message.length === 0) return fallback;
        if (message.length === 1) return message[0];
        return `Please fix the following:\n• ${message.join('\n• ')}`;
    }

    if (typeof message === 'string' && message.trim()) return message;

    return fallback;
}

/** Correlation id from the server, for surfacing in support/debug contexts. */
export function getCorrelationId(error: any): string | undefined {
    return getBody(error)?.correlationId;
}
