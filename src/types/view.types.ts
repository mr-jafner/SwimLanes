/**
 * View system type definitions for SwimLanes
 *
 * Implements a Coda.io-inspired multi-view system where:
 * - All views share the same underlying item data
 * - Views are saved query configurations (filter, sort, group)
 * - Edits in any view propagate instantly to all others
 * - Views work across all branches (not branch-scoped)
 *
 * @module types/view.types
 */

/**
 * Available view types in SwimLanes.
 *
 * - timeline: Gantt-style timeline visualization (existing)
 * - table: Spreadsheet-style data grid
 * - kanban: Card-based board view
 * - calendar: Month/week/day calendar view
 * - list: Simple list view with checkboxes
 */
export type ViewType = 'timeline' | 'table' | 'kanban' | 'calendar' | 'list';

/**
 * Filter operators for building query rules.
 *
 * - equals: Exact match
 * - notEquals: Not equal to
 * - contains: String contains (case-insensitive)
 * - notContains: String does not contain
 * - startsWith: String starts with
 * - endsWith: String ends with
 * - gt: Greater than (for dates/numbers)
 * - lt: Less than (for dates/numbers)
 * - gte: Greater than or equal
 * - lte: Less than or equal
 * - between: Between two values (inclusive)
 * - in: Value is in array
 * - notIn: Value is not in array
 * - isEmpty: Field is null or empty string
 * - isNotEmpty: Field has a value
 */
export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'between'
  | 'in'
  | 'notIn'
  | 'isEmpty'
  | 'isNotEmpty';

/**
 * Single filter rule.
 *
 * @example
 * ```typescript
 * // Filter for tasks
 * const rule1: FilterRule = {
 *   field: 'type',
 *   operator: 'equals',
 *   value: 'task'
 * };
 *
 * // Filter for items starting after 2025-01-01
 * const rule2: FilterRule = {
 *   field: 'start_date',
 *   operator: 'gte',
 *   value: '2025-01-01'
 * };
 *
 * // Filter for items with non-empty owner
 * const rule3: FilterRule = {
 *   field: 'owner',
 *   operator: 'isNotEmpty',
 *   value: null
 * };
 * ```
 */
export interface FilterRule {
  /** Field name from Item type (e.g., 'type', 'project', 'owner') */
  field: string;

  /** Comparison operator */
  operator: FilterOperator;

  /** Value to compare against (null for isEmpty/isNotEmpty) */
  value: unknown;
}

/**
 * Filter configuration with multiple rules.
 *
 * Rules can be combined with AND or OR logic.
 *
 * @example
 * ```typescript
 * // Show tasks OR milestones in 2025
 * const filter: FilterConfig = {
 *   combinator: 'or',
 *   rules: [
 *     { field: 'type', operator: 'equals', value: 'task' },
 *     { field: 'type', operator: 'equals', value: 'milestone' }
 *   ]
 * };
 * ```
 */
export interface FilterConfig {
  /** Filter rules to apply */
  rules: FilterRule[];

  /** How to combine rules (AND = all must match, OR = any must match) */
  combinator: 'and' | 'or';
}

/**
 * Sort direction.
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Single sort configuration.
 *
 * @example
 * ```typescript
 * const sort: SortConfig = {
 *   field: 'start_date',
 *   direction: 'asc'
 * };
 * ```
 */
export interface SortConfig {
  /** Field name to sort by */
  field: string;

  /** Sort direction */
  direction: SortDirection;
}

/**
 * Timeline-specific display configuration.
 *
 * Settings for Gantt-style timeline view.
 */
export interface TimelineDisplayConfig {
  type: 'timeline';

  /** Field to use for lane grouping */
  laneField: 'lane' | 'project' | 'owner' | 'type';

  /** Zoom level (1-5, where 1=day, 5=year) */
  zoomLevel: number;

  /** Whether to show dependency arrows (future feature) */
  showDependencies: boolean;

  /** Lane IDs that are collapsed */
  collapsedLanes: string[];
}

/**
 * Table column configuration.
 */
export interface TableColumn {
  /** Field name from Item type */
  field: string;

  /** Column width in pixels */
  width: number;

  /** Whether column is visible */
  visible: boolean;

  /** Display order (0-based) */
  order: number;
}

/**
 * Table-specific display configuration.
 *
 * Settings for spreadsheet-style table view.
 */
export interface TableDisplayConfig {
  type: 'table';

  /** Column configurations */
  columns: TableColumn[];

  /** Number of columns to freeze on left (for horizontal scrolling) */
  frozenColumnCount: number;

  /** Row height preset */
  rowHeight: 'compact' | 'normal' | 'comfortable';
}

/**
 * Kanban-specific display configuration.
 *
 * Settings for card-based board view.
 */
export interface KanbanDisplayConfig {
  type: 'kanban';

  /** Field to use for column grouping (e.g., 'type', 'lane', 'owner') */
  columnField: string;

  /** Field to use as card title */
  cardTitleField: string;

  /** Additional fields to show on cards */
  cardFields: string[];

  /** Explicit column ordering (values of columnField) */
  columnOrder: string[];
}

/**
 * Calendar-specific display configuration.
 *
 * Settings for month/week/day calendar view.
 */
export interface CalendarDisplayConfig {
  type: 'calendar';

  /** Calendar view mode */
  calendarView: 'month' | 'week' | 'day';

  /** Field to use for start date */
  startDateField: string;

  /** Field to use for end date (may be same as startDateField for single-day events) */
  endDateField: string;
}

/**
 * List-specific display configuration.
 *
 * Settings for simple list view.
 */
export interface ListDisplayConfig {
  type: 'list';

  /** Whether to show checkboxes for selection */
  showCheckboxes: boolean;

  /** Field to use as primary text */
  primaryField: string;

  /** Fields to show as secondary text */
  secondaryFields: string[];
}

/**
 * Union type for all view-specific display configs.
 */
export type ViewDisplayConfig =
  | TimelineDisplayConfig
  | TableDisplayConfig
  | KanbanDisplayConfig
  | CalendarDisplayConfig
  | ListDisplayConfig;

/**
 * Complete view definition.
 *
 * Represents a saved view with all its configuration.
 *
 * @example
 * ```typescript
 * // Table view showing all tasks in 2025
 * const view: ViewDefinition = {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   name: 'All Tasks 2025',
 *   viewType: 'table',
 *   filter: {
 *     combinator: 'and',
 *     rules: [
 *       { field: 'type', operator: 'equals', value: 'task' },
 *       { field: 'start_date', operator: 'gte', value: '2025-01-01' },
 *       { field: 'start_date', operator: 'lt', value: '2026-01-01' }
 *     ]
 *   },
 *   sort: [
 *     { field: 'start_date', direction: 'asc' },
 *     { field: 'title', direction: 'asc' }
 *   ],
 *   groupBy: null,
 *   displayConfig: {
 *     type: 'table',
 *     columns: [
 *       { field: 'title', width: 300, visible: true, order: 0 },
 *       { field: 'start_date', width: 120, visible: true, order: 1 },
 *       { field: 'end_date', width: 120, visible: true, order: 2 },
 *       { field: 'owner', width: 150, visible: true, order: 3 },
 *       { field: 'project', width: 200, visible: true, order: 4 }
 *     ],
 *     frozenColumnCount: 1,
 *     rowHeight: 'normal'
 *   },
 *   isDefault: false,
 *   createdAt: '2025-02-01T10:30:00Z',
 *   updatedAt: '2025-02-01T10:30:00Z'
 * };
 * ```
 */
export interface ViewDefinition {
  /** Unique view ID (UUID) */
  id: string;

  /** Human-readable view name */
  name: string;

  /** Type of view */
  viewType: ViewType;

  /** Filter configuration (applies to all view types) */
  filter: FilterConfig;

  /** Sort configuration (applies to all view types) */
  sort: SortConfig[];

  /** Field to group by (null = no grouping) */
  groupBy: string | null;

  /** View-specific display settings */
  displayConfig: ViewDisplayConfig;

  /** Whether this is the default view to load on app start */
  isDefault: boolean;

  /** Creation timestamp (ISO format) */
  createdAt: string;

  /** Last update timestamp (ISO format) */
  updatedAt: string;
}

/**
 * Grouped items result.
 *
 * When groupBy is set, items are grouped by the specified field.
 *
 * @example
 * ```typescript
 * const grouped: GroupedItems = {
 *   'Frontend': [item1, item2, item3],
 *   'Backend': [item4, item5],
 *   'Design': [item6]
 * };
 * ```
 */
export type GroupedItems<T = unknown> = Record<string, T[]>;

/**
 * View query result.
 *
 * Result of applying a view's filters, sorts, and grouping to items.
 */
export interface ViewQueryResult<T = unknown> {
  /** Filtered and sorted items (flat array if no grouping) */
  items: T[];

  /** Grouped items (if groupBy is set) */
  grouped?: GroupedItems<T>;

  /** Total count before filtering */
  totalCount: number;

  /** Count after filtering */
  filteredCount: number;
}
