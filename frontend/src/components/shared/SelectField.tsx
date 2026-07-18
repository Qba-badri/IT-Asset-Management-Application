import React, { ReactNode } from 'react';
import {
    Select,
    SelectContent,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { cn } from '../../lib/utils';

interface SelectFieldProps {
    value?: string;
    onValueChange: (value: string) => void;
    onBlur?: () => void;
    placeholder?: string;
    disabled?: boolean;
    /** SelectItem children. */
    children: ReactNode;

    /**
     * Injected by FormField via cloneElement — not passed by callers.
     * Radix's Select root renders no DOM and accepts none of these, so they are
     * forwarded to the trigger, which is the element the user actually focuses.
     */
    id?: string;
    className?: string;
    'aria-required'?: boolean;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
}

/**
 * A Radix Select that works as a FormField child.
 *
 * FormField clones id / aria-required / aria-invalid / aria-describedby /
 * className onto whatever it wraps. A native <input> or <select> absorbs those
 * directly, but Radix's <Select> is a context provider with no DOM node, so the
 * props would vanish — leaving the control unlabelled for assistive tech and
 * unstyled when in error. This adapter lands them on <SelectTrigger>.
 *
 * Exists so migrating a form to the validation framework does not force a
 * downgrade from Radix Select to a native <select>, which would change how
 * existing screens look and behave.
 */
export const SelectField: React.FC<SelectFieldProps> = ({
    value,
    onValueChange,
    onBlur,
    placeholder,
    disabled,
    children,
    id,
    className,
    'aria-required': ariaRequired,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
}) => (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
            id={id}
            onBlur={onBlur}
            className={cn(className)}
            aria-required={ariaRequired}
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedBy}
        >
            <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
    </Select>
);
