import { useState, useMemo } from 'react';

interface PaginationResult<T> {
  currentPage: number;
  totalPages: number;
  paginatedData: T[];
  totalItems: number;
  setCurrentPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

export function usePagination<T>(
  data: T[] | undefined,
  itemsPerPage: number = 10
): PaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = data?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Reset to page 1 if data changes and current page is out of bounds
  const safePage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    if (!data) return [];
    const start = (safePage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [data, safePage, itemsPerPage]);

  return {
    currentPage: safePage,
    totalPages,
    paginatedData,
    totalItems,
    setCurrentPage: (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages))),
    nextPage: () => setCurrentPage(p => Math.min(p + 1, totalPages)),
    prevPage: () => setCurrentPage(p => Math.max(p - 1, 1)),
    canGoNext: safePage < totalPages,
    canGoPrev: safePage > 1,
  };
}
