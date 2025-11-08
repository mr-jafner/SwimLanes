/**
 * Tests for import.store.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImportStore } from '../import.store';
import type { ParsedRow, ColumnMapping, DryRunResult } from '@/types/import.types';

const mockParsedData: ParsedRow[] = [
  { Title: 'Task 1', Type: 'task', Start: '2025-01-01', End: '2025-01-15' },
  { Title: 'Task 2', Type: 'milestone', Start: '2025-02-01', End: '' },
];

const mockMapping: ColumnMapping = {
  title: 'Title',
  type: 'Type',
  start_date: 'Start',
  end_date: 'End',
  owner: 'Owner',
  lane: 'Lane',
  project: 'Project',
  tags: 'Tags',
  id: '',
  idStrategy: 'generate',
  tagsDelimiter: ',',
};

const mockDryRunData: DryRunResult = {
  added: [
    {
      item: {
        id: '1',
        branch_id: 'main',
        type: 'task',
        title: 'Task 1',
        start_date: '2025-01-01',
        end_date: '2025-01-15',
        owner: null,
        lane: null,
        project: null,
        tags: null,
        source_id: null,
        source_row_hash: null,
        updated_at: '',
      },
    },
  ],
  updated: [],
  skipped: [],
  conflicts: [],
};

describe('import.store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const { result } = renderHook(() => useImportStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useImportStore());

      expect(result.current.stage).toBe('idle');
      expect(result.current.currentData).toBe(null);
      expect(result.current.currentMapping).toBe(null);
      expect(result.current.dryRunData).toBe(null);
      expect(result.current.targetBranch).toBe('main');
      expect(result.current.idStrategy).toBe('generate');
      expect(result.current.importMode).toBe('upsert');
      expect(result.current.selectedProfile).toBe(null);
    });
  });

  describe('workflow stage management', () => {
    it('should update stage to parsed', () => {
      const { result } = renderHook(() => useImportStore());

      act(() => {
        result.current.setStage('parsed');
      });

      expect(result.current.stage).toBe('parsed');
    });

    it('should update stage to mapped', () => {
      const { result } = renderHook(() => useImportStore());

      act(() => {
        result.current.setStage('mapped');
      });

      expect(result.current.stage).toBe('mapped');
    });

    it('should update stage to dry-run', () => {
      const { result } = renderHook(() => useImportStore());

      act(() => {
        result.current.setStage('dry-run');
      });

      expect(result.current.stage).toBe('dry-run');
    });

    it('should update stage to committing', () => {
      const { result } = renderHook(() => useImportStore());

      act(() => {
        result.current.setStage('committing');
      });

      expect(result.current.stage).toBe('committing');
    });

    it('should update stage to complete', () => {
      const { result } = renderHook(() => useImportStore());

      act(() => {
        result.current.setStage('complete');
      });

      expect(result.current.stage).toBe('complete');
    });
  });

  describe('data management', () => {
    it('should set current data', () => {
      const { result } = renderHook(() => useImportStore());

      act(() => {
        result.current.setCurrentData(mockParsedData);
      });

      expect(result.current.currentData).toEqual(mockParsedData);
    });

    it('should clear current data', () => {
      const { result } = renderHook(() => useImportStore());

      act(() => {
        result.current.setCurrentData(mockParsedData);
      });

      expect(result.current.currentData).toEqual(mockParsedData);

      act(() => {
        result.current.setCurrentData(null);
      });

      expect(result.current.currentData).toBe(null);
    });

    it('should set current mapping', () => {
      const { result } = renderHook(() => useImportStore());

      act(() => {
        result.current.setCurrentMapping(mockMapping);
      });

      expect(result.current.currentMapping).toEqual(mockMapping);
    });

    it('should set dry-run data', () => {
      const { result } = renderHook(() => useImportStore());

      act(() => {
        result.current.setDryRunData(mockDryRunData);
      });

      expect(result.current.dryRunData).toEqual(mockDryRunData);
    });
  });

  describe('import configuration', () => {
    it('should update target branch', () => {
      const { result } = renderHook(() => useImportStore());

      act(() => {
        result.current.setTargetBranch('feature-x');
      });

      expect(result.current.targetBranch).toBe('feature-x');
    });

    it('should update ID strategy to column', () => {
      const { result } = renderHook(() => useImportStore());

      act(() => {
        result.current.setIdStrategy('column');
      });

      expect(result.current.idStrategy).toBe('column');
    });

    it('should update ID strategy to match', () => {
      const { result } = renderHook(() => useImportStore());

      act(() => {
        result.current.setIdStrategy('match');
      });

      expect(result.current.idStrategy).toBe('match');
    });

    it('should update import mode to update-only', () => {
      const { result } = renderHook(() => useImportStore());

      act(() => {
        result.current.setImportMode('update-only');
      });

      expect(result.current.importMode).toBe('update-only');
    });
  });

  describe('profile management', () => {
    it('should set selected profile', () => {
      const { result } = renderHook(() => useImportStore());

      act(() => {
        result.current.setSelectedProfile('jira-mapping');
      });

      expect(result.current.selectedProfile).toBe('jira-mapping');
    });

    it('should clear selected profile', () => {
      const { result } = renderHook(() => useImportStore());

      act(() => {
        result.current.setSelectedProfile('jira-mapping');
      });

      expect(result.current.selectedProfile).toBe('jira-mapping');

      act(() => {
        result.current.setSelectedProfile(null);
      });

      expect(result.current.selectedProfile).toBe(null);
    });
  });

  describe('complete workflow simulation', () => {
    it('should handle complete import workflow', () => {
      const { result } = renderHook(() => useImportStore());

      // Start with idle
      expect(result.current.stage).toBe('idle');

      // Parse data
      act(() => {
        result.current.setCurrentData(mockParsedData);
        result.current.setStage('parsed');
      });

      expect(result.current.stage).toBe('parsed');
      expect(result.current.currentData).toEqual(mockParsedData);

      // Map columns
      act(() => {
        result.current.setCurrentMapping(mockMapping);
        result.current.setStage('mapped');
      });

      expect(result.current.stage).toBe('mapped');
      expect(result.current.currentMapping).toEqual(mockMapping);

      // Dry-run
      act(() => {
        result.current.setDryRunData(mockDryRunData);
        result.current.setStage('dry-run');
      });

      expect(result.current.stage).toBe('dry-run');
      expect(result.current.dryRunData).toEqual(mockDryRunData);

      // Commit
      act(() => {
        result.current.setStage('committing');
      });

      expect(result.current.stage).toBe('committing');

      // Complete
      act(() => {
        result.current.setStage('complete');
      });

      expect(result.current.stage).toBe('complete');
    });
  });

  describe('reset functionality', () => {
    it('should reset all state to defaults', () => {
      const { result } = renderHook(() => useImportStore());

      // Modify all state
      act(() => {
        result.current.setStage('complete');
        result.current.setCurrentData(mockParsedData);
        result.current.setCurrentMapping(mockMapping);
        result.current.setDryRunData(mockDryRunData);
        result.current.setTargetBranch('feature-x');
        result.current.setIdStrategy('column');
        result.current.setImportMode('update-only');
        result.current.setSelectedProfile('jira');
      });

      // Verify changes
      expect(result.current.stage).toBe('complete');
      expect(result.current.currentData).toEqual(mockParsedData);
      expect(result.current.targetBranch).toBe('feature-x');

      // Reset
      act(() => {
        result.current.reset();
      });

      // Verify reset to defaults
      expect(result.current.stage).toBe('idle');
      expect(result.current.currentData).toBe(null);
      expect(result.current.currentMapping).toBe(null);
      expect(result.current.dryRunData).toBe(null);
      expect(result.current.targetBranch).toBe('main');
      expect(result.current.idStrategy).toBe('generate');
      expect(result.current.importMode).toBe('upsert');
      expect(result.current.selectedProfile).toBe(null);
    });
  });
});
