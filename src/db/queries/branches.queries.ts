/**
 * Query builders for branches table operations
 *
 * Provides typed, parameterized query functions for managing branches.
 * All queries use parameterized statements to prevent SQL injection.
 *
 * @module db/queries/branches.queries
 */

import type { Database, QueryExecResult } from 'sql.js';
import type { Branch } from '@/types/database.types';

/**
 * Get all branches in the database.
 *
 * @param db - Database instance
 * @returns Array of all branches, ordered by creation date
 *
 * @example
 * ```typescript
 * const branches = getBranches(db);
 * branches.forEach(b => {
 *   console.log(`${b.label} (from: ${b.created_from})`);
 * });
 * ```
 */
export function getBranches(db: Database): Branch[] {
  const sql = 'SELECT * FROM branches ORDER BY created_at DESC';
  const result = db.exec(sql);

  return parseBranchesResult(result);
}

/**
 * Get a single branch by ID.
 *
 * @param db - Database instance
 * @param branchId - Branch ID to retrieve
 * @returns The branch if found, null otherwise
 *
 * @example
 * ```typescript
 * const branch = getBranchById(db, 'main');
 * if (branch) {
 *   console.log(`Branch: ${branch.label}`);
 * }
 * ```
 */
export function getBranchById(db: Database, branchId: string): Branch | null {
  const sql = 'SELECT * FROM branches WHERE branch_id = ?';
  const result = db.exec(sql, [branchId]);

  const branches = parseBranchesResult(result);
  return branches.length > 0 ? branches[0] : null;
}

/**
 * Create a new branch by copying items from an existing branch.
 *
 * This operation:
 * 1. Inserts the new branch into the branches table
 * 2. Copies all items from the source branch to the new branch
 *
 * @param db - Database instance
 * @param fromBranchId - Source branch to copy items from
 * @param toBranchId - New branch ID to create
 * @param label - Human-readable branch name
 * @param note - Optional description of the branch purpose
 *
 * @example
 * ```typescript
 * createBranch(
 *   db,
 *   'main',
 *   'q1-stretch-goals',
 *   'Q1 Stretch Goals',
 *   'What if we add these 5 extra features?'
 * );
 * ```
 */
export function createBranch(
  db: Database,
  fromBranchId: string,
  toBranchId: string,
  label: string,
  note?: string
): void {
  // Check if source branch exists
  const sourceBranch = getBranchById(db, fromBranchId);
  if (!sourceBranch) {
    throw new Error(`Source branch '${fromBranchId}' does not exist`);
  }

  // Check if target branch already exists
  const existingBranch = getBranchById(db, toBranchId);
  if (existingBranch) {
    throw new Error(`Branch '${toBranchId}' already exists`);
  }

  // Insert new branch record
  const insertBranchSql = `
    INSERT INTO branches (branch_id, label, created_from, note)
    VALUES (?, ?, ?, ?)
  `;

  db.run(insertBranchSql, [toBranchId, label, fromBranchId, note ?? null]);

  // Copy all items from source branch to new branch
  const copyItemsSql = `
    INSERT INTO item (
      id, branch_id, type, title, start_date, end_date,
      owner, lane, project, tags, source_id, source_row_hash, updated_at
    )
    SELECT
      id, ? as branch_id, type, title, start_date, end_date,
      owner, lane, project, tags, source_id, source_row_hash, updated_at
    FROM item
    WHERE branch_id = ?
  `;

  db.run(copyItemsSql, [toBranchId, fromBranchId]);
}

/**
 * Delete a branch and all its items.
 *
 * WARNING: This is a destructive operation that:
 * - Deletes all items associated with the branch
 * - Deletes the branch record
 * - Cannot be undone (though history in item_history is preserved)
 *
 * The 'main' branch cannot be deleted.
 *
 * @param db - Database instance
 * @param branchId - Branch ID to delete
 * @throws Error if attempting to delete 'main' branch or if branch doesn't exist
 *
 * @example
 * ```typescript
 * deleteBranch(db, 'old-experiment');
 * ```
 */
export function deleteBranch(db: Database, branchId: string): void {
  // Prevent deleting main branch
  if (branchId === 'main') {
    throw new Error("Cannot delete 'main' branch");
  }

  // Check if branch exists
  const branch = getBranchById(db, branchId);
  if (!branch) {
    throw new Error(`Branch '${branchId}' does not exist`);
  }

  // Delete all items in this branch
  const deleteItemsSql = 'DELETE FROM item WHERE branch_id = ?';
  db.run(deleteItemsSql, [branchId]);

  // Delete branch record
  const deleteBranchSql = 'DELETE FROM branches WHERE branch_id = ?';
  db.run(deleteBranchSql, [branchId]);
}

/**
 * Update branch metadata (label and/or note).
 *
 * @param db - Database instance
 * @param branchId - Branch ID to update
 * @param updates - Fields to update
 * @returns Number of rows updated (1 if successful, 0 if branch not found)
 *
 * @example
 * ```typescript
 * updateBranch(db, 'feature-x', {
 *   label: 'Feature X - Updated',
 *   note: 'Updated description'
 * });
 * ```
 */
export function updateBranch(
  db: Database,
  branchId: string,
  updates: { label?: string; note?: string }
): number {
  const setClauses: string[] = [];
  const params: unknown[] = [];

  if (updates.label !== undefined) {
    setClauses.push('label = ?');
    params.push(updates.label);
  }

  if (updates.note !== undefined) {
    setClauses.push('note = ?');
    params.push(updates.note);
  }

  if (setClauses.length === 0) {
    return 0; // No updates to perform
  }

  params.push(branchId);

  const sql = `
    UPDATE branches
    SET ${setClauses.join(', ')}
    WHERE branch_id = ?
  `;

  db.run(sql, params);

  return db.getRowsModified();
}

/**
 * Count the number of items in a branch.
 *
 * @param db - Database instance
 * @param branchId - Branch ID to count items for
 * @returns Number of items in the branch
 *
 * @example
 * ```typescript
 * const count = getItemCountForBranch(db, 'main');
 * console.log(`Main branch has ${count} items`);
 * ```
 */
export function getItemCountForBranch(db: Database, branchId: string): number {
  const sql = 'SELECT COUNT(*) as count FROM item WHERE branch_id = ?';
  const result = db.exec(sql, [branchId]);

  if (result.length === 0 || !result[0] || result[0].values.length === 0) {
    return 0;
  }

  const firstRow = result[0].values[0];
  return firstRow && firstRow[0] !== undefined ? (firstRow[0] as number) : 0;
}

/**
 * Parse sql.js query result into typed Branch array.
 *
 * @param result - Raw query result from sql.js
 * @returns Array of typed Branch objects
 */
function parseBranchesResult(result: QueryExecResult[]): Branch[] {
  if (result.length === 0 || !result[0]) {
    return [];
  }

  const { columns, values } = result[0];

  return values.map((row): Branch => {
    const branch: Record<string, unknown> = {};

    columns.forEach((col, i) => {
      branch[col] = row[i];
    });

    return branch as Branch;
  });
}
