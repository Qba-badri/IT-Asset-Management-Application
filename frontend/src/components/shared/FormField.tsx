import React, { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';

interface FormFieldProps {
    /**
     * ReactNode rather than string so a label can carry an icon alongside its
     * text, which several forms already did before adopting this component.
     * A plain string remains the common case.
     */
    label: ReactNode;
    required?: boolean;
    error?: string;
    hint?: string;
    children: ReactNode;
    className?: string;
    id?: string;
    hideLabel?: boolean;
}

/** Host elements that count as the field's control; components always do. */
const HOST_CONTROL_TAGS = ['input', 'select', 'textarea'];

export const FormField: React.FC<FormFieldProps> = ({
    label,
    required,
    error,
    hint,
    children,
    className,
    id,
    hideLabel = false,
}) => {
    /**
     * Lands id / aria-* / error styling on the field's actual control.
     *
     * Fields like password inputs wrap the control in a plain <div> (for an
     * absolutely-positioned toggle button), so cloning onto the direct child
     * would put the red border and the label's `for` target on a borderless
     * div. Recurse through host <div> wrappers to the first real control.
     * Auxiliary controls that carry their own aria-label (e.g. a currency
     * picker beside a cost input) are left alone.
     */
    let injected = false;
    const injectFieldProps = (child: ReactNode): ReactNode => {
        if (!React.isValidElement(child) || injected) return child;
        if (child.type === 'div') {
            return React.cloneElement(child as React.ReactElement<any>, {
                children: React.Children.map((child.props as any).children, injectFieldProps),
            });
        }
        const isControl = typeof child.type !== 'string' || HOST_CONTROL_TAGS.includes(child.type);
        if (!isControl || (child.props as any)['aria-label']) return child;
        injected = true;
        return React.cloneElement(child as React.ReactElement<any>, {
            id,
            'aria-required': required,
            'aria-invalid': !!error,
            'aria-describedby': error ? `${id}-error` : (hint ? `${id}-hint` : undefined),
            className: cn(
                (child.props as any).className,
                error && "border-destructive ring-destructive/20 focus-visible:ring-destructive"
            ),
        });
    };

    return (
        <div className={cn("space-y-1.5", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <Label htmlFor={id} className={cn(error && "text-destructive", hideLabel && "sr-only")}>
                        {label}
                        {required && <span className="ml-1 text-destructive font-bold">*</span>}
                    </Label>
                    {hint && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button type="button" tabIndex={-1} className="text-muted-foreground hover:text-foreground outline-none">
                                        <Info className="h-3.5 w-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs text-xs">{hint}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </div>

            <div className="relative">
                {React.Children.map(children, injectFieldProps)}
            </div>

            {error && (
                <p id={`${id}-error`} className="text-[11px] font-medium text-destructive animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}
        </div>
    );
};
