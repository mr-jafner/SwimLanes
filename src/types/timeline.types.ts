/**
 * Timeline visualization type definitions for SwimLanes
 *
 * These types support the canvas-based timeline rendering (react-konva),
 * including zoom levels, pan/drag state, lane grouping, and filters.
 */

import type { Item, ItemType } from './database.types';

/**
 * Zoom levels for timeline view.
 *
 * Each level changes the time axis tick interval and visible date range:
 * - day: 1 day per tick (86400000 ms)
 * - week: 7 days per tick (604800000 ms)
 * - month: ~30 days per tick (2592000000 ms)
 * - quarter: ~90 days per tick (7776000000 ms)
 * - year: ~365 days per tick (31536000000 ms)
 */
export type ZoomLevel = 'day' | 'week' | 'month' | 'quarter' | 'year';

/**
 * Lane grouping strategies.
 *
 * Determines how items are organized into horizontal swim lanes:
 * - lane: Group by item.lane field
 * - project: Group by item.project field
 * - owner: Group by item.owner field
 * - type: Group by item.type field (task/milestone/release/meeting)
 */
export type LaneGroupBy = 'lane' | 'project' | 'owner' | 'type';

/**
 * Pan/drag offset in pixels.
 *
 * Tracks horizontal and vertical pan state of the timeline canvas.
 */
export interface PanOffset {
  /** Horizontal offset in pixels (positive = panned right) */
  x: number;

  /** Vertical offset in pixels (positive = panned down) */
  y: number;
}

/**
 * Canvas margin configuration.
 *
 * Defines spacing around the timeline chart area for axes and labels.
 */
export interface TimelineMargin {
  /** Top margin in pixels (for time axis) */
  top: number;

  /** Right margin in pixels */
  right: number;

  /** Bottom margin in pixels */
  bottom: number;

  /** Left margin in pixels (for lane labels) */
  left: number;
}

/**
 * Date range for timeline view.
 *
 * Calculated from the min/max dates of visible items.
 */
export interface DateRange {
  /** Earliest date in visible items (ISO format) */
  minDate: string | null;

  /** Latest date in visible items (ISO format) */
  maxDate: string | null;

  /** Time range in milliseconds (maxDate - minDate) */
  timeRange: number;
}

/**
 * Complete timeline view state.
 *
 * Tracks all rendering and interaction state for the timeline canvas.
 *
 * @example
 * ```typescript
 * const viewState: TimelineViewState = {
 *   currentBranch: 'main',
 *   zoomLevel: 'month',
 *   laneGroupBy: 'project',
 *   filterType: '',
 *   filterProject: '',
 *   panOffset: { x: 0, y: 0 },
 *   isDragging: false,
 *   dragStart: { x: 0, y: 0 },
 *   margin: { top: 40, right: 20, bottom: 20, left: 150 },
 *   chartWidth: 1200,
 *   chartHeight: 600,
 *   dateRange: {
 *     minDate: '2025-01-01',
 *     maxDate: '2025-12-31',
 *     timeRange: 31536000000
 *   },
 *   laneHeight: 40,
 *   laneNames: ['Frontend', 'Backend', 'Design']
 * };
 * ```
 */
export interface TimelineViewState {
  /** Current branch being viewed */
  currentBranch: string;

  /** Current zoom level */
  zoomLevel: ZoomLevel;

  /** How to group items into lanes */
  laneGroupBy: LaneGroupBy;

  /** Filter by item type ('' = show all) */
  filterType: string;

  /** Filter by project ('' = show all, supports partial match) */
  filterProject: string;

  /** Current pan offset from origin */
  panOffset: PanOffset;

  /** Whether user is currently dragging */
  isDragging: boolean;

  /** Drag start position (for calculating delta) */
  dragStart: PanOffset;

  /** Canvas margins for axes and labels */
  margin: TimelineMargin;

  /** Chart width in pixels (excluding margins) */
  chartWidth: number;

  /** Chart height in pixels (excluding margins) */
  chartHeight: number;

  /** Date range of visible items */
  dateRange: DateRange;

  /** Height of each lane in pixels */
  laneHeight: number;

  /** Sorted list of lane names based on grouping */
  laneNames: string[];
}

/**
 * Color mapping for item types.
 *
 * Maps each ItemType to its visual color (hex format).
 *
 * @example
 * ```typescript
 * const colors: ItemColors = {
 *   task: '#2196F3',      // Blue
 *   milestone: '#4CAF50', // Green
 *   release: '#FF9800',   // Orange
 *   meeting: '#9C27B0'    // Purple
 * };
 * ```
 */
export type ItemColors = Record<ItemType, string>;

/**
 * Tick interval mapping for zoom levels.
 *
 * Maps each ZoomLevel to its time interval in milliseconds.
 */
export type TickIntervals = Record<ZoomLevel, number>;

/**
 * Grouped items by lane.
 *
 * Maps lane names to arrays of items in that lane.
 *
 * @example
 * ```typescript
 * const laneData: LaneData = {
 *   'Frontend': [item1, item2, item3],
 *   'Backend': [item4, item5],
 *   'Design': [item6]
 * };
 * ```
 */
export type LaneData = Record<string, Item[]>;

/**
 * Timeline item position and dimensions.
 *
 * Calculated pixel coordinates for rendering an item on the canvas.
 */
export interface ItemRenderData {
  /** Item being rendered */
  item: Item;

  /** X position in pixels (left edge) */
  x: number;

  /** Y position in pixels (top edge) */
  y: number;

  /** Width in pixels (for tasks/releases/meetings) */
  width: number;

  /** Height in pixels */
  height: number;

  /** Fill color (based on item type) */
  color: string;

  /** Lane index (for vertical positioning) */
  laneIndex: number;
}

/**
 * Time axis tick mark.
 *
 * Represents a single tick on the time axis.
 */
export interface TimeAxisTick {
  /** Date for this tick (ISO format) */
  date: string;

  /** X position in pixels */
  x: number;

  /** Label text (formatted date) */
  label: string;

  /** Whether this is a major tick (e.g., year boundary) */
  isMajor?: boolean;
}

/**
 * Timeline filter configuration.
 *
 * Defines active filters for the timeline view.
 */
export interface TimelineFilters {
  /** Filter by item types (empty = show all) */
  types: ItemType[];

  /** Filter by projects (empty = show all) */
  projects: string[];

  /** Filter by owners (empty = show all) */
  owners: string[];

  /** Filter by date range */
  dateRange?: {
    start: string;
    end: string;
  };

  /** Search text (matches title, tags, etc.) */
  searchText?: string;
}

/**
 * Timeline interaction event.
 *
 * Represents user interactions with timeline items (click, hover, etc.).
 */
export interface TimelineInteraction {
  /** Type of interaction */
  type: 'click' | 'hover' | 'context-menu';

  /** Item that was interacted with */
  item: Item;

  /** Mouse position in canvas coordinates */
  position: {
    x: number;
    y: number;
  };

  /** Native event (for preventDefault, etc.) */
  nativeEvent?: MouseEvent;
}
