/**
 * Import workflow state management store
 *
 * Manages the three-stage import workflow:
 * 1. Parse CSV/JSON files
 * 2. Map columns to fields
 * 3. Dry-run preview and commit
 *
 * State machine stages: idle → parsed → mapped → dry-run → committing → complete
 */

import { create } from 'zustand';
import type { ParsedRow, ColumnMapping, DryRunResult, IDStrategy } from '@/types/import.types';

/**
 * Import workflow stages
 */
export type ImportStage = 'idle' | 'parsed' | 'mapped' | 'dry-run' | 'committing' | 'complete';

/**
 * Import mode
 */
export type ImportMode = 'upsert' | 'update-only';

/**
 * Import state interface
 */
interface ImportState {
  // Current workflow stage
  stage: ImportStage;

  // Parsed data
  currentData: ParsedRow[] | null;
  currentMapping: ColumnMapping | null;
  dryRunData: DryRunResult | null;

  // Import configuration
  targetBranch: string;
  idStrategy: IDStrategy;
  importMode: ImportMode;

  // Selected profile
  selectedProfile: string | null;

  // Actions
  setStage: (stage: ImportStage) => void;
  setCurrentData: (data: ParsedRow[] | null) => void;
  setCurrentMapping: (mapping: ColumnMapping | null) => void;
  setDryRunData: (data: DryRunResult | null) => void;
  setTargetBranch: (branchId: string) => void;
  setIdStrategy: (strategy: IDStrategy) => void;
  setImportMode: (mode: ImportMode) => void;
  setSelectedProfile: (profile: string | null) => void;
  reset: () => void;
}

/**
 * Default state values
 */
const defaultState = {
  stage: 'idle' as ImportStage,
  currentData: null,
  currentMapping: null,
  dryRunData: null,
  targetBranch: 'main',
  idStrategy: 'generate' as IDStrategy,
  importMode: 'upsert' as ImportMode,
  selectedProfile: null,
};

/**
 * Import workflow store
 *
 * Usage:
 * ```typescript
 * const { stage, setStage, currentData, setCurrentData } = useImportStore();
 *
 * // Start import workflow
 * setCurrentData(parsedRows);
 * setStage('parsed');
 *
 * // Map columns
 * setCurrentMapping(mapping);
 * setStage('mapped');
 *
 * // Preview dry-run
 * setDryRunData(dryRunResult);
 * setStage('dry-run');
 *
 * // Commit import
 * setStage('committing');
 * // ... perform import
 * setStage('complete');
 *
 * // Reset workflow
 * reset();
 * ```
 */
export const useImportStore = create<ImportState>()((set) => ({
  ...defaultState,

  // Actions
  setStage: (stage) => set({ stage }),
  setCurrentData: (data) => set({ currentData: data }),
  setCurrentMapping: (mapping) => set({ currentMapping: mapping }),
  setDryRunData: (data) => set({ dryRunData: data }),
  setTargetBranch: (branchId) => set({ targetBranch: branchId }),
  setIdStrategy: (strategy) => set({ idStrategy: strategy }),
  setImportMode: (mode) => set({ importMode: mode }),
  setSelectedProfile: (profile) => set({ selectedProfile: profile }),
  reset: () => set(defaultState),
}));
