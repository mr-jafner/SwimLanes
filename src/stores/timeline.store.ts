/**
 * Timeline view state management store
 *
 * Manages timeline visualization state including:
 * - Zoom level and lane grouping
 * - Pan/drag state
 * - Filters
 * - Calculated state (date range, lane names)
 */

import { create } from 'zustand';
import type { ZoomLevel, LaneGroupBy, PanOffset } from '@/types/timeline.types';
import type { Item } from '@/types/database.types';

/**
 * Timeline state interface
 */
interface TimelineState {
  // Current branch being viewed
  currentBranch: string;

  // View settings
  zoomLevel: ZoomLevel;
  laneGroupBy: LaneGroupBy;

  // Pan/drag state
  panOffset: PanOffset;
  isDragging: boolean;
  dragStart: PanOffset | null;

  // Filters
  filterType: string; // '' = show all
  filterProject: string; // '' = show all, supports partial match

  // Calculated state (derived from items)
  dateRange: { minDate: string | null; maxDate: string | null; timeRange: number };
  laneNames: string[];
  laneHeight: number;

  // Actions
  setCurrentBranch: (branchId: string) => void;
  setZoomLevel: (level: ZoomLevel) => void;
  setLaneGroupBy: (groupBy: LaneGroupBy) => void;
  setPanOffset: (offset: PanOffset) => void;
  setIsDragging: (dragging: boolean) => void;
  setDragStart: (position: PanOffset | null) => void;
  setFilterType: (type: string) => void;
  setFilterProject: (project: string) => void;
  resetPan: () => void;
  updateCalculatedState: (items: Item[]) => void;
}

/**
 * Timeline store
 *
 * Usage:
 * ```typescript
 * const { zoomLevel, setZoomLevel, panOffset, setPanOffset } = useTimelineStore();
 *
 * // Change zoom level
 * setZoomLevel('week');
 *
 * // Pan the timeline
 * setPanOffset({ x: 100, y: 50 });
 *
 * // Update calculated state from items
 * updateCalculatedState(items);
 * ```
 */
export const useTimelineStore = create<TimelineState>()((set, get) => ({
  // Initial state
  currentBranch: 'main',
  zoomLevel: 'month',
  laneGroupBy: 'lane',
  panOffset: { x: 0, y: 0 },
  isDragging: false,
  dragStart: null,
  filterType: '',
  filterProject: '',
  dateRange: { minDate: null, maxDate: null, timeRange: 0 },
  laneNames: [],
  laneHeight: 40,

  // Actions
  setCurrentBranch: (branchId) => set({ currentBranch: branchId }),
  setZoomLevel: (level) => set({ zoomLevel: level }),
  setLaneGroupBy: (groupBy) => set({ laneGroupBy: groupBy }),
  setPanOffset: (offset) => set({ panOffset: offset }),
  setIsDragging: (dragging) => set({ isDragging: dragging }),
  setDragStart: (position) => set({ dragStart: position }),
  setFilterType: (type) => set({ filterType: type }),
  setFilterProject: (project) => set({ filterProject: project }),
  resetPan: () => set({ panOffset: { x: 0, y: 0 } }),

  /**
   * Update calculated state based on current items.
   *
   * Calculates:
   * - Date range (min/max dates from all items)
   * - Lane names (unique values based on grouping strategy)
   *
   * @param items - Array of items to analyze
   */
  updateCalculatedState: (items: Item[]) => {
    const state = get();

    // Calculate date range
    let minDate: string | null = null;
    let maxDate: string | null = null;

    items.forEach((item) => {
      if (item.start_date) {
        if (!minDate || item.start_date < minDate) {
          minDate = item.start_date;
        }
        if (!maxDate || item.start_date > maxDate) {
          maxDate = item.start_date;
        }
      }

      if (item.end_date) {
        if (!maxDate || item.end_date > maxDate) {
          maxDate = item.end_date;
        }
      }
    });

    const timeRange =
      minDate && maxDate ? new Date(maxDate).getTime() - new Date(minDate).getTime() : 0;

    // Calculate lane names based on grouping strategy
    const laneSet = new Set<string>();

    items.forEach((item) => {
      let laneValue: string | null = null;

      switch (state.laneGroupBy) {
        case 'lane':
          laneValue = item.lane;
          break;
        case 'project':
          laneValue = item.project;
          break;
        case 'owner':
          laneValue = item.owner;
          break;
        case 'type':
          laneValue = item.type;
          break;
      }

      if (laneValue) {
        laneSet.add(laneValue);
      }
    });

    const laneNames = Array.from(laneSet).sort();

    set({
      dateRange: { minDate, maxDate, timeRange },
      laneNames,
    });
  },
}));
