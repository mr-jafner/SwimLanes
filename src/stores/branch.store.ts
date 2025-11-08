/**
 * Branch state management store
 *
 * Manages branch selection, comparison, and cached branch data.
 * Provides actions for refreshing branches from database and managing
 * branch comparison state.
 */

import { create } from 'zustand';
import type { Branch } from '@/types/database.types';
import type { ComparisonResult } from '@/types/branch.types';
import { databaseService } from '@/services/database.service';
import { getBranches } from '@/db/queries/branches.queries';

/**
 * Branch state interface
 */
interface BranchState {
  // Branch selection (different contexts)
  currentBranch: string; // Active branch for most operations
  viewBranch: string; // Branch being viewed in timeline
  importBranch: string; // Branch for import operations

  // Branch comparison
  compareBranchA: string;
  compareBranchB: string;
  comparisonResult: ComparisonResult | null;

  // Available branches (cached from database)
  branches: Branch[];

  // Actions
  setCurrentBranch: (branchId: string) => void;
  setViewBranch: (branchId: string) => void;
  setImportBranch: (branchId: string) => void;
  setCompareBranchA: (branchId: string) => void;
  setCompareBranchB: (branchId: string) => void;
  setComparisonResult: (result: ComparisonResult | null) => void;
  setBranches: (branches: Branch[]) => void;
  refreshBranches: () => Promise<void>;
}

/**
 * Branch store
 *
 * Usage:
 * ```typescript
 * const { branches, refreshBranches } = useBranchStore();
 *
 * // Load branches from database
 * await refreshBranches();
 *
 * // Select a branch
 * setCurrentBranch('feature-x');
 * ```
 */
export const useBranchStore = create<BranchState>()((set) => ({
  // Initial state
  currentBranch: 'main',
  viewBranch: 'main',
  importBranch: 'main',
  compareBranchA: 'main',
  compareBranchB: 'main',
  comparisonResult: null,
  branches: [],

  // Actions
  setCurrentBranch: (branchId) => set({ currentBranch: branchId }),
  setViewBranch: (branchId) => set({ viewBranch: branchId }),
  setImportBranch: (branchId) => set({ importBranch: branchId }),
  setCompareBranchA: (branchId) => set({ compareBranchA: branchId }),
  setCompareBranchB: (branchId) => set({ compareBranchB: branchId }),
  setComparisonResult: (result) => set({ comparisonResult: result }),
  setBranches: (branches) => set({ branches }),

  /**
   * Refresh branches from database
   *
   * Queries the database for all branches and updates the cached list.
   * Should be called after creating, deleting, or updating branches.
   *
   * @throws {Error} If database is not initialized
   */
  refreshBranches: async () => {
    if (!databaseService.isReady()) {
      throw new Error('Database is not initialized');
    }

    const db = databaseService.getDatabase();
    const branches = getBranches(db);

    set({ branches });
  },
}));
