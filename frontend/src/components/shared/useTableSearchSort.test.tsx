import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../ui/table';
import { useTableSearchSort, SortableHead, TableSearch } from './useTableSearchSort';

interface Row { id: number; name: string; module: string; count: number }

const rows: Row[] = [
    { id: 3, name: 'charlie', module: 'Assets', count: 2 },
    { id: 1, name: 'Alpha', module: 'Users', count: 10 },
    { id: 2, name: 'bravo', module: 'Assets', count: 1 },
    { id: 4, name: '', module: 'Users', count: 5 },
];

const Harness: React.FC<{ items?: Row[] }> = ({ items = rows }) => {
    const { searchTerm, setSearchTerm, sortBy, sortOrder, handleSort, result } = useTableSearchSort(items, {
        searchIn: (r) => [r.name, r.module],
        sortValue: (r, column) => (column === 'count' ? r.count : column === 'module' ? r.module : r.name),
        initialSort: 'name',
    });
    return (
        <>
            <TableSearch value={searchTerm} onChange={setSearchTerm} label="Search rows" />
            <Table>
                <TableHeader>
                    <TableRow>
                        <SortableHead column="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Name</SortableHead>
                        <SortableHead column="count" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Count</SortableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {result.map((r) => (
                        <TableRow key={r.id} data-testid="row">
                            <TableCell>{r.name || '(blank)'}</TableCell>
                            <TableCell>{r.count}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    );
};

const names = () => screen.getAllByTestId('row').map((r) => within(r).getAllByRole('cell')[0].textContent);

describe('useTableSearchSort', () => {
    it('sorts by the initial column, case-insensitively', () => {
        render(<Harness />);
        // Case-insensitive: 'Alpha' before 'bravo', not all capitals first.
        expect(names()).toEqual(['Alpha', 'bravo', 'charlie', '(blank)']);
    });

    it('sorts blanks last in both directions', async () => {
        render(<Harness />);
        await userEvent.click(screen.getByRole('button', { name: /Name/ }));
        // Descending — the blank must still not lead.
        expect(names()).toEqual(['charlie', 'bravo', 'Alpha', '(blank)']);
    });

    it('toggles direction when the same column is clicked twice', async () => {
        render(<Harness />);
        const header = screen.getByRole('button', { name: /Name/ });
        await userEvent.click(header);
        expect(names()[0]).toBe('charlie');
        await userEvent.click(header);
        expect(names()[0]).toBe('Alpha');
    });

    it('sorts numbers numerically, not as strings', async () => {
        render(<Harness />);
        await userEvent.click(screen.getByRole('button', { name: /Count/ }));
        // String sorting would put 10 before 2.
        expect(screen.getAllByTestId('row').map((r) => within(r).getAllByRole('cell')[1].textContent))
            .toEqual(['1', '2', '5', '10']);
    });

    it('starts a newly picked column ascending', async () => {
        render(<Harness />);
        await userEvent.click(screen.getByRole('button', { name: /Name/ })); // name desc
        await userEvent.click(screen.getByRole('button', { name: /Count/ })); // switch column
        expect(screen.getAllByTestId('row').map((r) => within(r).getAllByRole('cell')[1].textContent)[0]).toBe('1');
    });

    it('searches across every field, case-insensitively', async () => {
        render(<Harness />);
        await userEvent.type(screen.getByLabelText('Search rows'), 'BRAVO');
        expect(names()).toEqual(['bravo']);
    });

    it('matches on a field that is not the sorted column', async () => {
        render(<Harness />);
        await userEvent.type(screen.getByLabelText('Search rows'), 'users');
        expect(names()).toEqual(['Alpha', '(blank)']);
    });

    it('ignores surrounding whitespace in the search term', async () => {
        render(<Harness />);
        await userEvent.type(screen.getByLabelText('Search rows'), '  bravo  ');
        expect(names()).toEqual(['bravo']);
    });

    it('shows nothing when no row matches', async () => {
        render(<Harness />);
        await userEvent.type(screen.getByLabelText('Search rows'), 'nothing-matches-this');
        expect(screen.queryAllByTestId('row')).toEqual([]);
    });

    it('marks the sorted column for assistive tech', async () => {
        render(<Harness />);
        const nameHeader = () => screen.getByRole('columnheader', { name: /Name/ });
        expect(nameHeader()).toHaveAttribute('aria-sort', 'ascending');
        await userEvent.click(screen.getByRole('button', { name: /Name/ }));
        expect(nameHeader()).toHaveAttribute('aria-sort', 'descending');
        expect(screen.getByRole('columnheader', { name: /Count/ })).toHaveAttribute('aria-sort', 'none');
    });

    it('does not mutate the source array', () => {
        const source = [...rows];
        render(<Harness items={source} />);
        expect(source.map((r) => r.id)).toEqual([3, 1, 2, 4]);
    });
});
