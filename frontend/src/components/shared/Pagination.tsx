import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '../ui/button';

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    pageSize: number;
    /** When provided, renders the "N / page" size selector. */
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    pageSize,
    onPageSizeChange,
    pageSizeOptions = PAGE_SIZE_OPTIONS,
}) => {
    // Without a size selector there is nothing useful to show for a single page;
    // with one, keep the bar so the user can still change the page size.
    if (totalPages <= 1 && !onPageSizeChange) return null;
    if (totalItems === 0) return null;

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{startItem}</span> to{' '}
                <span className="font-medium text-foreground">{endItem}</span> of{' '}
                <span className="font-medium text-foreground">{totalItems}</span> entries
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center space-x-1 sm:space-x-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                            pageNum = i + 1;
                        } else if (currentPage <= 3) {
                            pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                        } else {
                            pageNum = currentPage - 2 + i;
                        }

                        return (
                            <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? 'default' : 'outline'}
                                className="h-8 w-8 text-xs sm:text-sm"
                                onClick={() => onPageChange(pageNum)}
                            >
                                {pageNum}
                            </Button>
                        );
                    })}
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage >= totalPages}
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>

                {onPageSizeChange && (
                    <select
                        aria-label="Rows per page"
                        className="h-8 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                        value={pageSize}
                        onChange={e => onPageSizeChange(Number(e.target.value))}
                    >
                        {pageSizeOptions.map(size => (
                            <option key={size} value={size}>{size} / page</option>
                        ))}
                    </select>
                )}
            </div>
        </div>
    );
};

/**
 * Client-side pagination state helper so every page wires the same behaviour:
 * page resets to 1 on page-size change and clamps when the list shrinks.
 */
export function usePagination(defaultPageSize = 10) {
    const [currentPage, setCurrentPage] = React.useState(1);
    const [pageSize, setPageSizeState] = React.useState(defaultPageSize);

    const setPageSize = React.useCallback((size: number) => {
        setPageSizeState(size);
        setCurrentPage(1);
    }, []);

    const paginate = React.useCallback(<T,>(items: T[]): T[] => {
        const start = (currentPage - 1) * pageSize;
        return items.slice(start, start + pageSize);
    }, [currentPage, pageSize]);

    return { currentPage, setCurrentPage, pageSize, setPageSize, paginate };
}
