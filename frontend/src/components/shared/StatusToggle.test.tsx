import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusToggle } from './StatusToggle';

describe('StatusToggle', () => {
    it('renders a read-only badge when no onToggle is provided', () => {
        render(<StatusToggle checked={true} />);
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('renders an editable switch that reports the next value', () => {
        const onToggle = jest.fn();
        render(<StatusToggle checked={true} onToggle={onToggle} ariaLabel="Toggle status for X" />);
        fireEvent.click(screen.getByRole('checkbox', { name: 'Toggle status for X' }));
        expect(onToggle).toHaveBeenCalledWith(false);
    });

    it('disables the switch while loading', () => {
        const onToggle = jest.fn();
        render(<StatusToggle checked={false} loading onToggle={onToggle} ariaLabel="t" />);
        const control = screen.getByRole('checkbox', { name: 't' });
        expect(control).toBeDisabled();
    });

    it('disables the switch for protected rows and explains why', () => {
        const onToggle = jest.fn();
        render(
            <StatusToggle
                checked={true}
                onToggle={onToggle}
                disabled
                disabledReason="Protected system role — cannot be deactivated"
                ariaLabel="t"
            />,
        );
        expect(screen.getByRole('checkbox', { name: 't' })).toBeDisabled();
        expect(screen.getByTitle('Protected system role — cannot be deactivated')).toBeInTheDocument();
    });

    it('shows Inactive label when unchecked', () => {
        const onToggle = jest.fn();
        render(<StatusToggle checked={false} onToggle={onToggle} ariaLabel="t" />);
        expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
});
