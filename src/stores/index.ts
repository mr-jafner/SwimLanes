/**
 * Barrel export for all Zustand stores
 *
 * This file provides a centralized export point for all stores,
 * enabling clean imports throughout the application.
 *
 * @example
 * ```typescript
 * import { useAppStore, useTimelineStore, usePreferencesStore } from '@/stores';
 * ```
 */

export { useAppStore } from './app.store';
export type { AppTab } from './app.store';

export { useBranchStore } from './branch.store';

export { useImportStore } from './import.store';
export type { ImportStage, ImportMode } from './import.store';

export { usePreferencesStore } from './preferences.store';

export { useTimelineStore } from './timeline.store';

export { useUndoStore } from './undo.store';
export type { UndoAction } from './undo.store';
