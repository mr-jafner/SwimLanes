/**
 * Timeline Rendering Service
 *
 * Pure calculation service for timeline visualization. Provides functions to:
 * - Group items into swim lanes
 * - Calculate date ranges and item positions
 * - Generate time axis ticks
 * - Determine item shapes and lane heights
 *
 * All functions are pure (no side effects) for easy testing and memoization.
 */

import type { Item } from '../types/database.types';
import type {
  ZoomLevel,
  LaneGroupBy,
  DateRange,
  TimeAxisTick,
  ItemRenderData,
  LaneGroup,
  TimelineConfig,
  ItemShape,
  LaneData,
  ItemColors,
} from '../types/timeline.types';

/**
 * Default item colors by type.
 *
 * Matches the legacy prototype color scheme:
 * - task: Blue (#2196F3)
 * - milestone: Green (#4CAF50)
 * - release: Orange (#FF9800)
 * - meeting: Purple (#9C27B0)
 */
export const DEFAULT_ITEM_COLORS: ItemColors = {
  task: '#2196F3',
  milestone: '#4CAF50',
  release: '#FF9800',
  meeting: '#9C27B0',
};

/**
 * Milliseconds per time unit for each zoom level.
 *
 * Used for calculating tick intervals and pixel-to-time conversions.
 */
export const ZOOM_INTERVALS: Record<ZoomLevel, number> = {
  day: 86400000, // 24 * 60 * 60 * 1000
  week: 604800000, // 7 * 24 * 60 * 60 * 1000
  month: 2592000000, // 30 * 24 * 60 * 60 * 1000 (approximate)
  quarter: 7776000000, // 90 * 24 * 60 * 60 * 1000 (approximate)
  year: 31536000000, // 365 * 24 * 60 * 60 * 1000 (approximate)
};

/**
 * Groups items into swim lanes based on the specified grouping strategy.
 *
 * @param items - Array of items to group
 * @param groupBy - Grouping strategy (lane, project, owner, or type)
 * @returns Object mapping lane names to arrays of items
 *
 * @example
 * ```typescript
 * const items = [
 *   { id: '1', project: 'Auth', ... },
 *   { id: '2', project: 'UI', ... },
 *   { id: '3', project: 'Auth', ... },
 * ];
 * const grouped = groupItemsByLane(items, 'project');
 * // Result: { 'Auth': [item1, item3], 'UI': [item2] }
 * ```
 */
export function groupItemsByLane(items: Item[], groupBy: LaneGroupBy): LaneData {
  const grouped: LaneData = {};

  for (const item of items) {
    // Determine the lane name based on grouping strategy
    let laneName: string;

    switch (groupBy) {
      case 'lane':
        laneName = item.lane || '(No Lane)';
        break;
      case 'project':
        laneName = item.project || '(No Project)';
        break;
      case 'owner':
        laneName = item.owner || '(Unassigned)';
        break;
      case 'type':
        laneName = item.type;
        break;
      default:
        laneName = '(Unknown)';
    }

    // Initialize array if this lane doesn't exist yet
    if (!grouped[laneName]) {
      grouped[laneName] = [];
    }

    grouped[laneName]!.push(item);
  }

  return grouped;
}

/**
 * Calculates the overall date range from an array of items.
 *
 * Finds the earliest start_date and latest end_date (or start_date for milestones).
 *
 * @param items - Array of items to analyze
 * @returns DateRange object with minDate, maxDate, and timeRange in milliseconds
 *
 * @example
 * ```typescript
 * const items = [
 *   { start_date: '2025-01-15', end_date: '2025-02-01', ... },
 *   { start_date: '2025-01-01', end_date: '2025-01-20', ... },
 * ];
 * const range = calculateDateRange(items);
 * // Result: { minDate: '2025-01-01', maxDate: '2025-02-01', timeRange: ... }
 * ```
 */
export function calculateDateRange(items: Item[]): DateRange {
  if (items.length === 0) {
    return { minDate: null, maxDate: null, timeRange: 0 };
  }

  let minDate: string | null = null;
  let maxDate: string | null = null;

  for (const item of items) {
    // Use start_date for min calculation
    if (item.start_date) {
      if (!minDate || item.start_date < minDate) {
        minDate = item.start_date;
      }
    }

    // Use end_date if available, otherwise start_date (for milestones)
    const itemEndDate = item.end_date || item.start_date;
    if (itemEndDate) {
      if (!maxDate || itemEndDate > maxDate) {
        maxDate = itemEndDate;
      }
    }
  }

  // Calculate time range in milliseconds
  const timeRange =
    minDate && maxDate ? new Date(maxDate).getTime() - new Date(minDate).getTime() : 0;

  return { minDate, maxDate, timeRange };
}

/**
 * Calculates the position and dimensions for rendering an item on the timeline.
 *
 * @param item - Item to position
 * @param dateRange - Overall date range of the timeline
 * @param laneIndex - Vertical position (which swim lane)
 * @param config - Timeline rendering configuration
 * @returns ItemRenderData with x, y, width, height, and color
 *
 * @example
 * ```typescript
 * const position = calculateItemPosition(
 *   item,
 *   { minDate: '2025-01-01', maxDate: '2025-12-31', timeRange: 31536000000 },
 *   0,
 *   { canvasWidth: 1200, laneHeight: 40, margin: {...}, ... }
 * );
 * // Result: { item, x: 150, y: 40, width: 200, height: 32, color: '#2196F3', laneIndex: 0 }
 * ```
 */
export function calculateItemPosition(
  item: Item,
  dateRange: DateRange,
  laneIndex: number,
  config: TimelineConfig
): ItemRenderData | null {
  // Return null if item has no dates
  if (!item.start_date || !dateRange.minDate || !dateRange.maxDate) {
    return null;
  }

  const chartWidth = config.canvasWidth - config.margin.left - config.margin.right;
  const itemStartMs = new Date(item.start_date).getTime();
  const rangeStartMs = new Date(dateRange.minDate).getTime();

  // Calculate X position based on start date
  const x = config.margin.left + ((itemStartMs - rangeStartMs) / dateRange.timeRange) * chartWidth;

  // Calculate width based on duration (for tasks/releases/meetings)
  let width: number;
  if (item.end_date && item.type !== 'milestone') {
    const itemEndMs = new Date(item.end_date).getTime();
    const durationRatio = (itemEndMs - itemStartMs) / dateRange.timeRange;
    width = Math.max(durationRatio * chartWidth, 8); // Minimum 8px width
  } else {
    // Milestones render as diamonds (width will be used for diamond size)
    width = 16;
  }

  // Calculate Y position based on lane index
  const y =
    config.margin.top + laneIndex * config.laneHeight + (config.laneHeight - config.itemHeight) / 2;

  // Get color based on item type
  const color = DEFAULT_ITEM_COLORS[item.type];

  return {
    item,
    x,
    y,
    width,
    height: config.itemHeight,
    color,
    laneIndex,
  };
}

/**
 * Generates time axis tick marks for the timeline.
 *
 * Creates evenly-spaced ticks based on the zoom level and date range.
 *
 * @param dateRange - Overall date range of the timeline
 * @param zoomLevel - Current zoom level
 * @param config - Timeline rendering configuration
 * @returns Array of TimeAxisTick objects
 *
 * @example
 * ```typescript
 * const ticks = calculateTimeAxisTicks(
 *   { minDate: '2025-01-01', maxDate: '2025-03-31', timeRange: ... },
 *   'month',
 *   config
 * );
 * // Result: [
 * //   { date: '2025-01-01', x: 150, label: 'Jan 2025', isMajor: true },
 * //   { date: '2025-02-01', x: 350, label: 'Feb 2025', isMajor: false },
 * //   { date: '2025-03-01', x: 550, label: 'Mar 2025', isMajor: false },
 * // ]
 * ```
 */
export function calculateTimeAxisTicks(
  dateRange: DateRange,
  zoomLevel: ZoomLevel,
  config: TimelineConfig
): TimeAxisTick[] {
  if (!dateRange.minDate || !dateRange.maxDate || dateRange.timeRange === 0) {
    return [];
  }

  const ticks: TimeAxisTick[] = [];
  const chartWidth = config.canvasWidth - config.margin.left - config.margin.right;
  const rangeStartMs = new Date(dateRange.minDate).getTime();
  const tickInterval = ZOOM_INTERVALS[zoomLevel];

  // Start from the first tick aligned to the zoom interval
  let currentMs = Math.floor(rangeStartMs / tickInterval) * tickInterval;
  const rangeEndMs = new Date(dateRange.maxDate).getTime();

  while (currentMs <= rangeEndMs + tickInterval) {
    const currentDate = new Date(currentMs);
    const x = config.margin.left + ((currentMs - rangeStartMs) / dateRange.timeRange) * chartWidth;

    // Format label based on zoom level
    const label = formatTickLabel(currentDate, zoomLevel);

    // Determine if this is a major tick (e.g., year boundary)
    const isMajor = isMajorTick(currentDate, zoomLevel);

    const isoDate = currentDate.toISOString().split('T')[0];
    if (isoDate) {
      ticks.push({
        date: isoDate,
        x,
        label,
        isMajor,
      });
    }

    currentMs += tickInterval;
  }

  return ticks;
}

/**
 * Formats a tick label based on the zoom level.
 *
 * @param date - Date to format
 * @param zoomLevel - Current zoom level
 * @returns Formatted label string
 */
function formatTickLabel(date: Date, zoomLevel: ZoomLevel): string {
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  switch (zoomLevel) {
    case 'day':
      return `${monthNames[date.getMonth()]} ${date.getDate()}`;
    case 'week':
      return `${monthNames[date.getMonth()]} ${date.getDate()}`;
    case 'month':
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    case 'quarter':
      return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
    case 'year':
      return `${date.getFullYear()}`;
    default:
      return date.toISOString().split('T')[0] ?? '';
  }
}

/**
 * Determines if a tick is a major tick (e.g., year or quarter boundary).
 *
 * @param date - Date to check
 * @param zoomLevel - Current zoom level
 * @returns True if this is a major tick
 */
function isMajorTick(date: Date, zoomLevel: ZoomLevel): boolean {
  switch (zoomLevel) {
    case 'day':
    case 'week':
      // Major ticks are month boundaries
      return date.getDate() === 1;
    case 'month':
      // Major ticks are year boundaries
      return date.getMonth() === 0;
    case 'quarter':
      // Major ticks are year boundaries
      return date.getMonth() === 0;
    case 'year':
      // All year ticks are major
      return true;
    default:
      return false;
  }
}

/**
 * Determines the shape to use when rendering an item.
 *
 * @param item - Item to render
 * @returns 'bar' for tasks/releases/meetings, 'diamond' for milestones
 *
 * @example
 * ```typescript
 * const shape1 = getItemShape({ type: 'task', ... }); // 'bar'
 * const shape2 = getItemShape({ type: 'milestone', ... }); // 'diamond'
 * ```
 */
export function getItemShape(item: Item): ItemShape {
  return item.type === 'milestone' ? 'diamond' : 'bar';
}

/**
 * Calculates the required height for a lane based on overlapping items.
 *
 * If items overlap in time, they need to stack vertically, requiring more space.
 *
 * @param laneItems - Items in this lane
 * @param config - Timeline rendering configuration
 * @returns Height in pixels
 *
 * @example
 * ```typescript
 * const height = calculateLaneHeight(
 *   [item1, item2, item3],
 *   { laneHeight: 40, itemHeight: 32, itemPadding: 4, ... }
 * );
 * // Returns: 40 (no overlaps) or higher (if overlaps detected)
 * ```
 */
export function calculateLaneHeight(laneItems: Item[], config: TimelineConfig): number {
  if (laneItems.length === 0) {
    return config.laneHeight;
  }

  // Sort items by start date
  const sortedItems = [...laneItems].sort((a, b) => {
    const dateA = a.start_date || '';
    const dateB = b.start_date || '';
    return dateA.localeCompare(dateB);
  });

  // Track rows of items (each row contains non-overlapping items)
  const rows: Item[][] = [];

  for (const item of sortedItems) {
    if (!item.start_date) continue;

    // Try to fit the item in an existing row
    let placed = false;
    for (const row of rows) {
      // Check if this item overlaps with any item in this row
      const overlaps = row.some((rowItem) => itemsOverlap(item, rowItem));
      if (!overlaps) {
        row.push(item);
        placed = true;
        break;
      }
    }

    // If it didn't fit in any row, create a new row
    if (!placed) {
      rows.push([item]);
    }
  }

  // Calculate height based on number of rows
  const numRows = rows.length;
  const requiredHeight = numRows * (config.itemHeight + config.itemPadding);

  // Return at least the default lane height
  return Math.max(requiredHeight, config.laneHeight);
}

/**
 * Checks if two items overlap in time.
 *
 * @param item1 - First item
 * @param item2 - Second item
 * @returns True if the items overlap
 */
function itemsOverlap(item1: Item, item2: Item): boolean {
  if (!item1.start_date || !item2.start_date) {
    return false;
  }

  const start1 = new Date(item1.start_date).getTime();
  const end1 = item1.end_date ? new Date(item1.end_date).getTime() : start1;

  const start2 = new Date(item2.start_date).getTime();
  const end2 = item2.end_date ? new Date(item2.end_date).getTime() : start2;

  // Items overlap if one starts before the other ends
  return start1 <= end2 && start2 <= end1;
}

/**
 * Assigns row indices to items based on overlap detection.
 * Items that overlap in time get different row indices.
 *
 * @param items - Items to assign rows to
 * @returns Map of item IDs to row indices (0-based)
 *
 * @example
 * ```typescript
 * const items = [item1, item2, item3];
 * const rowMap = assignItemRows(items);
 * // rowMap.get(item1.id) = 0
 * // rowMap.get(item2.id) = 1 (if overlaps with item1)
 * // rowMap.get(item3.id) = 0 (if doesn't overlap with item1)
 * ```
 */
export function assignItemRows(items: Item[]): Map<string, number> {
  const rowMap = new Map<string, number>();

  // Sort items by start date
  const sortedItems = [...items].sort((a, b) => {
    const dateA = a.start_date || '';
    const dateB = b.start_date || '';
    return dateA.localeCompare(dateB);
  });

  // Track rows of items (each row contains non-overlapping items)
  const rows: Item[][] = [];

  for (const item of sortedItems) {
    if (!item.start_date) continue;

    // Try to fit the item in an existing row
    let placed = false;
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      if (!row) continue;

      // Check if this item overlaps with any item in this row
      const overlaps = row.some((rowItem) => itemsOverlap(item, rowItem));
      if (!overlaps) {
        row.push(item);
        rowMap.set(item.id, rowIndex);
        placed = true;
        break;
      }
    }

    // If it didn't fit in any row, create a new row
    if (!placed) {
      rows.push([item]);
      rowMap.set(item.id, rows.length - 1);
    }
  }

  return rowMap;
}

/**
 * Creates LaneGroup objects from grouped lane data.
 *
 * @param laneData - Grouped items by lane name
 * @param config - Timeline rendering configuration
 * @returns Array of LaneGroup objects with calculated heights
 *
 * @example
 * ```typescript
 * const laneGroups = createLaneGroups(
 *   { 'Frontend': [item1, item2], 'Backend': [item3] },
 *   config
 * );
 * // Result: [
 * //   { laneName: 'Frontend', items: [...], index: 0, height: 40 },
 * //   { laneName: 'Backend', items: [...], index: 1, height: 40 }
 * // ]
 * ```
 */
export function createLaneGroups(laneData: LaneData, config: TimelineConfig): LaneGroup[] {
  const laneNames = Object.keys(laneData).sort();

  return laneNames.map((laneName, index) => {
    const items = laneData[laneName] ?? [];
    return {
      laneName,
      items,
      index,
      height: calculateLaneHeight(items, config),
    };
  });
}
