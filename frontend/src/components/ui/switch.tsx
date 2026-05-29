import * as React from "react"
import { cn } from "../../lib/utils"

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'checked' | 'defaultChecked' | 'onChange'> {
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, checked, defaultChecked, onCheckedChange, ...props }, ref) => (
        <label className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 bg-input has-[:checked]:bg-primary">
            <input
                type="checkbox"
                className="peer sr-only"
                checked={checked}
                defaultChecked={defaultChecked}
                onChange={(e) => onCheckedChange?.(e.target.checked)}
                ref={ref}
                {...props}
            />
            <div className="pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform peer-checked:translate-x-4" />
        </label>
    )
)

Switch.displayName = "Switch"

export { Switch }
