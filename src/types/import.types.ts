/**
 * Import workflow type definitions for SwimLanes
 *
 * These types support the three-stage import workflow:
 * 1. Import/Map: Parse CSV/JSON, map columns, preview changes
 * 2. Update/Append: Re-import with saved profiles
 * 3. View Timeline: Visualize imported data
 */

import type { Item } from './database.types';

/**
 * ID generation strategies for imported items.
 *
 * - generate: Auto-generate UUIDs for all items (default)
 * - column: Use a specific CSV column as the item ID
 * - match: Match items by composite key (project + title) and update if exists
 */
export type IDStrategy = 'generate' | 'column' | 'match';

/**
 * Column-to-field mapping configuration.
 *
 * Maps CSV/JSON column names to Item fields. Used during import to
 * transform raw data into structured items.
 *
 * @example
 * ```typescript
 * const mapping: ColumnMapping = {
 *   title: 'Summary',           // CSV column "Summary" → item.title
 *   type: 'Issue Type',          // CSV column "Issue Type" → item.type
 *   start_date: 'Start Date',
 *   end_date: 'Due Date',
 *   owner: 'Assignee',
 *   lane: 'Team',
 *   project: 'Epic',
 *   tags: 'Labels',
 *   id: 'Key',                   // CSV column "Key" → item.id (when idStrategy='column')
 *   idStrategy: 'column',
 *   tagsDelimiter: ','
 * };
 * ```
 */
export interface ColumnMapping {
  /** CSV column name for item title */
  title: string;

  /** CSV column name for item type (task/milestone/release/meeting) */
  type: string;

  /** CSV column name for start date */
  start_date: string;

  /** CSV column name for end date (may be empty for milestones) */
  end_date: string;

  /** CSV column name for owner/assignee */
  owner: string;

  /** CSV column name for swim lane */
  lane: string;

  /** CSV column name for project/epic */
  project: string;

  /** CSV column name for tags/labels */
  tags: string;

  /** CSV column name to use as item ID (only used when idStrategy='column') */
  id: string;

  /** ID generation strategy */
  idStrategy: IDStrategy;

  /** Delimiter for splitting tags (e.g., ',', ';', '|') */
  tagsDelimiter: string;
}

/**
 * Auto-detection patterns for column mapping.
 *
 * Maps Item fields to common CSV column name patterns. Used to automatically
 * detect column mappings when importing a new CSV file.
 *
 * @example
 * ```typescript
 * const patterns: AutoDetectPatterns = {
 *   title: ['title', 'name', 'task', 'item', 'summary'],
 *   type: ['type', 'kind', 'category', 'issue type'],
 *   start_date: ['start', 'start_date', 'begin', 'start date'],
 *   // ...
 * };
 * ```
 */
export interface AutoDetectPatterns {
  title: string[];
  type: string[];
  start_date: string[];
  end_date: string[];
  owner: string[];
  lane: string[];
  project: string[];
  tags: string[];
}

/**
 * Raw parsed row from CSV/JSON file.
 *
 * Represents a single row with column names as keys and cell values as strings.
 * Used as intermediate format before mapping to Item interface.
 */
export type ParsedRow = Record<string, string>;

/**
 * Item in dry-run preview with additional metadata.
 *
 * Extends the Item interface with preview-specific fields to show users
 * what will happen before committing the import.
 */
export interface DryRunItem {
  /** The item that will be created/updated */
  item: Item;

  /** If this is an update, the existing item being replaced */
  existing?: Item;

  /** Source row index (for error reporting) */
  rowIndex?: number;

  /** Source row hash for change detection */
  sourceRowHash?: string;
}

/**
 * Dry-run preview results.
 *
 * Shows what will happen when the import is committed:
 * - New items to be added
 * - Existing items to be updated
 * - Rows to be skipped (with reasons)
 * - Potential conflicts
 *
 * @example
 * ```typescript
 * const dryRun: DryRunResult = {
 *   added: [
 *     { item: {...}, rowIndex: 0 }
 *   ],
 *   updated: [
 *     { item: {...}, existing: {...}, rowIndex: 1 }
 *   ],
 *   skipped: [
 *     { row: {...}, reason: 'Missing required field: title', rowIndex: 2 }
 *   ],
 *   conflicts: []
 * };
 * ```
 */
export interface DryRunResult {
  /** Items that will be added (new) */
  added: DryRunItem[];

  /** Items that will be updated (matched existing items) */
  updated: DryRunItem[];

  /** Rows that will be skipped with reasons */
  skipped: SkippedRow[];

  /** Potential conflicts detected (future feature) */
  conflicts: unknown[];
}

/**
 * Skipped row in dry-run preview.
 *
 * Represents a CSV row that cannot be imported, along with the reason
 * (e.g., missing required fields, invalid date format, etc.).
 */
export interface SkippedRow {
  /** The raw CSV row that was skipped */
  row: ParsedRow;

  /** Reason for skipping (validation error message) */
  reason: string;

  /** Source row index (0-based) */
  rowIndex?: number;
}

/**
 * Import summary statistics.
 *
 * Shows the results after committing an import operation.
 *
 * @example
 * ```typescript
 * const summary: ImportSummary = {
 *   added: 42,
 *   updated: 18,
 *   skipped: 3,
 *   total: 63,
 *   branch_id: 'main',
 *   timestamp: '2025-02-01T10:30:00Z'
 * };
 * ```
 */
export interface ImportSummary {
  /** Number of items added */
  added: number;

  /** Number of items updated */
  updated: number;

  /** Number of rows skipped */
  skipped: number;

  /** Total rows processed */
  total: number;

  /** Branch items were imported into */
  branch_id: string;

  /** Import timestamp */
  timestamp: string;
}

/**
 * Import mode for update/append workflow.
 *
 * - upsert: Update existing items and append new ones
 * - update-only: Only update existing items, ignore new rows
 */
export type ImportMode = 'upsert' | 'update-only';

/**
 * Validation result for a parsed row.
 *
 * Used during dry-run to validate each row before import.
 */
export interface ValidationResult {
  /** Whether the row is valid */
  valid: boolean;

  /** Validation errors (if any) */
  errors: string[];

  /** Validation warnings (non-blocking) */
  warnings?: string[];
}

/**
 * CSV parse options.
 *
 * Configuration for CSV parsing behavior.
 */
export interface CSVParseOptions {
  /** Delimiter character (default: ',') */
  delimiter?: string;

  /** Whether first row contains headers (default: true) */
  headers?: boolean;

  /** Skip empty rows (default: true) */
  skipEmptyRows?: boolean;

  /** Trim whitespace from values (default: true) */
  trim?: boolean;
}
