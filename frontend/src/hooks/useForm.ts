import { useState, useCallback } from 'react';

export interface ValidationRule {
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

        if (rule.required && (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0))) {
            return 'This field is required.';
        }

        if (value) {
            if (rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return 'Please enter a valid email address.';
            }
            if (rule.phone && !/^\+?[1-9]\d{1,14}$/.test(value.replace(/\D/g, ''))) {
                return 'Please enter a valid phone number.';
            }
            if (rule.minLength && String(value).length < rule.minLength) {
                return `Minimum ${rule.minLength} characters required.`;
            }
            if (rule.maxLength && String(value).length > rule.maxLength) {
                return `Maximum ${rule.maxLength} characters allowed.`;
            }
            if (rule.min !== undefined && Number(value) < rule.min) {
                return `Value must be at least ${rule.min}.`;
            }
            if (rule.max !== undefined && Number(value) > rule.max) {
                return `Value must be at most ${rule.max}.`;
            }
            if (rule.pattern && !rule.pattern.test(value)) {
                return 'Invalid format.';
            }
            if (rule.custom) {
                return rule.custom(value, values);
            }
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

    return {
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        validateForm,
        resetForm,
        setValues
    };
}
