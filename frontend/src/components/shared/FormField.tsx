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
    label: string;
    required?: boolean;
    error?: string;
    hint?: string;
    children: ReactNode;
    className?: string;
    id?: string;
    hideLabel?: boolean;
}

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
                {React.Children.map(children, (child) => {
                    if (React.isValidElement(child)) {
                        return React.cloneElement(child as React.ReactElement<any>, {
                            id,
                            'aria-required': required,
                            'aria-invalid': !!error,
                            'aria-describedby': error ? `${id}-error` : (hint ? `${id}-hint` : undefined),
                            className: cn(
                                child.props.className,
                                error && "border-destructive ring-destructive/20 focus-visible:ring-destructive"
                            ),
                        });
                    }
                    return child;
                })}
            </div>

            {error && (
                <p id={`${id}-error`} className="text-[11px] font-medium text-destructive animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}
        </div>
    );
};
