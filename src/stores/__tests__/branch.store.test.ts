/**
 * Tests for branch.store.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBranchStore } from '../branch.store';
import type { Branch } from '@/types/database.types';

// Mock the database service
vi.mock('@/services/database.service', () => ({
  databaseService: {
    isReady: vi.fn(() => true),
    getDatabase: vi.fn(() => ({
      exec: vi.fn(),
      run: vi.fn(),
    })),
  },
}));

// Mock the branches queries
vi.mock('@/db/queries/branches.queries', () => ({
  getBranches: vi.fn(() => mockBranches),
}));

const mockBranches: Branch[] = [
  {
    branch_id: 'main',
    label: 'Main',
    created_from: null,
    note: null,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    branch_id: 'feature-x',
    label: 'Feature X',
    created_from: 'main',
    note: 'Testing feature X',
    created_at: '2025-01-15T10:00:00Z',
  },
];

describe('branch.store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const { result } = renderHook(() => useBranchStore());
    act(() => {
      result.current.setCurrentBranch('main');
      result.current.setViewBranch('main');
      result.current.setImportBranch('main');
      result.current.setCompareBranchA('main');
      result.current.setCompareBranchB('main');
      result.current.setComparisonResult(null);
      result.current.setBranches([]);
    });
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useBranchStore());

      expect(result.current.currentBranch).toBe('main');
      expect(result.current.viewBranch).toBe('main');
      expect(result.current.importBranch).toBe('main');
      expect(result.current.compareBranchA).toBe('main');
      expect(result.current.compareBranchB).toBe('main');
      expect(result.current.comparisonResult).toBe(null);
      expect(result.current.branches).toEqual([]);
    });
  });

  describe('branch selection', () => {
    it('should update current branch', () => {
      const { result } = renderHook(() => useBranchStore());

      act(() => {
        result.current.setCurrentBranch('feature-x');
      });

      expect(result.current.currentBranch).toBe('feature-x');
    });

    it('should update view branch', () => {
      const { result } = renderHook(() => useBranchStore());

      act(() => {
        result.current.setViewBranch('feature-x');
      });

      expect(result.current.viewBranch).toBe('feature-x');
    });

    it('should update import branch', () => {
      const { result } = renderHook(() => useBranchStore());

      act(() => {
        result.current.setImportBranch('feature-x');
      });

      expect(result.current.importBranch).toBe('feature-x');
    });
  });

  describe('branch comparison', () => {
    it('should update compare branch A', () => {
      const { result } = renderHook(() => useBranchStore());

      act(() => {
        result.current.setCompareBranchA('feature-x');
      });

      expect(result.current.compareBranchA).toBe('feature-x');
    });

    it('should update compare branch B', () => {
      const { result } = renderHook(() => useBranchStore());

      act(() => {
        result.current.setCompareBranchB('feature-y');
      });

      expect(result.current.compareBranchB).toBe('feature-y');
    });

    it('should set comparison result', () => {
      const { result } = renderHook(() => useBranchStore());

      const mockResult = {
        branchA: 'main',
        branchB: 'feature-x',
        items: [],
        summary: { added: 5, removed: 2, changed: 3, unchanged: 10 },
        comparedAt: '2025-01-20T10:00:00Z',
      };

      act(() => {
        result.current.setComparisonResult(mockResult);
      });

      expect(result.current.comparisonResult).toEqual(mockResult);
    });

    it('should clear comparison result', () => {
      const { result } = renderHook(() => useBranchStore());

      const mockResult = {
        branchA: 'main',
        branchB: 'feature-x',
        items: [],
        summary: { added: 5, removed: 2, changed: 3, unchanged: 10 },
        comparedAt: '2025-01-20T10:00:00Z',
      };

      act(() => {
        result.current.setComparisonResult(mockResult);
      });

      expect(result.current.comparisonResult).toEqual(mockResult);

      act(() => {
        result.current.setComparisonResult(null);
      });

      expect(result.current.comparisonResult).toBe(null);
    });
  });

  describe('branches cache', () => {
    it('should update branches list', () => {
      const { result } = renderHook(() => useBranchStore());

      act(() => {
        result.current.setBranches(mockBranches);
      });

      expect(result.current.branches).toEqual(mockBranches);
      expect(result.current.branches).toHaveLength(2);
    });

    it('should refresh branches from database', async () => {
      const { result } = renderHook(() => useBranchStore());

      await act(async () => {
        await result.current.refreshBranches();
      });

      expect(result.current.branches).toEqual(mockBranches);
    });

    it('should throw error if database is not ready', async () => {
      const { databaseService } = await import('@/services/database.service');

      // Mock database as not ready
      vi.mocked(databaseService.isReady).mockReturnValueOnce(false);

      const { result } = renderHook(() => useBranchStore());

      await expect(async () => {
        await act(async () => {
          await result.current.refreshBranches();
        });
      }).rejects.toThrow('Database is not initialized');
    });
  });

  describe('multiple branch context management', () => {
    it('should manage different branches for different contexts', () => {
      const { result } = renderHook(() => useBranchStore());

      act(() => {
        result.current.setCurrentBranch('main');
        result.current.setViewBranch('feature-x');
        result.current.setImportBranch('feature-y');
        result.current.setCompareBranchA('feature-x');
        result.current.setCompareBranchB('feature-y');
      });

      expect(result.current.currentBranch).toBe('main');
      expect(result.current.viewBranch).toBe('feature-x');
      expect(result.current.importBranch).toBe('feature-y');
      expect(result.current.compareBranchA).toBe('feature-x');
      expect(result.current.compareBranchB).toBe('feature-y');
    });
  });
});
