import { useEffect, useState } from 'react';

/**
 * useDebounce Hook
 *
 * Debounces a value by delaying updates until after the specified delay period.
 * Useful for search inputs and other frequently-changing values.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds before updating (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * ```typescript
 * const [searchText, setSearchText] = useState('');
 * const debouncedSearch = useDebounce(searchText, 300);
 *
 * useEffect(() => {
 *   // This only runs after user stops typing for 300ms
 *   performSearch(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
