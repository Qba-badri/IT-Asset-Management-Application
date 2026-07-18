import {
    getCorrelationId,
    getErrorMessage,
    getFieldErrors,
    isValidationError,
} from './validationErrors';

function axiosError(status: number, data: any) {
    return { response: { status, data } };
}

describe('isValidationError', () => {
    it('is true for a 400 carrying a field error map', () => {
        expect(
            isValidationError(
                axiosError(400, { errors: { name: ['Name is required.'] } }),
            ),
        ).toBe(true);
    });

    it('is false for a 400 without field errors (hand-thrown business error)', () => {
        expect(
            isValidationError(
                axiosError(400, { message: 'Cannot assign expired license.' }),
            ),
        ).toBe(false);
    });

    it('is false for a 400 with an empty error map', () => {
        expect(isValidationError(axiosError(400, { errors: {} }))).toBe(false);
    });

    it('is false for non-400 statuses', () => {
        expect(
            isValidationError(axiosError(500, { errors: { a: ['b'] } })),
        ).toBe(false);
    });

    it('is false for a network error with no response', () => {
        expect(isValidationError(new Error('Network Error'))).toBe(false);
    });
});

describe('getFieldErrors', () => {
    it('maps each field to its first message', () => {
        const error = axiosError(400, {
            errors: {
                name: ['Name is required.'],
                email: ['Email must be valid.', 'Email is too long.'],
            },
        });

        expect(getFieldErrors(error)).toEqual({
            name: 'Name is required.',
            email: 'Email must be valid.',
        });
    });

    it('skips fields with no messages', () => {
        expect(getFieldErrors(axiosError(400, { errors: { name: [] } }))).toEqual(
            {},
        );
    });

    it('returns an empty object when there is no error body', () => {
        expect(getFieldErrors(new Error('boom'))).toEqual({});
    });
});

describe('getErrorMessage', () => {
    // This is the comma-blob regression: Nest sends `message` as a string[],
    // and call sites passed it straight to a toast.
    it('does not comma-join a multi-message array', () => {
        const error = axiosError(400, {
            message: ['Name is required.', 'Email must be valid.'],
        });

        const result = getErrorMessage(error);

        expect(result).not.toBe('Name is required.,Email must be valid.');
        expect(result).toContain('Name is required.');
        expect(result).toContain('Email must be valid.');
    });

    it('returns a single-message array as a bare string', () => {
        expect(
            getErrorMessage(axiosError(400, { message: ['Name is required.'] })),
        ).toBe('Name is required.');
    });

    it('passes a plain string message through unchanged', () => {
        expect(
            getErrorMessage(
                axiosError(400, { message: 'Cannot assign expired license.' }),
            ),
        ).toBe('Cannot assign expired license.');
    });

    it('falls back when the message array is empty', () => {
        expect(getErrorMessage(axiosError(400, { message: [] }), 'Failed.')).toBe(
            'Failed.',
        );
    });

    it('falls back when the message is whitespace only', () => {
        expect(getErrorMessage(axiosError(400, { message: '   ' }), 'Failed.')).toBe(
            'Failed.',
        );
    });

    it('falls back for a network error with no response', () => {
        expect(getErrorMessage(new Error('Network Error'), 'Failed.')).toBe(
            'Failed.',
        );
    });
});

describe('getCorrelationId', () => {
    it('reads the correlation id when present', () => {
        expect(
            getCorrelationId(axiosError(400, { correlationId: 'abc-123' })),
        ).toBe('abc-123');
    });

    it('is undefined when absent', () => {
        expect(getCorrelationId(axiosError(400, {}))).toBeUndefined();
    });
});
