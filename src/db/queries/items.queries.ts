/**
 * Query builders for item table operations
 *
 * Provides typed, parameterized query functions for CRUD operations on items.
 * All queries use parameterized statements to prevent SQL injection.
 *
 * @module db/queries/items.queries
 */

import type { Database, QueryExecResult } from 'sql.js';
import type { Item, ItemType } from '@/types/database.types';

/**
 * Filter options for querying items.
 */
export interface ItemFilters {
  /** Filter by item type(s) */
  type?: ItemType | ItemType[];

  /** Filter by project name */
  project?: string;

  /** Filter by owner name */
  owner?: string;

  /** Filter by lane name */
  lane?: string;

  /** Filter by date range (items that overlap with this range) */
  dateRange?: {
    start: string; // ISO date string
    end: string; // ISO date string
  };

  /** Filter by tag (comma-separated tags, matches any) */
  tags?: string;
}

/**
 * Partial item update fields.
 *
 * Allows updating any subset of item fields except id and branch_id.
 */
export type ItemUpdate = Partial<Omit<Item, 'id' | 'branch_id' | 'updated_at'>>;

/**
 * Result of a query operation that returns items.
 */
export interface ItemsQueryResult {
  /** Array of items matching the query */
  items: Item[];
}

/**
 * Get all items for a branch with optional filtering.
 *
 * @param db - Database instance
 * @param branchId - Branch to query items from
 * @param filters - Optional filters to apply
 * @returns Array of matching items
 *
 * @example
 * ```typescript
 * // Get all items on main branch
 * const allItems = getItems(db, 'main');
 *
 * // Get all tasks and milestones on feature branch
 * const items = getItems(db, 'feature-x', {
 *   type: ['task', 'milestone']
 * });
 *
 * // Get items in date range
 * const items = getItems(db, 'main', {
 *   dateRange: { start: '2025-01-01', end: '2025-12-31' }
 * });
 * ```
 */
export function getItems(db: Database, branchId: string, filters?: ItemFilters): Item[] {
  let sql = 'SELECT * FROM item WHERE branch_id = ?';
  const params: unknown[] = [branchId];

  // Add type filter
  if (filters?.type) {
    const types = Array.isArray(filters.type) ? filters.type : [filters.type];
    const placeholders = types.map(() => '?').join(',');
    sql += ` AND type IN (${placeholders})`;
    params.push(...types);
  }

  // Add project filter
  if (filters?.project) {
    sql += ' AND project = ?';
    params.push(filters.project);
  }

  // Add owner filter
  if (filters?.owner) {
    sql += ' AND owner = ?';
    params.push(filters.owner);
  }

  // Add lane filter
  if (filters?.lane) {
    sql += ' AND lane = ?';
    params.push(filters.lane);
  }

  // Add date range filter (items that overlap with the range)
  if (filters?.dateRange) {
    sql += ' AND (start_date <= ? AND (end_date >= ? OR end_date IS NULL))';
    params.push(filters.dateRange.end, filters.dateRange.start);
  }

  // Add tags filter (matches if any tag in comma-separated list matches)
  if (filters?.tags) {
    sql += ' AND tags LIKE ?';
    params.push(`%${filters.tags}%`);
  }

  // Add ordering
  sql += ' ORDER BY start_date, title';

  const result = db.exec(sql, params);

  return parseItemsResult(result);
}

/**
 * Get a single item by ID and branch.
 *
 * @param db - Database instance
 * @param id - Item ID
 * @param branchId - Branch ID
 * @returns The item if found, null otherwise
 *
 * @example
 * ```typescript
 * const item = getItemById(db, '550e8400-e29b-41d4-a716-446655440000', 'main');
 * if (item) {
 *   console.log(`Found: ${item.title}`);
 * }
 * ```
 */
export function getItemById(db: Database, id: string, branchId: string): Item | null {
  const sql = 'SELECT * FROM item WHERE id = ? AND branch_id = ?';
  const result = db.exec(sql, [id, branchId]);

  const items = parseItemsResult(result);
  return items.length > 0 ? items[0] : null;
}

/**
 * Insert a new item into the database.
 *
 * This will automatically trigger the item_insert_history trigger which creates
 * the first version in item_history.
 *
 * @param db - Database instance
 * @param item - Item to insert
 *
 * @example
 * ```typescript
 * insertItem(db, {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   branch_id: 'main',
 *   type: 'task',
 *   title: 'Implement authentication',
 *   start_date: '2025-02-01',
 *   end_date: '2025-02-15',
 *   owner: 'Alice',
 *   lane: 'Backend',
 *   project: 'Auth System',
 *   tags: 'security,backend',
 *   source_row_hash: null,
 *   updated_at: new Date().toISOString()
 * });
 * ```
 */
export function insertItem(db: Database, item: Item): void {
  const sql = `
    INSERT INTO item (
      id, branch_id, type, title, start_date, end_date,
      owner, lane, project, tags, source_id, source_row_hash, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [
    item.id,
    item.branch_id,
    item.type,
    item.title,
    item.start_date ?? null,
    item.end_date ?? null,
    item.owner ?? null,
    item.lane ?? null,
    item.project ?? null,
    item.tags ?? null,
    item.source_id ?? null,
    item.source_row_hash ?? null,
    item.updated_at,
  ]);
}

/**
 * Update an existing item.
 *
 * This will automatically trigger the item_update_history trigger which creates
 * a new version in item_history.
 *
 * Only the fields provided in the updates object will be modified. The updated_at
 * timestamp is automatically set to the current time.
 *
 * @param db - Database instance
 * @param id - Item ID
 * @param branchId - Branch ID
 * @param updates - Fields to update
 * @returns Number of rows updated (1 if successful, 0 if item not found)
 *
 * @example
 * ```typescript
 * // Update just the title and end date
 * updateItem(db, '550e8400-e29b-41d4-a716-446655440000', 'main', {
 *   title: 'New title',
 *   end_date: '2025-03-01'
 * });
 * ```
 */
export function updateItem(
  db: Database,
  id: string,
  branchId: string,
  updates: ItemUpdate
): number {
  const setClauses: string[] = [];
  const params: unknown[] = [];

  // Build SET clause dynamically based on provided updates
  const allowedFields = [
    'type',
    'title',
    'start_date',
    'end_date',
    'owner',
    'lane',
    'project',
    'tags',
    'source_id',
    'source_row_hash',
  ] as const;

  for (const field of allowedFields) {
    if (field in updates) {
      setClauses.push(`${field} = ?`);
      const value = updates[field as keyof ItemUpdate];
      params.push(value ?? null);
    }
  }

  // Always update the timestamp
  setClauses.push('updated_at = ?');
  params.push(new Date().toISOString());

  // Add WHERE parameters
  params.push(id, branchId);

  const sql = `
    UPDATE item
    SET ${setClauses.join(', ')}
    WHERE id = ? AND branch_id = ?
  `;

  db.run(sql, params);

  // Return number of rows affected
  return db.getRowsModified();
}

/**
 * Delete an item from the database.
 *
 * Note: This permanently deletes the item from the item table, but the history
 * remains in item_history for audit purposes. Future enhancement: add soft delete
 * support via a status column.
 *
 * @param db - Database instance
 * @param id - Item ID
 * @param branchId - Branch ID
 * @returns Number of rows deleted (1 if successful, 0 if item not found)
 *
 * @example
 * ```typescript
 * const deleted = deleteItem(db, '550e8400-e29b-41d4-a716-446655440000', 'main');
 * if (deleted) {
 *   console.log('Item deleted successfully');
 * }
 * ```
 */
export function deleteItem(db: Database, id: string, branchId: string): number {
  const sql = 'DELETE FROM item WHERE id = ? AND branch_id = ?';
  db.run(sql, [id, branchId]);

  return db.getRowsModified();
}

/**
 * Count items matching the given filters.
 *
 * @param db - Database instance
 * @param branchId - Branch to query items from
 * @param filters - Optional filters to apply
 * @returns Number of matching items
 *
 * @example
 * ```typescript
 * const taskCount = countItems(db, 'main', { type: 'task' });
 * console.log(`Total tasks: ${taskCount}`);
 * ```
 */
export function countItems(db: Database, branchId: string, filters?: ItemFilters): number {
  let sql = 'SELECT COUNT(*) as count FROM item WHERE branch_id = ?';
  const params: unknown[] = [branchId];

  // Add type filter
  if (filters?.type) {
    const types = Array.isArray(filters.type) ? filters.type : [filters.type];
    const placeholders = types.map(() => '?').join(',');
    sql += ` AND type IN (${placeholders})`;
    params.push(...types);
  }

  // Add project filter
  if (filters?.project) {
    sql += ' AND project = ?';
    params.push(filters.project);
  }

  // Add owner filter
  if (filters?.owner) {
    sql += ' AND owner = ?';
    params.push(filters.owner);
  }

  // Add lane filter
  if (filters?.lane) {
    sql += ' AND lane = ?';
    params.push(filters.lane);
  }

  // Add date range filter
  if (filters?.dateRange) {
    sql += ' AND (start_date <= ? AND (end_date >= ? OR end_date IS NULL))';
    params.push(filters.dateRange.end, filters.dateRange.start);
  }

  // Add tags filter
  if (filters?.tags) {
    sql += ' AND tags LIKE ?';
    params.push(`%${filters.tags}%`);
  }

  const result = db.exec(sql, params);

  if (result.length === 0 || !result[0] || result[0].values.length === 0) {
    return 0;
  }

  const firstRow = result[0].values[0];
  return firstRow && firstRow[0] !== undefined ? (firstRow[0] as number) : 0;
}

/**
 * Parse sql.js query result into typed Item array.
 *
 * @param result - Raw query result from sql.js
 * @returns Array of typed Item objects
 */
function parseItemsResult(result: QueryExecResult[]): Item[] {
  if (result.length === 0 || !result[0]) {
    return [];
  }

  const { columns, values } = result[0];

  return values.map((row): Item => {
    const item: Record<string, unknown> = {};

    columns.forEach((col, i) => {
      item[col] = row[i];
    });

    return item as Item;
  });
}
