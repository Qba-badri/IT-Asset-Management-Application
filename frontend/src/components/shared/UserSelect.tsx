import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown, X, Loader2 } from 'lucide-react';
import { User } from '../../services/userService';
import { Button } from '../ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '../ui/command';
import { cn } from '../../lib/utils';

export const userDisplayName = (user: User): string =>
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;

interface UserSelectProps {
    users: User[];
    /** Selected user id. Accepts the string/number the surrounding form already holds. */
    value: number | string | null | undefined;
    /** Receives the raw user id, or null when cleared. Callers cast to their own form's type. */
    onChange: (userId: number | null) => void;
    id?: string;
    placeholder?: string;
    loading?: boolean;
    disabled?: boolean;
    clearable?: boolean;
    /** Accessible name when no visible <Label htmlFor> is associated. */
    ariaLabel?: string;
}

/**
 * Searchable user picker. Matches on name *and* email, and renders each option
 * as name over email on two lines.
 *
 * Implemented as a plain inline dropdown rather than a Radix Popover, so the
 * panel stays in the normal DOM instead of a portal that has to be positioned
 * and dismissed against the surrounding Dialog. cmdk supplies filtering and
 * keyboard handling; its onSelect fires for both mouse and keyboard.
 *
 * Filtering is client-side: GET /users returns the full list with no query or
 * pagination support, so there is nothing to debounce against. If that endpoint
 * gains server-side search, swap the filter below for a debounced fetch.
 */
const UserSelect: React.FC<UserSelectProps> = ({
    users,
    value,
    onChange,
    id,
    placeholder = 'Select user...',
    loading = false,
    disabled = false,
    clearable = false,
    ariaLabel,
}) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selected = useMemo(() => {
        if (value === null || value === undefined || value === '') return undefined;
        return users.find((u) => String(u.id) === String(value));
    }, [users, value]);

    // Close on outside click / Escape. Bound to the container, so clicks *inside*
    // the panel are never treated as outside — the bug the popover version had.
    useEffect(() => {
        if (!open) return undefined;
        const onDocMouseDown = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onDocMouseDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDocMouseDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const select = (userId: number) => {
        onChange(userId);
        setOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            <Button
                id={id}
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-label={ariaLabel}
                disabled={disabled || loading}
                onClick={() => setOpen((o) => !o)}
                className="w-full justify-between h-auto min-h-10 px-3 py-2 font-normal"
            >
                {loading ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading users...
                    </span>
                ) : selected ? (
                    // Same name-over-email layout as the options, so the selection stays readable.
                    <span className="flex flex-col items-start text-left min-w-0">
                        <span className="truncate">{userDisplayName(selected)}</span>
                        <span className="text-xs text-muted-foreground truncate">{selected.email}</span>
                    </span>
                ) : (
                    <span className="text-muted-foreground">{placeholder}</span>
                )}
                <span className="flex items-center gap-1 shrink-0">
                    {clearable && selected && !disabled && (
                        <span
                            role="button"
                            tabIndex={0}
                            aria-label="Clear selection"
                            className="rounded-sm p-0.5 opacity-60 hover:opacity-100 hover:bg-accent"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onChange(null);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onChange(null);
                                }
                            }}
                        >
                            <X className="h-3.5 w-3.5" />
                        </span>
                    )}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </span>
            </Button>

            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
                    <Command
                        // cmdk matches against each item's `value`; including the email
                        // there is what makes searching by email work alongside name.
                        filter={(itemValue, search) =>
                            itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
                        }
                    >
                        <CommandInput placeholder="Search by name or email..." autoFocus />
                        <CommandList>
                            <CommandEmpty>No users found</CommandEmpty>
                            <CommandGroup>
                                {users.map((user) => (
                                    <CommandItem
                                        key={user.id}
                                        value={`${userDisplayName(user)} ${user.email}`}
                                        onSelect={() => select(user.id)}
                                        className="gap-2 cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                'h-4 w-4 shrink-0',
                                                selected?.id === user.id ? 'opacity-100' : 'opacity-0'
                                            )}
                                        />
                                        <span className="flex flex-col min-w-0">
                                            <span className="truncate">{userDisplayName(user)}</span>
                                            <span className="text-xs text-muted-foreground truncate">
                                                {user.email}
                                            </span>
                                        </span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </div>
            )}
        </div>
    );
};

export default UserSelect;
