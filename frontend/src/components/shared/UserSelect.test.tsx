import React, { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserSelect from './UserSelect';
import { User } from '../../services/userService';

const users = [
    { id: 1, firstName: 'Badri', lastName: 'Pradhan', email: 'manager@qbadvisory.com' },
    { id: 2, firstName: 'Regular', lastName: 'User', email: 'user@qbadvisory.com' },
    { id: 3, firstName: 'Auditor', lastName: 'User', email: 'auditor@qbadvisory.com' },
] as User[];

/** Mirrors real usage: parent owns the id, exactly as the asset/license/inventory forms do. */
const Harness: React.FC<{ onChange?: (id: number | null) => void; initial?: number | null }> = ({
    onChange,
    initial = null,
}) => {
    const [value, setValue] = useState<number | null>(initial);
    return (
        <UserSelect
            users={users}
            value={value}
            onChange={(id) => {
                setValue(id);
                onChange?.(id);
            }}
            clearable
            ariaLabel="Select user"
        />
    );
};

/** Renders the harness, opens the dropdown, and returns the search input. */
const openMenu = async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('combobox'));
    return screen.getByPlaceholderText('Search by name or email...');
};

describe('UserSelect', () => {
    it('searches by name', async () => {
        const input = await openMenu();
        await userEvent.type(input, 'Badri');

        expect(screen.getByText('Badri Pradhan')).toBeInTheDocument();
        expect(screen.queryByText('Regular User')).not.toBeInTheDocument();
        expect(screen.queryByText('Auditor User')).not.toBeInTheDocument();
    });

    it('searches by email', async () => {
        const input = await openMenu();
        // Deliberately a substring only the email contains, so a name-only
        // filter could not produce this match.
        await userEvent.type(input, 'auditor@');

        expect(screen.getByText('Auditor User')).toBeInTheDocument();
        expect(screen.queryByText('Badri Pradhan')).not.toBeInTheDocument();
    });

    it('renders name and email on separate lines', async () => {
        await openMenu();

        const option = screen.getByRole('option', { name: /Badri Pradhan/ });
        const name = within(option).getByText('Badri Pradhan');
        const email = within(option).getByText('manager@qbadvisory.com');

        // Distinct elements — not a single "Name (email)" string.
        expect(name).not.toBe(email);
        expect(email).not.toContainElement(name);
        expect(option).not.toHaveTextContent('Badri Pradhan (manager@qbadvisory.com)');
    });

    it('submits the selected user id', async () => {
        const onChange = jest.fn();
        render(<Harness onChange={onChange} />);

        await userEvent.click(screen.getByRole('combobox'));
        await userEvent.click(screen.getByRole('option', { name: /Regular User/ }));

        expect(onChange).toHaveBeenCalledWith(2);
    });

    it('shows the selection as name over email once chosen', async () => {
        render(<Harness initial={1} />);

        const trigger = screen.getByRole('combobox');
        expect(within(trigger).getByText('Badri Pradhan')).toBeInTheDocument();
        expect(within(trigger).getByText('manager@qbadvisory.com')).toBeInTheDocument();
    });

    it('shows an empty state when nothing matches', async () => {
        const input = await openMenu();
        await userEvent.type(input, 'nobody-by-this-name');

        expect(screen.getByText('No users found')).toBeInTheDocument();
    });

    it('shows a loading state and blocks interaction', () => {
        render(<UserSelect users={[]} value={null} onChange={jest.fn()} loading ariaLabel="Select user" />);

        expect(screen.getByText('Loading users...')).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('clears the selection', async () => {
        const onChange = jest.fn();
        render(<Harness onChange={onChange} initial={1} />);

        await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }));

        expect(onChange).toHaveBeenCalledWith(null);
        expect(screen.getByText('Select user...')).toBeInTheDocument();
    });

    it('supports keyboard navigation and selection', async () => {
        const onChange = jest.fn();
        render(<Harness onChange={onChange} />);

        await userEvent.tab();
        expect(screen.getByRole('combobox')).toHaveFocus();

        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard('{ArrowDown}{Enter}');

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toEqual(expect.any(Number));
    });
});
