/**
 * Query builders for views table operations
 *
 * Provides typed, parameterized query functions for CRUD operations on views.
 * All queries use parameterized statements to prevent SQL injection.
 *
 * Views store saved configurations for different data visualizations (timeline,
 * table, kanban, calendar, list). They include filters, sorts, grouping, and
 * view-specific display settings.
 *
 * @module db/queries/views.queries
 */

import type { Database } from 'sql.js';
import type { View } from '@/types/database.types';
import type { ViewDefinition, ViewType } from '@/types/view.types';

/**
 * Helper to convert database View record to ViewDefinition.
 *
 * Parses JSON fields from database strings into typed objects.
 */
function viewToDefinition(view: View): ViewDefinition {
  return {
    id: view.id,
    name: view.name,
    viewType: view.view_type as ViewType,
    filter: JSON.parse(view.filter_config),
    sort: JSON.parse(view.sort_config),
    groupBy: view.group_by,
    displayConfig: JSON.parse(view.display_config),
    isDefault: view.is_default === 1,
    createdAt: view.created_at,
    updatedAt: view.updated_at,
  };
}

/**
 * Helper to convert ViewDefinition to database View record.
 *
 * Serializes typed objects into JSON strings for storage.
 */
function definitionToView(definition: ViewDefinition): Omit<View, 'created_at' | 'updated_at'> {
  return {
    id: definition.id,
    name: definition.name,
    view_type: definition.viewType,
    filter_config: JSON.stringify(definition.filter),
    sort_config: JSON.stringify(definition.sort),
    group_by: definition.groupBy,
    display_config: JSON.stringify(definition.displayConfig),
    is_default: definition.isDefault ? 1 : 0,
  };
}

/**
 * Get all views.
 *
 * @param db - Database instance
 * @returns Array of all view definitions
 *
 * @example
 * ```typescript
 * const views = getAllViews(db);
 * console.log(`Found ${views.length} views`);
 * ```
 */
export function getAllViews(db: Database): ViewDefinition[] {
  const result = db.exec('SELECT * FROM views ORDER BY name ASC');

  if (result.length === 0 || !result[0] || !result[0].values) {
    return [];
  }

  const rows = result[0];
  const views: ViewDefinition[] = [];

  for (let i = 0; i < rows.values.length; i++) {
    const values = rows.values[i];
    if (!values) continue;

    const view: View = {
      id: values[0] as string,
      name: values[1] as string,
      view_type: values[2] as string,
      filter_config: values[3] as string,
      sort_config: values[4] as string,
      group_by: values[5] as string | null,
      display_config: values[6] as string,
      is_default: values[7] as number,
      created_at: values[8] as string,
      updated_at: values[9] as string,
    };

    views.push(viewToDefinition(view));
  }

  return views;
}

/**
 * Get a view by ID.
 *
 * @param db - Database instance
 * @param viewId - View ID to retrieve
 * @returns View definition or null if not found
 *
 * @example
 * ```typescript
 * const view = getViewById(db, 'my-view-id');
 * if (view) {
 *   console.log(`View: ${view.name}`);
 * }
 * ```
 */
export function getViewById(db: Database, viewId: string): ViewDefinition | null {
  const result = db.exec('SELECT * FROM views WHERE id = ?', [viewId]);

  if (result.length === 0 || !result[0] || !result[0].values || result[0].values.length === 0) {
    return null;
  }

  const values = result[0].values[0];
  if (!values) return null;

  const view: View = {
    id: values[0] as string,
    name: values[1] as string,
    view_type: values[2] as string,
    filter_config: values[3] as string,
    sort_config: values[4] as string,
    group_by: values[5] as string | null,
    display_config: values[6] as string,
    is_default: values[7] as number,
    created_at: values[8] as string,
    updated_at: values[9] as string,
  };

  return viewToDefinition(view);
}

/**
 * Get the default view.
 *
 * Returns the view marked as default, or null if none exists.
 * There should only be one default view at a time.
 *
 * @param db - Database instance
 * @returns Default view definition or null
 *
 * @example
 * ```typescript
 * const defaultView = getDefaultView(db);
 * if (defaultView) {
 *   console.log(`Default view: ${defaultView.name}`);
 * }
 * ```
 */
export function getDefaultView(db: Database): ViewDefinition | null {
  const result = db.exec('SELECT * FROM views WHERE is_default = 1 LIMIT 1');

  if (result.length === 0 || !result[0] || !result[0].values || result[0].values.length === 0) {
    return null;
  }

  const values = result[0].values[0];
  if (!values) return null;

  const view: View = {
    id: values[0] as string,
    name: values[1] as string,
    view_type: values[2] as string,
    filter_config: values[3] as string,
    sort_config: values[4] as string,
    group_by: values[5] as string | null,
    display_config: values[6] as string,
    is_default: values[7] as number,
    created_at: values[8] as string,
    updated_at: values[9] as string,
  };

  return viewToDefinition(view);
}

/**
 * Create a new view.
 *
 * @param db - Database instance
 * @param definition - View definition to create
 * @returns Created view definition
 *
 * @example
 * ```typescript
 * const newView = createView(db, {
 *   id: crypto.randomUUID(),
 *   name: 'My Tasks',
 *   viewType: 'table',
 *   filter: { rules: [{ field: 'type', operator: 'equals', value: 'task' }], combinator: 'and' },
 *   sort: [{ field: 'start_date', direction: 'asc' }],
 *   groupBy: null,
 *   displayConfig: { type: 'table', columns: [], frozenColumnCount: 0, rowHeight: 'normal' },
 *   isDefault: false,
 *   createdAt: new Date().toISOString(),
 *   updatedAt: new Date().toISOString()
 * });
 * ```
 */
export function createView(db: Database, definition: ViewDefinition): ViewDefinition {
  const view = definitionToView(definition);

  const sql = `
    INSERT INTO views (id, name, view_type, filter_config, sort_config, group_by, display_config, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [
    view.id,
    view.name,
    view.view_type,
    view.filter_config,
    view.sort_config,
    view.group_by,
    view.display_config,
    view.is_default,
  ]);

  // Return the created view with timestamps
  const created = getViewById(db, definition.id);
  if (!created) {
    throw new Error(`Failed to create view: ${definition.id}`);
  }

  return created;
}

/**
 * Update an existing view.
 *
 * @param db - Database instance
 * @param viewId - ID of view to update
 * @param updates - Partial view definition with fields to update
 * @returns Updated view definition or null if view not found
 *
 * @example
 * ```typescript
 * const updated = updateView(db, 'my-view-id', {
 *   name: 'Updated Name',
 *   filter: { rules: [...], combinator: 'and' }
 * });
 * ```
 */
export function updateView(
  db: Database,
  viewId: string,
  updates: Partial<ViewDefinition>
): ViewDefinition | null {
  // Get current view
  const current = getViewById(db, viewId);
  if (!current) {
    return null;
  }

  // Merge updates
  const merged: ViewDefinition = {
    ...current,
    ...updates,
    id: viewId, // Ensure ID doesn't change
    updatedAt: new Date().toISOString(),
  };

  const view = definitionToView(merged);

  const sql = `
    UPDATE views
    SET name = ?,
        view_type = ?,
        filter_config = ?,
        sort_config = ?,
        group_by = ?,
        display_config = ?,
        is_default = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `;

  db.run(sql, [
    view.name,
    view.view_type,
    view.filter_config,
    view.sort_config,
    view.group_by,
    view.display_config,
    view.is_default,
    viewId,
  ]);

  return getViewById(db, viewId);
}

/**
 * Delete a view.
 *
 * @param db - Database instance
 * @param viewId - ID of view to delete
 * @returns True if view was deleted, false if not found
 *
 * @example
 * ```typescript
 * const deleted = deleteView(db, 'my-view-id');
 * if (deleted) {
 *   console.log('View deleted');
 * }
 * ```
 */
export function deleteView(db: Database, viewId: string): boolean {
  // Check if view exists
  const exists = getViewById(db, viewId);
  if (!exists) {
    return false;
  }

  db.run('DELETE FROM views WHERE id = ?', [viewId]);
  return true;
}

/**
 * Set a view as the default view.
 *
 * Clears the default flag from all other views and sets it on the specified view.
 *
 * @param db - Database instance
 * @param viewId - ID of view to set as default
 * @returns True if successful, false if view not found
 *
 * @example
 * ```typescript
 * const success = setDefaultView(db, 'my-view-id');
 * if (success) {
 *   console.log('Default view updated');
 * }
 * ```
 */
export function setDefaultView(db: Database, viewId: string): boolean {
  // Check if view exists
  const exists = getViewById(db, viewId);
  if (!exists) {
    return false;
  }

  // Clear all default flags
  db.run('UPDATE views SET is_default = 0');

  // Set the new default
  db.run('UPDATE views SET is_default = 1, updated_at = datetime(\'now\') WHERE id = ?', [viewId]);

  return true;
}

/**
 * Get views by type.
 *
 * @param db - Database instance
 * @param viewType - Type of views to retrieve
 * @returns Array of matching view definitions
 *
 * @example
 * ```typescript
 * const tableViews = getViewsByType(db, 'table');
 * console.log(`Found ${tableViews.length} table views`);
 * ```
 */
export function getViewsByType(db: Database, viewType: ViewType): ViewDefinition[] {
  const result = db.exec('SELECT * FROM views WHERE view_type = ? ORDER BY name ASC', [viewType]);

  if (result.length === 0 || !result[0] || !result[0].values) {
    return [];
  }

  const rows = result[0];
  const views: ViewDefinition[] = [];

  for (let i = 0; i < rows.values.length; i++) {
    const values = rows.values[i];
    if (!values) continue;

    const view: View = {
      id: values[0] as string,
      name: values[1] as string,
      view_type: values[2] as string,
      filter_config: values[3] as string,
      sort_config: values[4] as string,
      group_by: values[5] as string | null,
      display_config: values[6] as string,
      is_default: values[7] as number,
      created_at: values[8] as string,
      updated_at: values[9] as string,
    };

    views.push(viewToDefinition(view));
  }

  return views;
}
