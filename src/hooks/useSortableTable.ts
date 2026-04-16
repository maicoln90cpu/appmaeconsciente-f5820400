import { useState, useMemo } from 'react';

type SortDirection = 'asc' | 'desc';

export function useSortableTable<T>(
  data: T[] | undefined,
  defaultSort?: { key: keyof T; direction: SortDirection }
) {
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultSort?.key ?? null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    defaultSort?.direction ?? 'asc'
  );

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!data || !sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        return sortDirection === 'asc'
          ? aVal === bVal
            ? 0
            : aVal
              ? -1
              : 1
          : aVal === bVal
            ? 0
            : aVal
              ? 1
              : -1;
      }
      const sA = String(aVal);
      const sB = String(bVal);
      return sortDirection === 'asc' ? sA.localeCompare(sB) : sB.localeCompare(sA);
    });
  }, [data, sortKey, sortDirection]);

  return { sortedData, sortKey, sortDirection, handleSort };
}
