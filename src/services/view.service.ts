/**
 * View service layer for SwimLanes
 *
 * High-level service for managing views (saved query configurations and
 * display settings). Provides CRUD operations with validation and error handling.
 *
 * Views enable a Coda.io-style multi-view system where:
 * - All views share the same underlying item data
 * - Views are saved query configurations (filter, sort, group)
 * - Edits in any view propagate instantly to all others
 * - Views work across all branches (not branch-scoped)
 *
 * @module services/view.service
 */

import { databaseService } from './database.service';
import {
  getAllViews,
  getViewById,
  getDefaultView,
  createView as createViewQuery,
  updateView as updateViewQuery,
  deleteView as deleteViewQuery,
  setDefaultView as setDefaultViewQuery,
  getViewsByType,
} from '@/db/queries/views.queries';
import type {
  ViewDefinition,
  ViewType,
  ViewDisplayConfig,
  FilterConfig,
  SortConfig,
} from '@/types/view.types';

/**
 * Custom error class for view service errors.
 */
export class ViewServiceError extends Error {
  public readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ViewServiceError';
    this.cause = cause;
  }
}

/**
 * Input for creating a new view.
 *
 * Omits id, createdAt, and updatedAt which are generated automatically.
 */
export type CreateViewInput = Omit<ViewDefinition, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input for updating a view.
 *
 * All fields are optional except those that shouldn't change (id, createdAt).
 */
export type UpdateViewInput = Partial<Omit<ViewDefinition, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * View service class.
 *
 * Provides high-level operations for managing views.
 *
 * @example
 * ```typescript
 * // Create a new view
 * const view = await viewService.createView({
 *   name: 'My Tasks',
 *   viewType: 'table',
 *   filter: { rules: [], combinator: 'and' },
 *   sort: [{ field: 'start_date', direction: 'asc' }],
 *   groupBy: null,
 *   displayConfig: { type: 'table', columns: [], frozenColumnCount: 0, rowHeight: 'normal' },
 *   isDefault: false
 * });
 *
 * // Get all views
 * const views = await viewService.getAllViews();
 *
 * // Update a view
 * await viewService.updateView(view.id, { name: 'Updated Name' });
 *
 * // Delete a view
 * await viewService.deleteView(view.id);
 * ```
 */
export class ViewService {
  /**
   * Get all views.
   *
   * @returns Promise resolving to array of all view definitions
   * @throws {ViewServiceError} If database is not initialized or query fails
   */
  async getAllViews(): Promise<ViewDefinition[]> {
    const db = databaseService.getDatabase();
    if (!db) {
      throw new ViewServiceError('Database not initialized');
    }

    try {
      return getAllViews(db);
    } catch (error) {
      throw new ViewServiceError('Failed to get views', error);
    }
  }

  /**
   * Get a view by ID.
   *
   * @param viewId - View ID to retrieve
   * @returns Promise resolving to view definition or null if not found
   * @throws {ViewServiceError} If database is not initialized or query fails
   */
  async getViewById(viewId: string): Promise<ViewDefinition | null> {
    const db = databaseService.getDatabase();
    if (!db) {
      throw new ViewServiceError('Database not initialized');
    }

    try {
      return getViewById(db, viewId);
    } catch (error) {
      throw new ViewServiceError(`Failed to get view: ${viewId}`, error);
    }
  }

  /**
   * Get the default view.
   *
   * @returns Promise resolving to default view or null if none exists
   * @throws {ViewServiceError} If database is not initialized or query fails
   */
  async getDefaultView(): Promise<ViewDefinition | null> {
    const db = databaseService.getDatabase();
    if (!db) {
      throw new ViewServiceError('Database not initialized');
    }

    try {
      return getDefaultView(db);
    } catch (error) {
      throw new ViewServiceError('Failed to get default view', error);
    }
  }

  /**
   * Get views by type.
   *
   * @param viewType - Type of views to retrieve
   * @returns Promise resolving to array of matching view definitions
   * @throws {ViewServiceError} If database is not initialized or query fails
   */
  async getViewsByType(viewType: ViewType): Promise<ViewDefinition[]> {
    const db = databaseService.getDatabase();
    if (!db) {
      throw new ViewServiceError('Database not initialized');
    }

    try {
      return getViewsByType(db, viewType);
    } catch (error) {
      throw new ViewServiceError(`Failed to get views of type: ${viewType}`, error);
    }
  }

  /**
   * Create a new view.
   *
   * @param input - View configuration
   * @returns Promise resolving to created view definition
   * @throws {ViewServiceError} If validation fails or creation fails
   */
  async createView(input: CreateViewInput): Promise<ViewDefinition> {
    const db = databaseService.getDatabase();
    if (!db) {
      throw new ViewServiceError('Database not initialized');
    }

    // Validate input
    this.validateViewInput(input);

    // Generate ID and timestamps
    const now = new Date().toISOString();
    const definition: ViewDefinition = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const created = createViewQuery(db, definition);

      // Save database to persistence
      await databaseService.saveToIndexedDB();

      return created;
    } catch (error) {
      throw new ViewServiceError('Failed to create view', error);
    }
  }

  /**
   * Update an existing view.
   *
   * @param viewId - ID of view to update
   * @param updates - Partial view definition with fields to update
   * @returns Promise resolving to updated view definition
   * @throws {ViewServiceError} If view not found, validation fails, or update fails
   */
  async updateView(viewId: string, updates: UpdateViewInput): Promise<ViewDefinition> {
    const db = databaseService.getDatabase();
    if (!db) {
      throw new ViewServiceError('Database not initialized');
    }

    // Validate updates
    if (Object.keys(updates).length === 0) {
      throw new ViewServiceError('No updates provided');
    }

    // If display config is being updated, validate it
    if (updates.displayConfig) {
      this.validateDisplayConfig(updates.displayConfig);
    }

    try {
      const updated = updateViewQuery(db, viewId, updates);

      if (!updated) {
        throw new ViewServiceError(`View not found: ${viewId}`);
      }

      // Save database to persistence
      await databaseService.saveToIndexedDB();

      return updated;
    } catch (error) {
      if (error instanceof ViewServiceError) {
        throw error;
      }
      throw new ViewServiceError(`Failed to update view: ${viewId}`, error);
    }
  }

  /**
   * Delete a view.
   *
   * @param viewId - ID of view to delete
   * @returns Promise resolving to true if deleted, false if not found
   * @throws {ViewServiceError} If database is not initialized or delete fails
   */
  async deleteView(viewId: string): Promise<boolean> {
    const db = databaseService.getDatabase();
    if (!db) {
      throw new ViewServiceError('Database not initialized');
    }

    try {
      const deleted = deleteViewQuery(db, viewId);

      if (deleted) {
        // Save database to persistence
        await databaseService.saveToIndexedDB();
      }

      return deleted;
    } catch (error) {
      throw new ViewServiceError(`Failed to delete view: ${viewId}`, error);
    }
  }

  /**
   * Set a view as the default view.
   *
   * Clears the default flag from all other views.
   *
   * @param viewId - ID of view to set as default
   * @returns Promise resolving to true if successful
   * @throws {ViewServiceError} If view not found or update fails
   */
  async setDefaultView(viewId: string): Promise<boolean> {
    const db = databaseService.getDatabase();
    if (!db) {
      throw new ViewServiceError('Database not initialized');
    }

    try {
      const success = setDefaultViewQuery(db, viewId);

      if (!success) {
        throw new ViewServiceError(`View not found: ${viewId}`);
      }

      // Save database to persistence
      await databaseService.saveToIndexedDB();

      return success;
    } catch (error) {
      if (error instanceof ViewServiceError) {
        throw error;
      }
      throw new ViewServiceError(`Failed to set default view: ${viewId}`, error);
    }
  }

  /**
   * Duplicate a view with a new name.
   *
   * @param viewId - ID of view to duplicate
   * @param newName - Name for the duplicated view
   * @returns Promise resolving to new view definition
   * @throws {ViewServiceError} If source view not found or creation fails
   */
  async duplicateView(viewId: string, newName: string): Promise<ViewDefinition> {
    const source = await this.getViewById(viewId);

    if (!source) {
      throw new ViewServiceError(`View not found: ${viewId}`);
    }

    // Create duplicate with new ID and name
    return this.createView({
      name: newName,
      viewType: source.viewType,
      filter: source.filter,
      sort: source.sort,
      groupBy: source.groupBy,
      displayConfig: source.displayConfig,
      isDefault: false, // Duplicates are never default
    });
  }

  /**
   * Validate view input.
   *
   * @param input - View input to validate
   * @throws {ViewServiceError} If validation fails
   */
  private validateViewInput(input: CreateViewInput): void {
    if (!input.name || input.name.trim() === '') {
      throw new ViewServiceError('View name is required');
    }

    if (input.name.length > 100) {
      throw new ViewServiceError('View name must be 100 characters or less');
    }

    const validViewTypes: ViewType[] = ['timeline', 'table', 'kanban', 'calendar', 'list'];
    if (!validViewTypes.includes(input.viewType)) {
      throw new ViewServiceError(`Invalid view type: ${input.viewType}`);
    }

    this.validateFilterConfig(input.filter);
    this.validateSortConfig(input.sort);
    this.validateDisplayConfig(input.displayConfig);
  }

  /**
   * Validate filter configuration.
   *
   * @param filter - Filter config to validate
   * @throws {ViewServiceError} If validation fails
   */
  private validateFilterConfig(filter: FilterConfig): void {
    if (!filter || typeof filter !== 'object') {
      throw new ViewServiceError('Filter config must be an object');
    }

    if (!Array.isArray(filter.rules)) {
      throw new ViewServiceError('Filter rules must be an array');
    }

    if (filter.combinator !== 'and' && filter.combinator !== 'or') {
      throw new ViewServiceError('Filter combinator must be "and" or "or"');
    }

    // Validate each rule
    for (const rule of filter.rules) {
      if (!rule.field || typeof rule.field !== 'string') {
        throw new ViewServiceError('Filter rule must have a field name');
      }

      if (!rule.operator || typeof rule.operator !== 'string') {
        throw new ViewServiceError('Filter rule must have an operator');
      }
    }
  }

  /**
   * Validate sort configuration.
   *
   * @param sort - Sort config to validate
   * @throws {ViewServiceError} If validation fails
   */
  private validateSortConfig(sort: SortConfig[]): void {
    if (!Array.isArray(sort)) {
      throw new ViewServiceError('Sort config must be an array');
    }

    for (const config of sort) {
      if (!config.field || typeof config.field !== 'string') {
        throw new ViewServiceError('Sort config must have a field name');
      }

      if (config.direction !== 'asc' && config.direction !== 'desc') {
        throw new ViewServiceError('Sort direction must be "asc" or "desc"');
      }
    }
  }

  /**
   * Validate display configuration.
   *
   * @param displayConfig - Display config to validate
   * @throws {ViewServiceError} If validation fails
   */
  private validateDisplayConfig(displayConfig: ViewDisplayConfig): void {
    if (!displayConfig || typeof displayConfig !== 'object') {
      throw new ViewServiceError('Display config must be an object');
    }

    if (!displayConfig.type) {
      throw new ViewServiceError('Display config must have a type');
    }

    // Type-specific validation
    switch (displayConfig.type) {
      case 'timeline':
        // Validate timeline config
        break;
      case 'table':
        if (!Array.isArray(displayConfig.columns)) {
          throw new ViewServiceError('Table display config must have columns array');
        }
        break;
      case 'kanban':
        if (!displayConfig.columnField) {
          throw new ViewServiceError('Kanban display config must have columnField');
        }
        break;
      case 'calendar':
        // Validate calendar config
        break;
      case 'list':
        // Validate list config
        break;
      default:
        throw new ViewServiceError(`Invalid display config type: ${(displayConfig as any).type}`);
    }
  }
}

/**
 * Singleton view service instance.
 */
export const viewService = new ViewService();
