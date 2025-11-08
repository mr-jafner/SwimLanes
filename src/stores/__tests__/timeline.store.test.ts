/**
 * Tests for timeline.store.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimelineStore } from '../timeline.store';
import type { Item } from '@/types/database.types';

const mockItems: Item[] = [
  {
    id: '1',
    branch_id: 'main',
    type: 'task',
    title: 'Task 1',
    start_date: '2025-01-01',
    end_date: '2025-01-15',
    owner: 'Alice',
    lane: 'Frontend',
    project: 'Project A',
    tags: null,
    source_id: null,
    source_row_hash: null,
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    branch_id: 'main',
    type: 'milestone',
    title: 'Milestone 1',
    start_date: '2025-02-01',
    end_date: null,
    owner: 'Bob',
    lane: 'Backend',
    project: 'Project B',
    tags: null,
    source_id: null,
    source_row_hash: null,
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '3',
    branch_id: 'main',
    type: 'release',
    title: 'Release 1.0',
    start_date: '2025-03-01',
    end_date: '2025-03-05',
    owner: 'Alice',
    lane: 'Frontend',
    project: 'Project A',
    tags: null,
    source_id: null,
    source_row_hash: null,
    updated_at: '2025-01-01T00:00:00Z',
  },
];

describe('timeline.store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const { result } = renderHook(() => useTimelineStore());
    act(() => {
      result.current.setCurrentBranch('main');
      result.current.setZoomLevel('month');
      result.current.setLaneGroupBy('lane');
      result.current.resetPan();
      result.current.setIsDragging(false);
      result.current.setDragStart({ x: 0, y: 0 });
      result.current.setFilterType('');
      result.current.setFilterProject('');
    });
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useTimelineStore());

      expect(result.current.currentBranch).toBe('main');
      expect(result.current.zoomLevel).toBe('month');
      expect(result.current.laneGroupBy).toBe('lane');
      expect(result.current.panOffset).toEqual({ x: 0, y: 0 });
      expect(result.current.isDragging).toBe(false);
      expect(result.current.dragStart).toEqual({ x: 0, y: 0 });
      expect(result.current.filterType).toBe('');
      expect(result.current.filterProject).toBe('');
      expect(result.current.dateRange).toEqual({
        minDate: null,
        maxDate: null,
        timeRange: 0,
      });
      expect(result.current.laneNames).toEqual([]);
      expect(result.current.laneHeight).toBe(40);
    });
  });

  describe('branch selection', () => {
    it('should update current branch', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.setCurrentBranch('feature-x');
      });

      expect(result.current.currentBranch).toBe('feature-x');
    });
  });

  describe('view settings', () => {
    it('should update zoom level to day', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.setZoomLevel('day');
      });

      expect(result.current.zoomLevel).toBe('day');
    });

    it('should update zoom level to year', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.setZoomLevel('year');
      });

      expect(result.current.zoomLevel).toBe('year');
    });

    it('should update lane grouping to project', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.setLaneGroupBy('project');
      });

      expect(result.current.laneGroupBy).toBe('project');
    });

    it('should update lane grouping to owner', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.setLaneGroupBy('owner');
      });

      expect(result.current.laneGroupBy).toBe('owner');
    });
  });

  describe('pan and drag state', () => {
    it('should update pan offset', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.setPanOffset({ x: 100, y: 50 });
      });

      expect(result.current.panOffset).toEqual({ x: 100, y: 50 });
    });

    it('should reset pan offset', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.setPanOffset({ x: 100, y: 50 });
      });

      expect(result.current.panOffset).toEqual({ x: 100, y: 50 });

      act(() => {
        result.current.resetPan();
      });

      expect(result.current.panOffset).toEqual({ x: 0, y: 0 });
    });

    it('should set dragging state', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.setIsDragging(true);
      });

      expect(result.current.isDragging).toBe(true);
    });

    it('should set drag start position', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.setDragStart({ x: 200, y: 100 });
      });

      expect(result.current.dragStart).toEqual({ x: 200, y: 100 });
    });
  });

  describe('filters', () => {
    it('should update filter type', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.setFilterType('task');
      });

      expect(result.current.filterType).toBe('task');
    });

    it('should clear filter type', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.setFilterType('task');
      });

      expect(result.current.filterType).toBe('task');

      act(() => {
        result.current.setFilterType('');
      });

      expect(result.current.filterType).toBe('');
    });

    it('should update filter project', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.setFilterProject('Project A');
      });

      expect(result.current.filterProject).toBe('Project A');
    });
  });

  describe('calculated state updates', () => {
    it('should calculate date range from items', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.updateCalculatedState(mockItems);
      });

      expect(result.current.dateRange.minDate).toBe('2025-01-01');
      expect(result.current.dateRange.maxDate).toBe('2025-03-05');
      expect(result.current.dateRange.timeRange).toBeGreaterThan(0);
    });

    it('should calculate lane names grouped by lane', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.setLaneGroupBy('lane');
        result.current.updateCalculatedState(mockItems);
      });

      expect(result.current.laneNames).toEqual(['Backend', 'Frontend']);
    });

    it('should calculate lane names grouped by project', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.setLaneGroupBy('project');
        result.current.updateCalculatedState(mockItems);
      });

      expect(result.current.laneNames).toEqual(['Project A', 'Project B']);
    });

    it('should calculate lane names grouped by owner', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.setLaneGroupBy('owner');
        result.current.updateCalculatedState(mockItems);
      });

      expect(result.current.laneNames).toEqual(['Alice', 'Bob']);
    });

    it('should calculate lane names grouped by type', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.setLaneGroupBy('type');
        result.current.updateCalculatedState(mockItems);
      });

      expect(result.current.laneNames).toEqual(['milestone', 'release', 'task']);
    });

    it('should handle empty items array', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.updateCalculatedState([]);
      });

      expect(result.current.dateRange).toEqual({
        minDate: null,
        maxDate: null,
        timeRange: 0,
      });
      expect(result.current.laneNames).toEqual([]);
    });

    it('should handle items with null dates', () => {
      const itemsWithNullDates: Item[] = [
        {
          id: '1',
          branch_id: 'main',
          type: 'task',
          title: 'Task with null dates',
          start_date: null,
          end_date: null,
          owner: 'Alice',
          lane: 'Frontend',
          project: 'Project A',
          tags: null,
          source_id: null,
          source_row_hash: null,
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.updateCalculatedState(itemsWithNullDates);
      });

      expect(result.current.dateRange).toEqual({
        minDate: null,
        maxDate: null,
        timeRange: 0,
      });
    });
  });
});
