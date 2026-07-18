import React from 'react';
import { Loader2 } from 'lucide-react';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

interface StatusToggleProps {
    checked: boolean;
    /**
     * Called with the *next* value when the user flips the switch. The parent
     * owns the confirmation dialog, the API call, the optimistic update /
     * rollback, and the toast.
     */
    onToggle?: (next: boolean) => void;
    /** Request in flight for this row — switch is disabled and a spinner shows. */
    loading?: boolean;
    /**
     * Disables the switch (e.g. protected system role, own account). With no
     * onToggle at all the control renders as a read-only badge instead —
     * the view for users without the manage permission.
     */
    disabled?: boolean;
    /** Tooltip-style explanation for why the toggle is disabled. */
    disabledReason?: string;
    labels?: { on?: string; off?: string };
    /** Accessible name for the switch, e.g. `Toggle status for IT Manager`. */
    ariaLabel?: string;
}

/**
 * The one Active/Inactive control used by every admin table's Status column.
 * Mirrors the User module's pattern: editors see a switch with a label,
 * read-only viewers see a colored badge.
 */
export const StatusToggle: React.FC<StatusToggleProps> = ({
    checked,
    onToggle,
    loading = false,
    disabled = false,
    disabledReason,
    labels,
    ariaLabel,
}) => {
    const onLabel = labels?.on ?? 'Active';
    const offLabel = labels?.off ?? 'Inactive';

    if (!onToggle) {
        return (
            <Badge variant={checked ? 'success' : 'destructive'}>
                {checked ? onLabel : offLabel}
            </Badge>
        );
    }

    return (
        <div className="flex items-center gap-2" title={disabled ? disabledReason : undefined}>
            <Switch
                checked={checked}
                disabled={disabled || loading}
                onCheckedChange={(next) => onToggle(!!next)}
                aria-label={ariaLabel}
            />
            <span
                className={cn(
                    'text-xs font-medium',
                    checked ? 'text-emerald-600' : 'text-muted-foreground',
                )}
            >
                {checked ? onLabel : offLabel}
            </span>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
    );
};
