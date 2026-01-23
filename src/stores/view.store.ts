/**
 * View state management store
 *
 * Manages view definitions and active view selection.
 * Provides CRUD operations for views through the view service.
 *
 * @module stores/view.store
 */

import { create } from 'zustand';
import { viewService, type CreateViewInput, type UpdateViewInput } from '@/services/view.service';
import type { ViewDefinition, ViewType } from '@/types/view.types';

/**
 * View state interface
 */
interface ViewState {
  // View data
  views: ViewDefinition[];
  activeViewId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadViews: () => Promise<void>;
  getViewById: (viewId: string) => ViewDefinition | null;
  getDefaultView: () => ViewDefinition | null;
  getViewsByType: (viewType: ViewType) => ViewDefinition[];
  createView: (input: CreateViewInput) => Promise<ViewDefinition>;
  updateView: (viewId: string, updates: UpdateViewInput) => Promise<ViewDefinition>;
  deleteView: (viewId: string) => Promise<boolean>;
  setDefaultView: (viewId: string) => Promise<void>;
  duplicateView: (viewId: string, newName: string) => Promise<ViewDefinition>;
  setActiveView: (viewId: string | null) => void;
}

/**
 * View store
 *
 * Manages view definitions and provides CRUD operations.
 *
 * @example
 * ```typescript
 * // Load views on app startup
 * const { loadViews } = useViewStore();
 * await loadViews();
 *
 * // Create a new view
 * const { createView } = useViewStore();
 * const newView = await createView({
 *   name: 'My Tasks',
 *   viewType: 'table',
 *   filter: { rules: [], combinator: 'and' },
 *   sort: [],
 *   groupBy: null,
 *   displayConfig: { type: 'table', columns: [], frozenColumnCount: 0, rowHeight: 'normal' },
 *   isDefault: false
 * });
 *
 * // Get active view
 * const { views, activeViewId } = useViewStore();
 * const activeView = views.find(v => v.id === activeViewId);
 * ```
 */
export const useViewStore = create<ViewState>()((set, get) => ({
  // Initial state
  views: [],
  activeViewId: null,
  isLoading: false,
  error: null,

  /**
   * Load all views from the database.
   *
   * Should be called on app startup after database initialization.
   */
  loadViews: async () => {
    set({ isLoading: true, error: null });

    try {
      const views = await viewService.getAllViews();

      // If no active view is set, use the default view
      const currentActiveViewId = get().activeViewId;
      let activeViewId = currentActiveViewId;

      if (!activeViewId && views.length > 0) {
        const defaultView = views.find((v) => v.isDefault);
        activeViewId = defaultView?.id ?? views[0]?.id ?? null;
      }

      set({ views, activeViewId, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load views';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  /**
   * Get a view by ID.
   *
   * @param viewId - View ID to retrieve
   * @returns View definition or null if not found
   */
  getViewById: (viewId: string) => {
    return get().views.find((v) => v.id === viewId) ?? null;
  },

  /**
   * Get the default view.
   *
   * @returns Default view or null if none exists
   */
  getDefaultView: () => {
    return get().views.find((v) => v.isDefault) ?? null;
  },

  /**
   * Get views by type.
   *
   * @param viewType - Type of views to retrieve
   * @returns Array of matching view definitions
   */
  getViewsByType: (viewType: ViewType) => {
    return get().views.filter((v) => v.viewType === viewType);
  },

  /**
   * Create a new view.
   *
   * @param input - View configuration
   * @returns Created view definition
   */
  createView: async (input: CreateViewInput) => {
    set({ isLoading: true, error: null });

    try {
      const newView = await viewService.createView(input);

      set((state) => ({
        views: [...state.views, newView],
        isLoading: false,
      }));

      return newView;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create view';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  /**
   * Update an existing view.
   *
   * @param viewId - ID of view to update
   * @param updates - Partial view definition with fields to update
   * @returns Updated view definition
   */
  updateView: async (viewId: string, updates: UpdateViewInput) => {
    set({ isLoading: true, error: null });

    try {
      const updated = await viewService.updateView(viewId, updates);

      set((state) => ({
        views: state.views.map((v) => (v.id === viewId ? updated : v)),
        isLoading: false,
      }));

      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update view';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  /**
   * Delete a view.
   *
   * @param viewId - ID of view to delete
   * @returns True if deleted
   */
  deleteView: async (viewId: string) => {
    set({ isLoading: true, error: null });

    try {
      const deleted = await viewService.deleteView(viewId);

      if (deleted) {
        set((state) => {
          const views = state.views.filter((v) => v.id !== viewId);

          // If deleted view was active, switch to first view or null
          let activeViewId = state.activeViewId;
          if (activeViewId === viewId) {
            activeViewId = views.length > 0 ? views[0]?.id ?? null : null;
          }

          return {
            views,
            activeViewId,
            isLoading: false,
          };
        });
      } else {
        set({ isLoading: false });
      }

      return deleted;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete view';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  /**
   * Set a view as the default view.
   *
   * @param viewId - ID of view to set as default
   */
  setDefaultView: async (viewId: string) => {
    set({ isLoading: true, error: null });

    try {
      await viewService.setDefaultView(viewId);

      // Update all views to reflect the new default
      set((state) => ({
        views: state.views.map((v) => ({
          ...v,
          isDefault: v.id === viewId,
        })),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set default view';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  /**
   * Duplicate a view with a new name.
   *
   * @param viewId - ID of view to duplicate
   * @param newName - Name for the duplicated view
   * @returns New view definition
   */
  duplicateView: async (viewId: string, newName: string) => {
    set({ isLoading: true, error: null });

    try {
      const newView = await viewService.duplicateView(viewId, newName);

      set((state) => ({
        views: [...state.views, newView],
        isLoading: false,
      }));

      return newView;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to duplicate view';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  /**
   * Set the active view.
   *
   * @param viewId - ID of view to make active (or null for no view)
   */
  setActiveView: (viewId: string | null) => {
    set({ activeViewId: viewId });
  },
}));
