/**
 * View query hook for applying filters, sorts, and grouping
 *
 * Provides a React hook that takes items and a view definition and returns
 * the filtered, sorted, and grouped results based on the view's configuration.
 *
 * @module hooks/useViewQuery
 */

import { useMemo } from 'react';
import type { Item } from '@/types/database.types';
import type {
  ViewDefinition,
  FilterConfig,
  FilterRule,
  SortConfig,
  ViewQueryResult,
  GroupedItems,
} from '@/types/view.types';

/**
 * Apply a single filter rule to an item.
 *
 * @param item - Item to test
 * @param rule - Filter rule to apply
 * @returns True if item matches the rule
 */
function applyFilterRule(item: Item, rule: FilterRule): boolean {
  const fieldValue = (item as any)[rule.field];
  const { operator, value } = rule;

  switch (operator) {
    case 'equals':
      return fieldValue === value;

    case 'notEquals':
      return fieldValue !== value;

    case 'contains':
      if (typeof fieldValue !== 'string') return false;
      return fieldValue.toLowerCase().includes(String(value).toLowerCase());

    case 'notContains':
      if (typeof fieldValue !== 'string') return true;
      return !fieldValue.toLowerCase().includes(String(value).toLowerCase());

    case 'startsWith':
      if (typeof fieldValue !== 'string') return false;
      return fieldValue.toLowerCase().startsWith(String(value).toLowerCase());

    case 'endsWith':
      if (typeof fieldValue !== 'string') return false;
      return fieldValue.toLowerCase().endsWith(String(value).toLowerCase());

    case 'gt':
      return fieldValue > (value as any);

    case 'lt':
      return fieldValue < (value as any);

    case 'gte':
      return fieldValue >= (value as any);

    case 'lte':
      return fieldValue <= (value as any);

    case 'between':
      if (!Array.isArray(value) || value.length !== 2) return false;
      return fieldValue >= value[0] && fieldValue <= value[1];

    case 'in':
      if (!Array.isArray(value)) return false;
      return value.includes(fieldValue);

    case 'notIn':
      if (!Array.isArray(value)) return true;
      return !value.includes(fieldValue);

    case 'isEmpty':
      return fieldValue === null || fieldValue === undefined || fieldValue === '';

    case 'isNotEmpty':
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';

    default:
      console.warn(`Unknown filter operator: ${operator}`);
      return true;
  }
}

/**
 * Apply filter configuration to items.
 *
 * @param items - Items to filter
 * @param filter - Filter configuration
 * @returns Filtered items
 */
function applyFilters(items: Item[], filter: FilterConfig): Item[] {
  if (!filter.rules || filter.rules.length === 0) {
    return items;
  }

  return items.filter((item) => {
    const results = filter.rules.map((rule) => applyFilterRule(item, rule));

    if (filter.combinator === 'and') {
      return results.every((r) => r);
    } else {
      return results.some((r) => r);
    }
  });
}

/**
 * Apply sort configuration to items.
 *
 * @param items - Items to sort
 * @param sort - Sort configuration
 * @returns Sorted items (new array)
 */
function applySorting(items: Item[], sort: SortConfig[]): Item[] {
  if (!sort || sort.length === 0) {
    return items;
  }

  return [...items].sort((a, b) => {
    for (const config of sort) {
      const aValue = (a as any)[config.field];
      const bValue = (b as any)[config.field];

      // Handle null/undefined values (sort them to the end)
      if (aValue == null && bValue == null) continue;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Compare values
      let comparison = 0;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        // Generic comparison for other types
        comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }

      // Apply direction
      if (comparison !== 0) {
        return config.direction === 'asc' ? comparison : -comparison;
      }
    }

    return 0;
  });
}

/**
 * Group items by a field.
 *
 * @param items - Items to group
 * @param groupBy - Field name to group by
 * @returns Grouped items
 */
function groupItems(items: Item[], groupBy: string): GroupedItems<Item> {
  const groups: GroupedItems<Item> = {};

  for (const item of items) {
    const groupValue = (item as any)[groupBy];
    const key = groupValue ?? '(none)'; // Handle null/undefined

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(item);
  }

  return groups;
}

/**
 * Hook for applying view query to items.
 *
 * Takes items and a view definition and returns filtered, sorted, and
 * optionally grouped results.
 *
 * @param items - Items to query
 * @param view - View definition with filter, sort, and group config
 * @returns Query result with processed items
 *
 * @example
 * ```typescript
 * const items = useItems(); // Get all items from store
 * const view = useView(viewId); // Get view definition
 *
 * const result = useViewQuery(items, view);
 *
 * if (view.groupBy) {
 *   // Use grouped results
 *   Object.entries(result.grouped).forEach(([group, items]) => {
 *     console.log(`${group}: ${items.length} items`);
 *   });
 * } else {
 *   // Use flat results
 *   console.log(`${result.items.length} items`);
 * }
 * ```
 */
export function useViewQuery(
  items: Item[],
  view: ViewDefinition | null
): ViewQueryResult<Item> {
  return useMemo(() => {
    const totalCount = items.length;

    if (!view) {
      return {
        items,
        totalCount,
        filteredCount: totalCount,
      };
    }

    // Apply filters
    let filtered = applyFilters(items, view.filter);

    // Apply sorting
    filtered = applySorting(filtered, view.sort);

    const filteredCount = filtered.length;

    // Apply grouping if specified
    if (view.groupBy) {
      const grouped = groupItems(filtered, view.groupBy);

      return {
        items: filtered,
        grouped,
        totalCount,
        filteredCount,
      };
    }

    return {
      items: filtered,
      totalCount,
      filteredCount,
    };
  }, [items, view]);
}

/**
 * Hook for applying view query to items with a view ID.
 *
 * Convenience hook that fetches the view definition by ID and applies the query.
 *
 * @param items - Items to query
 * @param viewId - View ID to use for query (null = no filtering)
 * @param views - All available views
 * @returns Query result with processed items
 *
 * @example
 * ```typescript
 * const items = useItems();
 * const views = useViews();
 * const activeViewId = useAppStore((state) => state.activeViewId);
 *
 * const result = useViewQueryById(items, activeViewId, views);
 * ```
 */
export function useViewQueryById(
  items: Item[],
  viewId: string | null,
  views: ViewDefinition[]
): ViewQueryResult<Item> {
  const view = useMemo(() => {
    if (!viewId) return null;
    return views.find((v) => v.id === viewId) ?? null;
  }, [viewId, views]);

  return useViewQuery(items, view);
}
