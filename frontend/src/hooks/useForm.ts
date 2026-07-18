import { useState, useCallback } from 'react';
import { resolveValidationMessage, VALIDATION_MESSAGE_KEYS, humanizeFieldName } from '../lib/validation/messages';

export interface ValidationRule {
    /** Human label used in error messages; falls back to a humanized field name. */
    label?: string;
    required?: boolean;
    email?: boolean;
    phone?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any, allValues: any) => string | null;
}

export interface FormConfig<T> {
    [key: string]: ValidationRule;
}

export function useForm<T extends Record<string, any>>(
    initialValues: T,
    config: FormConfig<T>
) {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<{ [K in keyof T]?: string }>({});
    const [touched, setTouched] = useState<{ [K in keyof T]?: boolean }>({});

    const validateField = useCallback((name: keyof T, value: any) => {
        const rule = config[name as string];
        if (!rule) return null;

        const label = rule.label ?? humanizeFieldName(name as string);

        if (rule.required && (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0))) {
            return resolveValidationMessage(VALIDATION_MESSAGE_KEYS.required, { label });
        }

        if (value) {
            if (rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return resolveValidationMessage(VALIDATION_MESSAGE_KEYS.email, { label });
            }
            if (rule.phone && !/^\+?[1-9]\d{1,14}$/.test(value.replace(/\D/g, ''))) {
                return resolveValidationMessage(VALIDATION_MESSAGE_KEYS.phone, { label });
            }
            if (rule.minLength && String(value).length < rule.minLength) {
                return resolveValidationMessage(VALIDATION_MESSAGE_KEYS.minLength, { label, min: rule.minLength });
            }
            if (rule.maxLength && String(value).length > rule.maxLength) {
                return resolveValidationMessage(VALIDATION_MESSAGE_KEYS.maxLength, { label, max: rule.maxLength });
            }
            if (rule.min !== undefined && Number(value) < rule.min) {
                return resolveValidationMessage(VALIDATION_MESSAGE_KEYS.min, { label, min: rule.min });
            }
            if (rule.max !== undefined && Number(value) > rule.max) {
                return resolveValidationMessage(VALIDATION_MESSAGE_KEYS.max, { label, max: rule.max });
            }
            if (rule.pattern && !rule.pattern.test(value)) {
                return resolveValidationMessage(VALIDATION_MESSAGE_KEYS.pattern, { label });
            }
        }

        // Runs even for empty values: a custom rule may express conditional
        // requiredness (e.g. "location required when target is LOCATION"),
        // which nesting inside `if (value)` silently disabled.
        if (rule.custom) {
            return rule.custom(value, values);
        }

        return null;
    }, [config]);

    const handleChange = useCallback((name: keyof T, value: any) => {
        setValues(prev => ({ ...prev, [name]: value }));

        // Clear error as soon as it becomes valid if it was already touched or had an error
        if (errors[name] || touched[name]) {
            const error = validateField(name, value);
            setErrors(prev => ({ ...prev, [name]: error || undefined }));
        }
    }, [errors, touched, validateField]);

    const handleBlur = useCallback((name: keyof T) => {
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, values[name]);
        setErrors(prev => ({ ...prev, [name]: error || undefined }));
    }, [validateField, values]);

    const validateForm = useCallback(() => {
        const newErrors: { [K in keyof T]?: string } = {};
        let firstInvalid: keyof T | null = null;

        Object.keys(config).forEach(key => {
            const error = validateField(key as keyof T, values[key as keyof T]);
            if (error) {
                newErrors[key as keyof T] = error;
                if (!firstInvalid) firstInvalid = key as keyof T;
            }
        });

        setErrors(newErrors);
        setTouched(Object.keys(config).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

        if (firstInvalid) {
            const element = document.getElementById(firstInvalid as string);
            if (element) {
                element.focus();
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false;
        }

        return true;
    }, [config, validateField, values]);

    const resetForm = useCallback((newValues?: T) => {
        setValues(newValues || initialValues);
        setErrors({});
        setTouched({});
    }, [initialValues]);

    /** Maps errors found outside the declarative rules (e.g. a server 400) onto fields. */
    const setFieldErrors = useCallback((fieldErrors: Partial<{ [K in keyof T]: string }>) => {
        setErrors(prev => ({ ...prev, ...fieldErrors }));
        setTouched(prev => ({
            ...prev,
            ...Object.keys(fieldErrors).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
        }));
    }, []);

    return {
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        validateForm,
        resetForm,
        setValues,
        setFieldErrors
    };
}
