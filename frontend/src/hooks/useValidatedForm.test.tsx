import { act, renderHook, waitFor } from '@testing-library/react';
import { useValidatedForm, isFieldRequired } from './useValidatedForm';
import { fetchFormSchema, FormSchema } from '../services/schemaService';

jest.mock('../services/schemaService', () => ({
    ...jest.requireActual('../services/schemaService'),
    fetchFormSchema: jest.fn(),
}));

const mockFetch = fetchFormSchema as jest.MockedFunction<typeof fetchFormSchema>;

const assignmentSchema: FormSchema = {
    formKey: 'inventory-assignment.create',
    buildId: 'test-build',
    fields: [
        { name: 'itemId', type: 'number', required: true, rules: {} },
        {
            name: 'targetType',
            type: 'select',
            required: false,
            rules: { options: ['PERSON', 'LOCATION'] },
        },
        {
            name: 'userId',
            type: 'number',
            required: false,
            requiredWhen: [{ field: 'targetType', equals: ['PERSON'], defaultsTo: 'PERSON' }],
            rules: {},
        },
        {
            name: 'location',
            type: 'text',
            required: false,
            requiredWhen: [{ field: 'targetType', equals: ['LOCATION'] }],
            rules: {},
        },
        { name: 'quantity', type: 'number', required: true, rules: { min: 1 } },
        { name: 'department', type: 'text', required: false, rules: { maxLength: 5 } },
    ],
};

function setup(initialValues: Record<string, any> = {}) {
    return renderHook(() =>
        useValidatedForm({
            formKey: 'inventory-assignment.create',
            initialValues: {
                itemId: undefined,
                targetType: undefined,
                userId: undefined,
                location: undefined,
                quantity: undefined,
                department: undefined,
                ...initialValues,
            } as Record<string, any>,
        }),
    );
}

beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(assignmentSchema);
});

describe('isFieldRequired', () => {
    const userId = assignmentSchema.fields.find((f) => f.name === 'userId')!;
    const location = assignmentSchema.fields.find((f) => f.name === 'location')!;
    const itemId = assignmentSchema.fields.find((f) => f.name === 'itemId')!;

    it('is true for an unconditionally required field', () => {
        expect(isFieldRequired(itemId, {})).toBe(true);
    });

    it('honours defaultsTo when the gating field is absent', () => {
        expect(isFieldRequired(userId, {})).toBe(true);
    });

    it('is true when the condition matches', () => {
        expect(isFieldRequired(userId, { targetType: 'PERSON' })).toBe(true);
    });

    it('is false when the condition does not match', () => {
        expect(isFieldRequired(userId, { targetType: 'LOCATION' })).toBe(false);
    });

    it('enforces the LOCATION branch the old client lacked', () => {
        expect(isFieldRequired(location, { targetType: 'LOCATION' })).toBe(true);
        expect(isFieldRequired(location, { targetType: 'PERSON' })).toBe(false);
    });
});

describe('useValidatedForm', () => {
    it('loads the schema', async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.schemaLoading).toBe(false));
        expect(result.current.schema).toEqual(assignmentSchema);
    });

    it('blocks submit when a required field is empty', async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.schemaLoading).toBe(false));

        let valid = true;
        act(() => {
            valid = result.current.validateForm();
        });

        expect(valid).toBe(false);
        expect(result.current.errors.itemId).toBe('Item id is required.');
    });

    it('allows submit when every required field is filled', async () => {
        const { result } = setup({
            itemId: 1,
            targetType: 'PERSON',
            userId: 7,
            quantity: 2,
        });
        await waitFor(() => expect(result.current.schemaLoading).toBe(false));

        let valid = false;
        act(() => {
            valid = result.current.validateForm();
        });

        expect(valid).toBe(true);
        expect(result.current.errors).toEqual({});
    });

    /**
     * The bug this framework exists to kill: the old useForm ran `custom` rules
     * only inside `if (value)`, so a conditional-required rule could never fire
     * on an empty value. These assert the required check is independent of
     * truthiness.
     */
    describe('conditional required (the §2.1 regression)', () => {
        it('fires for an empty userId when targetType is PERSON', async () => {
            const { result } = setup({ itemId: 1, targetType: 'PERSON', quantity: 1 });
            await waitFor(() => expect(result.current.schemaLoading).toBe(false));

            let valid = true;
            act(() => {
                valid = result.current.validateForm();
            });

            expect(valid).toBe(false);
            expect(result.current.errors.userId).toBe('User id is required.');
        });

        it('fires for an empty userId when targetType is absent (defaults to PERSON)', async () => {
            const { result } = setup({ itemId: 1, quantity: 1 });
            await waitFor(() => expect(result.current.schemaLoading).toBe(false));

            act(() => {
                result.current.validateForm();
            });

            expect(result.current.errors.userId).toBe('User id is required.');
        });

        it('does not require userId when targetType is LOCATION', async () => {
            const { result } = setup({
                itemId: 1,
                targetType: 'LOCATION',
                location: 'Room 1',
                quantity: 1,
            });
            await waitFor(() => expect(result.current.schemaLoading).toBe(false));

            let valid = false;
            act(() => {
                valid = result.current.validateForm();
            });

            expect(valid).toBe(true);
        });

        it('requires location when targetType is LOCATION', async () => {
            const { result } = setup({ itemId: 1, targetType: 'LOCATION', quantity: 1 });
            await waitFor(() => expect(result.current.schemaLoading).toBe(false));

            act(() => {
                result.current.validateForm();
            });

            expect(result.current.errors.location).toBe('Location is required.');
        });

        it('re-evaluates a touched dependant when the gating field changes', async () => {
            const { result } = setup({ itemId: 1, targetType: 'PERSON', quantity: 1 });
            await waitFor(() => expect(result.current.schemaLoading).toBe(false));

            act(() => {
                result.current.validateForm();
            });
            expect(result.current.errors.userId).toBeDefined();

            // Switching to LOCATION makes userId no longer required.
            act(() => {
                result.current.handleChange('targetType', 'LOCATION');
            });

            await waitFor(() => expect(result.current.errors.userId).toBeUndefined());
        });
    });

    describe('field types', () => {
        it('accepts 0 for a required number field', async () => {
            const { result } = setup({
                itemId: 0,
                targetType: 'PERSON',
                userId: 0,
                quantity: 1,
            });
            await waitFor(() => expect(result.current.schemaLoading).toBe(false));

            act(() => {
                result.current.validateForm();
            });

            expect(result.current.errors.itemId).toBeUndefined();
            expect(result.current.errors.userId).toBeUndefined();
        });

        it('enforces min on a number', async () => {
            const { result } = setup({
                itemId: 1,
                targetType: 'PERSON',
                userId: 1,
                quantity: 0,
            });
            await waitFor(() => expect(result.current.schemaLoading).toBe(false));

            act(() => {
                result.current.validateForm();
            });

            expect(result.current.errors.quantity).toBe('Quantity must be at least 1.');
        });

        it('enforces maxLength on optional text but not its presence', async () => {
            const { result } = setup({
                itemId: 1,
                targetType: 'PERSON',
                userId: 1,
                quantity: 1,
                department: 'toolongvalue',
            });
            await waitFor(() => expect(result.current.schemaLoading).toBe(false));

            act(() => {
                result.current.validateForm();
            });

            expect(result.current.errors.department).toBe(
                'Department must be at most 5 characters.',
            );
        });

        it('rejects a value outside the enum options', async () => {
            const { result } = setup({
                itemId: 1,
                targetType: 'NONSENSE',
                quantity: 1,
            });
            await waitFor(() => expect(result.current.schemaLoading).toBe(false));

            act(() => {
                result.current.validateForm();
            });

            expect(result.current.errors.targetType).toContain('must be one of');
        });
    });

    describe('isRequired (drives the asterisk)', () => {
        it('reflects conditional required-ness as values change', async () => {
            const { result } = setup({ targetType: 'PERSON' });
            await waitFor(() => expect(result.current.schemaLoading).toBe(false));

            expect(result.current.isRequired('userId')).toBe(true);
            expect(result.current.isRequired('location')).toBe(false);

            act(() => {
                result.current.handleChange('targetType', 'LOCATION');
            });

            await waitFor(() => expect(result.current.isRequired('userId')).toBe(false));
            expect(result.current.isRequired('location')).toBe(true);
        });
    });

    describe('server error mapping', () => {
        it('applies field errors from a 400 onto the fields', async () => {
            const { result } = setup();
            await waitFor(() => expect(result.current.schemaLoading).toBe(false));

            act(() => {
                result.current.applyServerErrors({ itemId: 'Item does not exist.' });
            });

            expect(result.current.errors.itemId).toBe('Item does not exist.');
        });
    });

    describe('when the schema cannot be loaded', () => {
        // The schema is a UX optimization, not the enforcement boundary — the
        // form must stay usable and let the server validate.
        it('does not block submission', async () => {
            mockFetch.mockResolvedValue(null);
            const { result } = setup();
            await waitFor(() => expect(result.current.schemaLoading).toBe(false));

            let valid = false;
            act(() => {
                valid = result.current.validateForm();
            });

            expect(valid).toBe(true);
            expect(result.current.errors).toEqual({});
        });

        it('reports nothing as required', async () => {
            mockFetch.mockResolvedValue(null);
            const { result } = setup();
            await waitFor(() => expect(result.current.schemaLoading).toBe(false));

            expect(result.current.isRequired('itemId')).toBe(false);
        });
    });

    describe('cross-field validators (the non-declarative escape hatch)', () => {
        it('surfaces an error the schema cannot express', async () => {
            const { result } = renderHook(() =>
                useValidatedForm({
                    formKey: 'inventory-assignment.create',
                    initialValues: {
                        itemId: 1,
                        targetType: 'PERSON',
                        userId: 1,
                        quantity: 1,
                    } as Record<string, any>,
                    crossFieldValidators: [
                        (values) =>
                            values.quantity > 0 && values.itemId === 1
                                ? { quantity: 'Item 1 is out of stock.' }
                                : {},
                    ],
                }),
            );
            await waitFor(() => expect(result.current.schemaLoading).toBe(false));

            let valid = true;
            act(() => {
                valid = result.current.validateForm();
            });

            expect(valid).toBe(false);
            expect(result.current.errors.quantity).toBe('Item 1 is out of stock.');
        });
    });

    describe('resetForm', () => {
        it('clears errors and restores values', async () => {
            const { result } = setup();
            await waitFor(() => expect(result.current.schemaLoading).toBe(false));

            act(() => {
                result.current.validateForm();
            });
            expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

            act(() => {
                result.current.resetForm();
            });

            expect(result.current.errors).toEqual({});
            expect(result.current.touched).toEqual({});
        });
    });
});
