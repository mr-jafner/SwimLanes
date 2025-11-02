/**
 * Branch comparison type definitions for SwimLanes
 *
 * These types support branch comparison and what-if analysis.
 * Branches enable scenario planning by creating isolated copies of items
 * that can be compared to see differences.
 */

import type { Item } from './database.types';

/**
 * Comparison status for an item.
 *
 * - added: Item exists in branch B but not in branch A
 * - removed: Item exists in branch A but not in branch B
 * - changed: Item exists in both but has different field values
 * - unchanged: Item exists in both with identical field values
 */
export type ComparisonStatus = 'added' | 'removed' | 'changed' | 'unchanged';

/**
 * Comparison of a single item across two branches.
 *
 * Contains the item data from both branches plus metadata about what changed.
 * Uses FULL OUTER JOIN logic to detect all differences.
 *
 * @example
 * ```typescript
 * const comparison: ComparisonItem = {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   title: 'Implement user authentication',
 *   status: 'changed',
 *   a_start: '2025-02-01',
 *   b_start: '2025-02-05',  // Dates differ
 *   a_end: '2025-02-15',
 *   b_end: '2025-02-20',    // Dates differ
 *   a_type: 'task',
 *   b_type: 'task',
 *   a_owner: 'Alice',
 *   b_owner: 'Bob',         // Owner changed
 *   changedFields: ['start_date', 'end_date', 'owner']
 * };
 * ```
 */
export interface ComparisonItem {
  /** Item ID */
  id: string;

  /** Item title (from whichever branch has it) */
  title: string;

  /** Comparison status */
  status: ComparisonStatus;

  /** Start date in branch A */
  a_start: string | null;

  /** Start date in branch B */
  b_start: string | null;

  /** End date in branch A */
  a_end: string | null;

  /** End date in branch B */
  b_end: string | null;

  /** Item type in branch A */
  a_type: string | null;

  /** Item type in branch B */
  b_type: string | null;

  /** Owner in branch A */
  a_owner?: string | null;

  /** Owner in branch B */
  b_owner?: string | null;

  /** Lane in branch A */
  a_lane?: string | null;

  /** Lane in branch B */
  b_lane?: string | null;

  /** Project in branch A */
  a_project?: string | null;

  /** Project in branch B */
  b_project?: string | null;

  /** Tags in branch A */
  a_tags?: string | null;

  /** Tags in branch B */
  b_tags?: string | null;

  /** List of field names that differ (for 'changed' status) */
  changedFields?: string[];
}

/**
 * Complete comparison result between two branches.
 *
 * Contains all items with their comparison status, grouped by status type.
 *
 * @example
 * ```typescript
 * const result: ComparisonResult = {
 *   branchA: 'main',
 *   branchB: 'q1-stretch-goals',
 *   items: [...],  // All items with status
 *   summary: {
 *     added: 5,
 *     removed: 2,
 *     changed: 8,
 *     unchanged: 42
 *   },
 *   comparedAt: '2025-02-01T10:30:00Z'
 * };
 * ```
 */
export interface ComparisonResult {
  /** Source branch ID (left side) */
  branchA: string;

  /** Target branch ID (right side) */
  branchB: string;

  /** All items with comparison status */
  items: ComparisonItem[];

  /** Summary statistics */
  summary: ComparisonSummary;

  /** Timestamp when comparison was performed */
  comparedAt: string;
}

/**
 * Summary statistics for branch comparison.
 *
 * Counts of items by comparison status.
 */
export interface ComparisonSummary {
  /** Number of items added in branch B */
  added: number;

  /** Number of items removed from branch A */
  removed: number;

  /** Number of items that changed between branches */
  changed: number;

  /** Number of items unchanged between branches */
  unchanged: number;

  /** Total items compared */
  total?: number;
}

/**
 * Field-level difference for an item.
 *
 * Represents a single field that differs between two branches.
 */
export interface FieldDifference {
  /** Field name (e.g., 'start_date', 'owner') */
  field: string;

  /** Value in branch A */
  oldValue: unknown;

  /** Value in branch B */
  newValue: unknown;

  /** Human-readable description of change */
  description?: string;
}

/**
 * Detailed item comparison with field-level differences.
 *
 * Extends ComparisonItem with detailed field-by-field analysis.
 */
export interface DetailedComparison {
  /** Basic comparison data */
  comparison: ComparisonItem;

  /** Full item from branch A (if exists) */
  itemA: Item | null;

  /** Full item from branch B (if exists) */
  itemB: Item | null;

  /** List of all field differences */
  differences: FieldDifference[];
}

/**
 * Branch comparison filter options.
 *
 * Allows filtering comparison results by status, field changes, etc.
 */
export interface ComparisonFilters {
  /** Show only specific statuses (empty = show all) */
  statuses: ComparisonStatus[];

  /** Show only items where specific fields changed */
  changedFields?: string[];

  /** Show only items matching search text */
  searchText?: string;

  /** Show only items from specific projects */
  projects?: string[];
}

/**
 * Branch merge conflict.
 *
 * Represents a conflict that must be resolved before merging branches.
 * (Future feature - not yet implemented in prototype)
 */
export interface MergeConflict {
  /** Item ID with conflict */
  itemId: string;

  /** Field with conflicting values */
  field: string;

  /** Value in source branch */
  sourceValue: unknown;

  /** Value in target branch */
  targetValue: unknown;

  /** Value in common ancestor (if available) */
  baseValue?: unknown;

  /** Resolution strategy */
  resolution?: 'keep-source' | 'keep-target' | 'manual';
}

/**
 * Branch merge options.
 *
 * Configuration for merging one branch into another.
 * (Future feature - not yet implemented in prototype)
 */
export interface MergeOptions {
  /** Source branch ID */
  sourceBranch: string;

  /** Target branch ID */
  targetBranch: string;

  /** How to handle conflicts */
  conflictStrategy: 'fail' | 'keep-source' | 'keep-target' | 'manual';

  /** Whether to create a commit/snapshot */
  createSnapshot: boolean;

  /** Optional merge message */
  message?: string;
}
