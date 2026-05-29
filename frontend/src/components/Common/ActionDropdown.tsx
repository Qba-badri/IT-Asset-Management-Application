import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export interface ActionItem {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger' | 'primary' | 'success';
    disabled?: boolean;
}

interface ActionDropdownProps {
    actions: ActionItem[];
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({ actions }) => {
    const dangerActions = actions.filter(a => a.variant === 'danger');
    const normalActions = actions.filter(a => a.variant !== 'danger');

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {normalActions.map((action, index) => (
                    <DropdownMenuItem
                        key={index}
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className={cn(
                            'gap-2',
                            action.variant === 'success' && 'text-emerald-600',
                            action.variant === 'primary' && 'text-primary',
                        )}
                    >
                        {action.icon}
                        {action.label}
                    </DropdownMenuItem>
                ))}
                {dangerActions.length > 0 && normalActions.length > 0 && (
                    <DropdownMenuSeparator />
                )}
                {dangerActions.map((action, index) => (
                    <DropdownMenuItem
                        key={`d-${index}`}
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className="gap-2 text-destructive focus:text-destructive"
                    >
                        {action.icon}
                        {action.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default ActionDropdown;
