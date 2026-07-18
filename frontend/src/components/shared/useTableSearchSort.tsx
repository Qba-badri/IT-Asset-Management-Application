import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, Search } from 'lucide-react';
import { TableHead } from '../ui/table';
import { Input } from '../ui/input';

export type SortOrder = 'asc' | 'desc';

interface Options<T> {
    /** Every value a row can be matched on. Nulls are ignored. */
    searchIn: (item: T) => Array<string | number | null | undefined>;
    /** The value a column sorts on. Strings compare case-insensitively; numbers numerically. */
    sortValue: (item: T, column: string) => string | number | null | undefined;
    /** Column sorted before the user picks one. */
    initialSort: string;
    initialOrder?: SortOrder;
    /** Extra per-page predicates (status, module, ...). Rows must satisfy all. */
    filters?: Array<(item: T) => boolean>;
}

/**
 * Search + sort for the admin list tables, matching the behaviour the feature
 * pages (Users, Assets, Licenses, Inventory) already hand-roll: filter, then
 * sort, then paginate the result — never the raw list, or a filtered row on
 * page 2 becomes unreachable.
 *
 * `resetKey` changes whenever the visible set changes, so callers can send the
 * pager back to page 1 instead of stranding the user on a page that no longer
 * exists.
 */
export function useTableSearchSort<T>(items: T[], options: Options<T>) {
    const { searchIn, sortValue, initialSort, initialOrder = 'asc', filters } = options;

    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<string>(initialSort);
    const [sortOrder, setSortOrder] = useState<SortOrder>(initialOrder);

    const handleSort = (column: string) => {
        if (sortBy === column) setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    const result = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        const matches = (item: T) =>
            term === '' ||
            searchIn(item).some((v) => v != null && String(v).toLowerCase().includes(term));

        const compare = (a: T, b: T) => {
            const av = sortValue(a, sortBy);
            const bv = sortValue(b, sortBy);
            // Blanks sort last regardless of direction — an empty cell is never
            // the most interesting row on the page.
            const aEmpty = av == null || av === '';
            const bEmpty = bv == null || bv === '';
            if (aEmpty || bEmpty) return aEmpty && bEmpty ? 0 : aEmpty ? 1 : -1;

            const cmp =
                typeof av === 'number' && typeof bv === 'number'
                    ? av - bv
                    : String(av).localeCompare(String(bv), undefined, { sensitivity: 'base', numeric: true });
            return sortOrder === 'asc' ? cmp : -cmp;
        };

        return items
            .filter((item) => matches(item) && (filters ?? []).every((f) => f(item)))
            .sort(compare);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, searchTerm, sortBy, sortOrder, filters]);

    return {
        searchTerm,
        setSearchTerm,
        sortBy,
        sortOrder,
        handleSort,
        /** Filtered + sorted rows. Paginate this, not the source list. */
        result,
        /** Changes whenever the visible set changes; feed to useResetPageOnChange. */
        resetKey: `${searchTerm}|${sortBy}|${sortOrder}|${result.length}`,
    };
}

/** Send the pager back to page 1 whenever the visible set changes. */
export const useResetPageOnChange = (resetKey: string, setPage: (page: number) => void) => {
    useEffect(() => {
        setPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resetKey]);
};

/** Clickable sortable column header. */
export const SortableHead: React.FC<{
    column: string;
    sortBy: string;
    sortOrder: SortOrder;
    onSort: (column: string) => void;
    className?: string;
    children: React.ReactNode;
}> = ({ column, sortBy, sortOrder, onSort, className, children }) => {
    const active = sortBy === column;
    return (
        <TableHead className={className} aria-sort={active ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}>
            <button
                type="button"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                onClick={() => onSort(column)}
            >
                {children}
                <ArrowUpDown className={`h-3 w-3 ${active ? 'text-primary' : 'text-muted-foreground/50'}`} />
                {active && <span className="sr-only">{sortOrder === 'asc' ? 'ascending' : 'descending'}</span>}
            </button>
        </TableHead>
    );
};

/** The search box used above the admin tables. */
export const TableSearch: React.FC<{
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
}> = ({ value, onChange, placeholder = 'Search...', label }) => (
    <div className="relative flex-1 max-w-sm min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
            className="pl-9"
            placeholder={placeholder}
            aria-label={label ?? placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);
