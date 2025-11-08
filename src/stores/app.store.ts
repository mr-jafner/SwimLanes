/**
 * Global application state store
 *
 * Manages high-level application state:
 * - Database initialization status
 * - Active tab/view
 * - Global error state
 */

import { create } from 'zustand';

/**
 * Available application tabs/views
 */
export type AppTab = 'import' | 'timeline' | 'branches' | 'history' | 'export';

/**
 * Global application state interface
 */
interface AppState {
  // Database connection
  isInitialized: boolean;
  isInitializing: boolean;
  initError: string | null;

  // UI state
  activeTab: AppTab;

  // Actions
  setActiveTab: (tab: AppTab) => void;
  setInitialized: (initialized: boolean) => void;
  setInitializing: (initializing: boolean) => void;
  setInitError: (error: string | null) => void;
}

/**
 * Global application store
 *
 * Usage:
 * ```typescript
 * const { activeTab, setActiveTab } = useAppStore();
 * setActiveTab('timeline');
 * ```
 */
export const useAppStore = create<AppState>()((set) => ({
  // Initial state
  isInitialized: false,
  isInitializing: false,
  initError: null,
  activeTab: 'import',

  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  setInitialized: (initialized) =>
    set({ isInitialized: initialized, isInitializing: false, initError: null }),
  setInitializing: (initializing) => set({ isInitializing: initializing }),
  setInitError: (error) => set({ initError: error, isInitializing: false, isInitialized: false }),
}));
