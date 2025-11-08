/**
 * User preferences store with localStorage persistence
 *
 * Manages user settings and defaults that persist across sessions:
 * - Theme (light/dark/system)
 * - Default timeline view settings
 * - Auto-save configuration
 * - Import preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ZoomLevel, LaneGroupBy } from '@/types/timeline.types';
import type { IDStrategy } from '@/types/import.types';

/**
 * User preferences state interface
 */
interface PreferencesState {
  // Theme
  theme: 'light' | 'dark' | 'system';

  // Default values
  defaultZoomLevel: ZoomLevel;
  defaultLaneGroupBy: LaneGroupBy;
  defaultBranch: string;

  // UI preferences
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // milliseconds
  showWelcomeOnStartup: boolean;
  compactMode: boolean;

  // Import preferences
  defaultIdStrategy: IDStrategy;
  defaultTagsDelimiter: string;

  // Actions
  setTheme: (theme: PreferencesState['theme']) => void;
  setDefaultZoomLevel: (level: ZoomLevel) => void;
  setDefaultLaneGroupBy: (groupBy: LaneGroupBy) => void;
  setDefaultBranch: (branchId: string) => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  setAutoSaveInterval: (interval: number) => void;
  setShowWelcomeOnStartup: (show: boolean) => void;
  setCompactMode: (compact: boolean) => void;
  setDefaultIdStrategy: (strategy: IDStrategy) => void;
  setDefaultTagsDelimiter: (delimiter: string) => void;
  reset: () => void;
}

/**
 * Default preference values
 */
const defaultState = {
  theme: 'system' as const,
  defaultZoomLevel: 'month' as ZoomLevel,
  defaultLaneGroupBy: 'lane' as LaneGroupBy,
  defaultBranch: 'main',
  autoSaveEnabled: true,
  autoSaveInterval: 5000,
  showWelcomeOnStartup: true,
  compactMode: false,
  defaultIdStrategy: 'generate' as IDStrategy,
  defaultTagsDelimiter: ',',
};

/**
 * User preferences store with localStorage persistence
 *
 * Usage:
 * ```typescript
 * const { theme, setTheme } = usePreferencesStore();
 * setTheme('dark');
 * ```
 */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...defaultState,

      // Actions
      setTheme: (theme) => set({ theme }),
      setDefaultZoomLevel: (defaultZoomLevel) => set({ defaultZoomLevel }),
      setDefaultLaneGroupBy: (defaultLaneGroupBy) => set({ defaultLaneGroupBy }),
      setDefaultBranch: (defaultBranch) => set({ defaultBranch }),
      setAutoSaveEnabled: (autoSaveEnabled) => set({ autoSaveEnabled }),
      setAutoSaveInterval: (autoSaveInterval) => set({ autoSaveInterval }),
      setShowWelcomeOnStartup: (showWelcomeOnStartup) => set({ showWelcomeOnStartup }),
      setCompactMode: (compactMode) => set({ compactMode }),
      setDefaultIdStrategy: (defaultIdStrategy) => set({ defaultIdStrategy }),
      setDefaultTagsDelimiter: (defaultTagsDelimiter) => set({ defaultTagsDelimiter }),
      reset: () => set(defaultState),
    }),
    {
      name: 'swimlanes-preferences',
      storage: createJSONStorage(() => localStorage),
      // Only persist data, not functions
      partialize: (state) => ({
        theme: state.theme,
        defaultZoomLevel: state.defaultZoomLevel,
        defaultLaneGroupBy: state.defaultLaneGroupBy,
        defaultBranch: state.defaultBranch,
        autoSaveEnabled: state.autoSaveEnabled,
        autoSaveInterval: state.autoSaveInterval,
        showWelcomeOnStartup: state.showWelcomeOnStartup,
        compactMode: state.compactMode,
        defaultIdStrategy: state.defaultIdStrategy,
        defaultTagsDelimiter: state.defaultTagsDelimiter,
      }),
    }
  )
);
