import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FieldSchema, FormSchema, fetchFormSchema } from '../services/schemaService';
import { isEmptyValue } from '../lib/validation/isEmpty';
import { resolveValidationMessage, VALIDATION_MESSAGE_KEYS, humanizeFieldName } from '../lib/validation/messages';

/** A rule the declarative schema cannot express (e.g. expiry after purchase). */
export type CrossFieldValidator<T> = (values: T) => Partial<Record<keyof T, string>>;

export interface UseValidatedFormOptions<T> {
    /** Registry key for the DTO that defines this form's rules. */
    formKey: string;
    initialValues: T;
    /** Human labels per field; falls back to a humanized field name. */
    labels?: Partial<Record<keyof T, string>>;
    /** Escape hatch for rules that are not declarative. */
    crossFieldValidators?: CrossFieldValidator<T>[];
}

function conditionMet(
    condition: { field: string; equals: unknown[]; defaultsTo?: unknown },
    values: Record<string, any>,
): boolean {
    const actual = values[condition.field];
    const effective = actual === undefined || actual === null ? condition.defaultsTo : actual;
    return condition.equals.some((candidate) => candidate === effective);
}

/** Whether a field is required given the current form values. */
export function isFieldRequired(field: FieldSchema, values: Record<string, any>): boolean {
    if (field.required) return true;
    if (!field.requiredWhen?.length) return false;
    return field.requiredWhen.some((condition) => conditionMet(condition, values));
}

/**
 * Schema-driven form state.
 *
 * Rules come from the server's reflected DTO metadata, so the client cannot
 * hold a rule the DTO does not have.
 *
 * Note the ordering below: the required check runs before and independently of
 * the value-shape checks. The previous hand-rolled hook nested its conditional
 * rules inside `if (value)`, which meant a conditional-required rule could
 * never fire on an empty value — the exact bug this replaces.
 */
export function useValidatedForm<T extends Record<string, any>>({
    formKey,
    initialValues,
    labels,
    crossFieldValidators = [],
}: UseValidatedFormOptions<T>) {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
    const [schema, setSchema] = useState<FormSchema | null>(null);
    const [schemaLoading, setSchemaLoading] = useState(true);

    // Keeps validate callbacks stable while still seeing the latest values.
    const valuesRef = useRef(values);
    valuesRef.current = values;

    useEffect(() => {
        let cancelled = false;
        setSchemaLoading(true);

        fetchFormSchema(formKey).then((loaded) => {
            if (cancelled) return;
            setSchema(loaded);
            setSchemaLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, [formKey]);

    const fieldsByName = useMemo(() => {
        const map = new Map<string, FieldSchema>();
        schema?.fields.forEach((field) => map.set(field.name, field));
        return map;
    }, [schema]);

    const labelFor = useCallback(
        (name: string) => labels?.[name as keyof T] ?? humanizeFieldName(name),
        [labels],
    );

    const validateField = useCallback(
        (name: keyof T, value: any, allValues: T): string | null => {
            const field = fieldsByName.get(name as string);
            if (!field) return null;

            const label = labelFor(name as string);

            // Required is checked first and unconditionally — never nested
            // inside a truthiness guard.
            if (isFieldRequired(field, allValues) && isEmptyValue(value, field.type)) {
                return resolveValidationMessage(VALIDATION_MESSAGE_KEYS.required, { label });
            }

            // Shape checks only apply to a value that is actually present.
            if (isEmptyValue(value, field.type)) return null;

            const { rules } = field;

            if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
                return resolveValidationMessage(VALIDATION_MESSAGE_KEYS.email, { label });
            }
            if (rules.minLength !== undefined && String(value).length < rules.minLength) {
                return resolveValidationMessage(VALIDATION_MESSAGE_KEYS.minLength, {
                    label,
                    min: rules.minLength,
                });
            }
            if (rules.maxLength !== undefined && String(value).length > rules.maxLength) {
                return resolveValidationMessage(VALIDATION_MESSAGE_KEYS.maxLength, {
                    label,
                    max: rules.maxLength,
                });
            }
            if (rules.min !== undefined && Number(value) < rules.min) {
                return resolveValidationMessage(VALIDATION_MESSAGE_KEYS.min, {
                    label,
                    min: rules.min,
                });
            }
            if (rules.max !== undefined && Number(value) > rules.max) {
                return resolveValidationMessage(VALIDATION_MESSAGE_KEYS.max, {
                    label,
                    max: rules.max,
                });
            }
            if (rules.options?.length && !rules.options.includes(String(value))) {
                return resolveValidationMessage(VALIDATION_MESSAGE_KEYS.enum, {
                    label,
                    options: rules.options.join(', '),
                });
            }

            return null;
        },
        [fieldsByName, labelFor],
    );

    const handleChange = useCallback(
        (name: keyof T, value: any) => {
            setValues((prev) => {
                const next = { ...prev, [name]: value };
                valuesRef.current = next;

                setErrors((prevErrors) => {
                    const updated = { ...prevErrors };

                    if (prevErrors[name] || touched[name]) {
                        const error = validateField(name, value, next);
                        if (error) updated[name] = error;
                        else delete updated[name];
                    }

                    // Changing a gating field flips other fields' required-ness,
                    // so re-check any already-touched dependants.
                    fieldsByName.forEach((field) => {
                        const gatedBy = field.requiredWhen?.some((c) => c.field === name);
                        if (!gatedBy) return;

                        const dependant = field.name as keyof T;
                        if (!touched[dependant] && !prevErrors[dependant]) return;

                        const error = validateField(dependant, next[dependant], next);
                        if (error) updated[dependant] = error;
                        else delete updated[dependant];
                    });

                    return updated;
                });

                return next;
            });
        },
        [fieldsByName, touched, validateField],
    );

    const handleBlur = useCallback(
        (name: keyof T) => {
            setTouched((prev) => ({ ...prev, [name]: true }));
            const error = validateField(name, valuesRef.current[name], valuesRef.current);
            setErrors((prev) => {
                const updated = { ...prev };
                if (error) updated[name] = error;
                else delete updated[name];
                return updated;
            });
        },
        [validateField],
    );

    const validateForm = useCallback((): boolean => {
        const current = valuesRef.current;
        const newErrors: Partial<Record<keyof T, string>> = {};

        fieldsByName.forEach((_field, name) => {
            const error = validateField(name as keyof T, current[name], current);
            if (error) newErrors[name as keyof T] = error;
        });

        for (const validator of crossFieldValidators) {
            Object.entries(validator(current)).forEach(([name, message]) => {
                if (message && !newErrors[name as keyof T]) {
                    newErrors[name as keyof T] = message as string;
                }
            });
        }

        setErrors(newErrors);
        setTouched(
            Object.keys(current).reduce(
                (acc, key) => ({ ...acc, [key]: true }),
                {} as Partial<Record<keyof T, boolean>>,
            ),
        );

        const firstInvalid = Object.keys(newErrors)[0];
        if (firstInvalid) {
            const element = document.getElementById(firstInvalid);
            element?.focus();
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return false;
        }

        return true;
    }, [crossFieldValidators, fieldsByName, validateField]);

    /** Maps a server 400 back onto the fields that caused it. */
    const applyServerErrors = useCallback((fieldErrors: Record<string, string>) => {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
        setTouched((prev) => ({
            ...prev,
            ...Object.keys(fieldErrors).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
        }));

        const first = Object.keys(fieldErrors)[0];
        if (first) document.getElementById(first)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, []);

    const resetForm = useCallback(
        (newValues?: T) => {
            const next = newValues ?? initialValues;
            setValues(next);
            valuesRef.current = next;
            setErrors({});
            setTouched({});
        },
        [initialValues],
    );

    /** Whether to render the asterisk, given current values. */
    const isRequired = useCallback(
        (name: keyof T): boolean => {
            const field = fieldsByName.get(name as string);
            return field ? isFieldRequired(field, values) : false;
        },
        [fieldsByName, values],
    );

    return {
        values,
        errors,
        touched,
        schema,
        schemaLoading,
        isRequired,
        handleChange,
        handleBlur,
        validateForm,
        applyServerErrors,
        resetForm,
        setValues,
    };
}
