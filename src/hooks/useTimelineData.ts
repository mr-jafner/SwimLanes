/**
 * useTimelineData Hook
 *
 * Fetches timeline items from the database and calculates timeline layout.
 * Phase 2: Now includes timeline service calculations for rendering.
 */

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/stores';
import { useTimelineStore } from '@/stores/timeline.store';
import { useBranchStore } from '@/stores/branch.store';
import { databaseService } from '@/services/database.service';
import { getItems } from '@/db/queries/items.queries';
import {
  groupItemsByLane,
  calculateDateRange,
  createLaneGroups,
  calculateTimeAxisTicks,
  calculateChartWidth,
} from '@/services/timeline.service';
import type { Item } from '@/types/database.types';
import type { DateRange, LaneGroup, TimelineConfig, TimeAxisTick } from '@/types/timeline.types';

interface UseTimelineDataResult {
  /** Items from the database */
  items: Item[];

  /** Calculated date range */
  dateRange: DateRange;

  /** Lane groups with items */
  laneGroups: LaneGroup[];

  /** Time axis ticks */
  timeAxisTicks: TimeAxisTick[];

  /** Timeline configuration */
  config: TimelineConfig;

  /** Loading state */
  loading: boolean;

  /** Error message if fetch failed */
  error: string | null;
}

/**
 * Fetches timeline items and calculates layout data.
 *
 * @returns Object with items, calculated groups, config, loading state, and error
 *
 * @example
 * ```typescript
 * const { items, laneGroups, dateRange, config, loading } = useTimelineData();
 *
 * if (loading) return <div>Loading...</div>;
 * return <TimelineCanvas data={{ items, laneGroups, dateRange, config }} />;
 * ```
 */
export function useTimelineData(): UseTimelineDataResult {
  const isInitialized = useAppStore((state) => state.isInitialized);
  const zoomLevel = useTimelineStore((state) => state.zoomLevel);
  const laneGroupBy = useTimelineStore((state) => state.laneGroupBy);
  const filterType = useTimelineStore((state) => state.filterType);
  const filterProject = useTimelineStore((state) => state.filterProject);
  const viewBranch = useBranchStore((state) => state.viewBranch);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch items from database
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Wait for database to be fully initialized
    if (!isInitialized) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const database = databaseService.getDatabase();
      const fetchedItems = getItems(database, viewBranch);
      setItems(fetchedItems);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch timeline items:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isInitialized, viewBranch]);

  // Calculate timeline layout (memoized to avoid recalculating on every render)
  const calculatedData = useMemo(() => {
    // Filter items by type and project
    const filteredItems = items.filter((item) => {
      // Filter by type (empty string means show all)
      if (filterType && item.type !== filterType) return false;

      // Filter by project (empty string means show all, partial match case-insensitive)
      if (filterProject && !item.project?.toLowerCase().includes(filterProject.toLowerCase()))
        return false;

      return true;
    });

    // Calculate date range from filtered items
    const dateRange = calculateDateRange(filteredItems);

    // Calculate chart width based on zoom level (dynamic based on time range and zoom)
    const chartWidth = calculateChartWidth(dateRange, zoomLevel);

    // Config for timeline rendering (canvasWidth now dynamic based on zoom)
    const config: TimelineConfig = {
      canvasWidth: chartWidth,
      canvasHeight: 600,
      margin: { top: 60, right: 20, bottom: 20, left: 150 },
      laneHeight: 50,
      itemPadding: 4,
      itemHeight: 36,
    };

    // Group items by selected grouping strategy (lane/project/owner/type)
    const laneData = groupItemsByLane(filteredItems, laneGroupBy);

    // Create lane groups with calculated heights
    const laneGroups = createLaneGroups(laneData, config);

    // Generate time axis ticks (using zoom level from timeline store)
    const timeAxisTicks = calculateTimeAxisTicks(dateRange, zoomLevel, config);

    return {
      dateRange,
      laneGroups,
      timeAxisTicks,
      config,
    };
  }, [items, zoomLevel, laneGroupBy, filterType, filterProject]);

  return {
    items,
    ...calculatedData,
    loading,
    error,
  };
}
