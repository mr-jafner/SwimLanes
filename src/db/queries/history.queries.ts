/**
 * Query builders for item history and branch comparison operations
 *
 * Provides typed, parameterized query functions for version history and branch diffing.
 * All queries use parameterized statements to prevent SQL injection.
 *
 * @module db/queries/history.queries
 */

import type { Database, QueryExecResult } from 'sql.js';
import type { ItemHistory, Item } from '@/types/database.types';

/**
 * Difference type for branch comparison.
 */
export type DiffType = 'added' | 'removed' | 'changed' | 'unchanged';

/**
 * Result of comparing a single item between branches.
 */
export interface ItemDiff {
  /** Type of difference */
  diffType: DiffType;

  /** Item from branch A (null if added in B) */
  itemA: Item | null;

  /** Item from branch B (null if removed from A) */
  itemB: Item | null;
}

/**
 * Result of comparing two branches.
 */
export interface BranchComparison {
  /** Branch A identifier */
  branchA: string;

  /** Branch B identifier */
  branchB: string;

  /** Items added in branch B (not in A) */
  added: Item[];

  /** Items removed from branch A (not in B) */
  removed: Item[];

  /** Items changed between branches */
  changed: Array<{ before: Item; after: Item }>;

  /** Items unchanged between branches */
  unchanged: Item[];

  /** All differences as a flat array */
  diffs: ItemDiff[];
}

/**
 * Get complete version history for a specific item.
 *
 * Returns all versions in chronological order (oldest to newest).
 *
 * @param db - Database instance
 * @param id - Item ID
 * @param branchId - Branch ID
 * @returns Array of history records ordered by version
 *
 * @example
 * ```typescript
 * const history = getItemHistory(db, '550e8400-e29b-41d4-a716-446655440000', 'main');
 * history.forEach(h => {
 *   console.log(`Version ${h.version}: ${h.op} at ${h.snapshot_at}`);
 * });
 * ```
 */
export function getItemHistory(db: Database, id: string, branchId: string): ItemHistory[] {
  const sql = `
    SELECT * FROM item_history
    WHERE id = ? AND branch_id = ?
    ORDER BY version ASC
  `;

  const result = db.exec(sql, [id, branchId]);

  return parseHistoryResult(result);
}

/**
 * Get a specific version of an item from history.
 *
 * @param db - Database instance
 * @param id - Item ID
 * @param branchId - Branch ID
 * @param version - Version number to retrieve
 * @returns The history record for that version, or null if not found
 *
 * @example
 * ```typescript
 * const v2 = getItemVersion(db, '550e8400-e29b-41d4-a716-446655440000', 'main', 2);
 * ```
 */
export function getItemVersion(
  db: Database,
  id: string,
  branchId: string,
  version: number
): ItemHistory | null {
  const sql = `
    SELECT * FROM item_history
    WHERE id = ? AND branch_id = ? AND version = ?
  `;

  const result = db.exec(sql, [id, branchId, version]);

  const history = parseHistoryResult(result);
  return history.length > 0 ? history[0] : null;
}

/**
 * Get the most recent version number for an item.
 *
 * @param db - Database instance
 * @param id - Item ID
 * @param branchId - Branch ID
 * @returns Latest version number, or 0 if no history exists
 *
 * @example
 * ```typescript
 * const latestVersion = getLatestVersion(db, '550e8400-e29b-41d4-a716-446655440000', 'main');
 * console.log(`Current version: ${latestVersion}`);
 * ```
 */
export function getLatestVersion(db: Database, id: string, branchId: string): number {
  const sql = `
    SELECT MAX(version) as max_version FROM item_history
    WHERE id = ? AND branch_id = ?
  `;

  const result = db.exec(sql, [id, branchId]);

  if (result.length === 0 || !result[0] || result[0].values.length === 0) {
    return 0;
  }

  const firstRow = result[0].values[0];
  return firstRow && firstRow[0] !== undefined && firstRow[0] !== null
    ? (firstRow[0] as number)
    : 0;
}

/**
 * Compare two branches to find added, removed, and changed items.
 *
 * Uses FULL OUTER JOIN logic to detect:
 * - Added: Items in branch B but not in branch A
 * - Removed: Items in branch A but not in branch B
 * - Changed: Items in both with different field values
 * - Unchanged: Items in both with same field values
 *
 * @param db - Database instance
 * @param branchAId - First branch to compare
 * @param branchBId - Second branch to compare
 * @returns Detailed comparison results
 *
 * @example
 * ```typescript
 * const comparison = compareBranches(db, 'main', 'feature-x');
 * console.log(`Added: ${comparison.added.length}`);
 * console.log(`Removed: ${comparison.removed.length}`);
 * console.log(`Changed: ${comparison.changed.length}`);
 * console.log(`Unchanged: ${comparison.unchanged.length}`);
 * ```
 */
export function compareBranches(
  db: Database,
  branchAId: string,
  branchBId: string
): BranchComparison {
  // SQLite doesn't support FULL OUTER JOIN, so we use UNION of LEFT JOIN and RIGHT JOIN
  // to achieve the same result
  const sql = `
    SELECT
      a.id as id_a, a.branch_id as branch_a, a.type as type_a, a.title as title_a,
      a.start_date as start_date_a, a.end_date as end_date_a, a.owner as owner_a,
      a.lane as lane_a, a.project as project_a, a.tags as tags_a,
      a.source_id as source_id_a, a.source_row_hash as source_row_hash_a, a.updated_at as updated_at_a,
      b.id as id_b, b.branch_id as branch_b, b.type as type_b, b.title as title_b,
      b.start_date as start_date_b, b.end_date as end_date_b, b.owner as owner_b,
      b.lane as lane_b, b.project as project_b, b.tags as tags_b,
      b.source_id as source_id_b, b.source_row_hash as source_row_hash_b, b.updated_at as updated_at_b
    FROM item a
    LEFT JOIN item b ON a.id = b.id AND b.branch_id = ?
    WHERE a.branch_id = ?

    UNION

    SELECT
      a.id as id_a, a.branch_id as branch_a, a.type as type_a, a.title as title_a,
      a.start_date as start_date_a, a.end_date as end_date_a, a.owner as owner_a,
      a.lane as lane_a, a.project as project_a, a.tags as tags_a,
      a.source_id as source_id_a, a.source_row_hash as source_row_hash_a, a.updated_at as updated_at_a,
      b.id as id_b, b.branch_id as branch_b, b.type as type_b, b.title as title_b,
      b.start_date as start_date_b, b.end_date as end_date_b, b.owner as owner_b,
      b.lane as lane_b, b.project as project_b, b.tags as tags_b,
      b.source_id as source_id_b, b.source_row_hash as source_row_hash_b, b.updated_at as updated_at_b
    FROM item b
    LEFT JOIN item a ON b.id = a.id AND a.branch_id = ?
    WHERE b.branch_id = ? AND a.id IS NULL
  `;

  const result = db.exec(sql, [branchBId, branchAId, branchAId, branchBId]);

  return parseBranchComparisonResult(result, branchAId, branchBId);
}

/**
 * Get recent history across all items in a branch.
 *
 * Useful for showing an activity feed or audit log.
 *
 * @param db - Database instance
 * @param branchId - Branch ID
 * @param limit - Maximum number of records to return (default: 50)
 * @returns Recent history records ordered by snapshot time (newest first)
 *
 * @example
 * ```typescript
 * const recentChanges = getRecentHistory(db, 'main', 20);
 * recentChanges.forEach(h => {
 *   console.log(`${h.snapshot_at}: ${h.op} on ${h.title}`);
 * });
 * ```
 */
export function getRecentHistory(
  db: Database,
  branchId: string,
  limit: number = 50
): ItemHistory[] {
  const sql = `
    SELECT * FROM item_history
    WHERE branch_id = ?
    ORDER BY snapshot_at DESC
    LIMIT ?
  `;

  const result = db.exec(sql, [branchId, limit]);

  return parseHistoryResult(result);
}

/**
 * Search history records by various criteria.
 *
 * @param db - Database instance
 * @param branchId - Branch ID
 * @param searchTerm - Text to search for in title
 * @param limit - Maximum number of records to return (default: 50)
 * @returns Matching history records
 *
 * @example
 * ```typescript
 * const results = searchHistory(db, 'main', 'authentication');
 * ```
 */
export function searchHistory(
  db: Database,
  branchId: string,
  searchTerm: string,
  limit: number = 50
): ItemHistory[] {
  const sql = `
    SELECT * FROM item_history
    WHERE branch_id = ? AND title LIKE ?
    ORDER BY snapshot_at DESC
    LIMIT ?
  `;

  const result = db.exec(sql, [branchId, `%${searchTerm}%`, limit]);

  return parseHistoryResult(result);
}

/**
 * Parse sql.js query result into typed ItemHistory array.
 *
 * @param result - Raw query result from sql.js
 * @returns Array of typed ItemHistory objects
 */
function parseHistoryResult(result: QueryExecResult[]): ItemHistory[] {
  if (result.length === 0 || !result[0]) {
    return [];
  }

  const { columns, values } = result[0];

  return values.map((row): ItemHistory => {
    const history: Record<string, unknown> = {};

    columns.forEach((col, i) => {
      history[col] = row[i];
    });

    return history as ItemHistory;
  });
}

/**
 * Parse branch comparison result and categorize differences.
 *
 * @param result - Raw query result from sql.js
 * @param branchAId - First branch ID
 * @param branchBId - Second branch ID
 * @returns Categorized comparison results
 */
function parseBranchComparisonResult(
  result: QueryExecResult[],
  branchAId: string,
  branchBId: string
): BranchComparison {
  const added: Item[] = [];
  const removed: Item[] = [];
  const changed: Array<{ before: Item; after: Item }> = [];
  const unchanged: Item[] = [];
  const diffs: ItemDiff[] = [];

  if (result.length === 0 || !result[0]) {
    return {
      branchA: branchAId,
      branchB: branchBId,
      added,
      removed,
      changed,
      unchanged,
      diffs,
    };
  }

  const { columns, values } = result[0];

  values.forEach((row) => {
    const rowObj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      rowObj[col] = row[i];
    });

    const hasA = rowObj.id_a !== null;
    const hasB = rowObj.id_b !== null;

    if (!hasA && hasB) {
      // Added in B
      const itemB = extractItemFromRow(rowObj, 'b');
      added.push(itemB);
      diffs.push({ diffType: 'added', itemA: null, itemB });
    } else if (hasA && !hasB) {
      // Removed from A
      const itemA = extractItemFromRow(rowObj, 'a');
      removed.push(itemA);
      diffs.push({ diffType: 'removed', itemA, itemB: null });
    } else if (hasA && hasB) {
      // Exists in both - check if changed
      const itemA = extractItemFromRow(rowObj, 'a');
      const itemB = extractItemFromRow(rowObj, 'b');

      if (areItemsDifferent(itemA, itemB)) {
        changed.push({ before: itemA, after: itemB });
        diffs.push({ diffType: 'changed', itemA, itemB });
      } else {
        unchanged.push(itemA);
        diffs.push({ diffType: 'unchanged', itemA, itemB });
      }
    }
  });

  return {
    branchA: branchAId,
    branchB: branchBId,
    added,
    removed,
    changed,
    unchanged,
    diffs,
  };
}

/**
 * Extract an Item object from a comparison row result.
 *
 * @param row - Row object with column data
 * @param suffix - Either 'a' or 'b' to indicate which branch
 * @returns Item object
 */
function extractItemFromRow(row: Record<string, unknown>, suffix: 'a' | 'b'): Item {
  return {
    id: row[`id_${suffix}`] as string,
    branch_id: row[`branch_${suffix}`] as string,
    type: row[`type_${suffix}`] as Item['type'],
    title: row[`title_${suffix}`] as string,
    start_date: row[`start_date_${suffix}`] as string | null,
    end_date: row[`end_date_${suffix}`] as string | null,
    owner: row[`owner_${suffix}`] as string | null,
    lane: row[`lane_${suffix}`] as string | null,
    project: row[`project_${suffix}`] as string | null,
    tags: row[`tags_${suffix}`] as string | null,
    source_id: row[`source_id_${suffix}`] as string | null,
    source_row_hash: row[`source_row_hash_${suffix}`] as string | null,
    updated_at: row[`updated_at_${suffix}`] as string,
  };
}

/**
 * Compare two items to determine if they're different.
 *
 * Compares all fields except updated_at.
 *
 * @param itemA - First item
 * @param itemB - Second item
 * @returns True if items differ, false if identical
 */
function areItemsDifferent(itemA: Item, itemB: Item): boolean {
  return (
    itemA.type !== itemB.type ||
    itemA.title !== itemB.title ||
    itemA.start_date !== itemB.start_date ||
    itemA.end_date !== itemB.end_date ||
    itemA.owner !== itemB.owner ||
    itemA.lane !== itemB.lane ||
    itemA.project !== itemB.project ||
    itemA.tags !== itemB.tags ||
    itemA.source_row_hash !== itemB.source_row_hash
  );
}
