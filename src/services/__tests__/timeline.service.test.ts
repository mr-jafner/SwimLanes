/**
 * Tests for timeline.service.ts
 */

import { describe, it, expect } from 'vitest';
import {
  groupItemsByLane,
  calculateDateRange,
  calculateItemPosition,
  calculateTimeAxisTicks,
  getItemShape,
  calculateLaneHeight,
  createLaneGroups,
  DEFAULT_ITEM_COLORS,
  ZOOM_INTERVALS,
} from '../timeline.service';
import type { Item } from '../../types/database.types';
import type { TimelineConfig } from '../../types/timeline.types';

// Test fixtures
const mockConfig: TimelineConfig = {
  canvasWidth: 1200,
  canvasHeight: 600,
  margin: { top: 40, right: 20, bottom: 20, left: 150 },
  laneHeight: 40,
  itemPadding: 4,
  itemHeight: 32,
};

const createMockItem = (overrides: Partial<Item> = {}): Item => ({
  id: 'test-id',
  branch_id: 'main',
  type: 'task',
  title: 'Test Task',
  start_date: '2025-01-15',
  end_date: '2025-02-15',
  owner: 'Alice',
  lane: 'Development',
  project: 'Project A',
  tags: 'test',
  source_row_hash: 'hash123',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

describe('TimelineService', () => {
  describe('Constants', () => {
    it('should have correct item colors', () => {
      expect(DEFAULT_ITEM_COLORS.task).toBe('#2196F3');
      expect(DEFAULT_ITEM_COLORS.milestone).toBe('#4CAF50');
      expect(DEFAULT_ITEM_COLORS.release).toBe('#FF9800');
      expect(DEFAULT_ITEM_COLORS.meeting).toBe('#9C27B0');
    });

    it('should have correct zoom intervals', () => {
      expect(ZOOM_INTERVALS.day).toBe(86400000);
      expect(ZOOM_INTERVALS.week).toBe(604800000);
      expect(ZOOM_INTERVALS.month).toBe(2592000000);
      expect(ZOOM_INTERVALS.quarter).toBe(7776000000);
      expect(ZOOM_INTERVALS.year).toBe(31536000000);
    });
  });

  describe('groupItemsByLane', () => {
    it('should group items by lane field', () => {
      const items = [
        createMockItem({ id: '1', lane: 'Frontend' }),
        createMockItem({ id: '2', lane: 'Backend' }),
        createMockItem({ id: '3', lane: 'Frontend' }),
      ];

      const grouped = groupItemsByLane(items, 'lane');

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['Frontend']).toHaveLength(2);
      expect(grouped['Backend']).toHaveLength(1);
      expect(grouped['Frontend']?.[0]?.id).toBe('1');
      expect(grouped['Frontend']?.[1]?.id).toBe('3');
    });

    it('should group items by project field', () => {
      const items = [
        createMockItem({ id: '1', project: 'Auth' }),
        createMockItem({ id: '2', project: 'UI' }),
        createMockItem({ id: '3', project: 'Auth' }),
      ];

      const grouped = groupItemsByLane(items, 'project');

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['Auth']).toHaveLength(2);
      expect(grouped['UI']).toHaveLength(1);
    });

    it('should group items by owner field', () => {
      const items = [
        createMockItem({ id: '1', owner: 'Alice' }),
        createMockItem({ id: '2', owner: 'Bob' }),
        createMockItem({ id: '3', owner: 'Alice' }),
      ];

      const grouped = groupItemsByLane(items, 'owner');

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['Alice']).toHaveLength(2);
      expect(grouped['Bob']).toHaveLength(1);
    });

    it('should group items by type field', () => {
      const items = [
        createMockItem({ id: '1', type: 'task' }),
        createMockItem({ id: '2', type: 'milestone' }),
        createMockItem({ id: '3', type: 'task' }),
      ];

      const grouped = groupItemsByLane(items, 'type');

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['task']).toHaveLength(2);
      expect(grouped['milestone']).toHaveLength(1);
    });

    it('should handle items with null fields', () => {
      const items = [
        createMockItem({ id: '1', lane: null }),
        createMockItem({ id: '2', lane: 'Frontend' }),
        createMockItem({ id: '3', lane: null }),
      ];

      const grouped = groupItemsByLane(items, 'lane');

      expect(grouped['(No Lane)']).toHaveLength(2);
      expect(grouped['Frontend']).toHaveLength(1);
    });

    it('should handle items with null owner', () => {
      const items = [
        createMockItem({ id: '1', owner: null }),
        createMockItem({ id: '2', owner: 'Alice' }),
      ];

      const grouped = groupItemsByLane(items, 'owner');

      expect(grouped['(Unassigned)']).toHaveLength(1);
      expect(grouped['Alice']).toHaveLength(1);
    });

    it('should handle items with null project', () => {
      const items = [
        createMockItem({ id: '1', project: null }),
        createMockItem({ id: '2', project: 'Auth' }),
      ];

      const grouped = groupItemsByLane(items, 'project');

      expect(grouped['(No Project)']).toHaveLength(1);
      expect(grouped['Auth']).toHaveLength(1);
    });

    it('should handle empty array', () => {
      const grouped = groupItemsByLane([], 'lane');
      expect(Object.keys(grouped)).toHaveLength(0);
    });
  });

  describe('calculateDateRange', () => {
    it('should calculate date range from items', () => {
      const items = [
        createMockItem({ start_date: '2025-01-15', end_date: '2025-02-01' }),
        createMockItem({ start_date: '2025-01-01', end_date: '2025-01-20' }),
        createMockItem({ start_date: '2025-02-10', end_date: '2025-03-01' }),
      ];

      const range = calculateDateRange(items);

      expect(range.minDate).toBe('2025-01-01');
      expect(range.maxDate).toBe('2025-03-01');
      expect(range.timeRange).toBeGreaterThan(0);
    });

    it('should handle milestones (items with no end_date)', () => {
      const items = [
        createMockItem({ type: 'milestone', start_date: '2025-01-15', end_date: null }),
        createMockItem({ start_date: '2025-01-01', end_date: '2025-02-01' }),
      ];

      const range = calculateDateRange(items);

      expect(range.minDate).toBe('2025-01-01');
      expect(range.maxDate).toBe('2025-02-01');
    });

    it('should handle single item', () => {
      const items = [createMockItem({ start_date: '2025-01-15', end_date: '2025-02-15' })];

      const range = calculateDateRange(items);

      expect(range.minDate).toBe('2025-01-15');
      expect(range.maxDate).toBe('2025-02-15');
    });

    it('should handle empty array', () => {
      const range = calculateDateRange([]);

      expect(range.minDate).toBeNull();
      expect(range.maxDate).toBeNull();
      expect(range.timeRange).toBe(0);
    });

    it('should handle items with null dates', () => {
      const items = [
        createMockItem({ start_date: null, end_date: null }),
        createMockItem({ start_date: '2025-01-15', end_date: '2025-02-15' }),
      ];

      const range = calculateDateRange(items);

      expect(range.minDate).toBe('2025-01-15');
      expect(range.maxDate).toBe('2025-02-15');
    });

    it('should calculate correct time range in milliseconds', () => {
      const items = [createMockItem({ start_date: '2025-01-01', end_date: '2025-01-02' })];

      const range = calculateDateRange(items);

      expect(range.timeRange).toBe(86400000); // 1 day in ms
    });
  });

  describe('calculateItemPosition', () => {
    const dateRange = {
      minDate: '2025-01-01',
      maxDate: '2025-12-31',
      timeRange: 31536000000, // 1 year in ms
    };

    it('should calculate position for a task', () => {
      const item = createMockItem({
        type: 'task',
        start_date: '2025-01-15',
        end_date: '2025-02-15',
      });

      const position = calculateItemPosition(item, dateRange, 0, mockConfig);

      expect(position).not.toBeNull();
      expect(position?.x).toBeGreaterThan(mockConfig.margin.left);
      expect(position?.y).toBe(
        mockConfig.margin.top + (mockConfig.laneHeight - mockConfig.itemHeight) / 2
      );
      expect(position?.width).toBeGreaterThan(0);
      expect(position?.height).toBe(mockConfig.itemHeight);
      expect(position?.color).toBe(DEFAULT_ITEM_COLORS.task);
      expect(position?.laneIndex).toBe(0);
    });

    it('should calculate position for a milestone', () => {
      const item = createMockItem({
        type: 'milestone',
        start_date: '2025-06-15',
        end_date: null,
      });

      const position = calculateItemPosition(item, dateRange, 1, mockConfig);

      expect(position).not.toBeNull();
      expect(position?.width).toBe(16); // Milestones have fixed width
      expect(position?.color).toBe(DEFAULT_ITEM_COLORS.milestone);
      expect(position?.laneIndex).toBe(1);
    });

    it('should return null for item without start_date', () => {
      const item = createMockItem({ start_date: null });

      const position = calculateItemPosition(item, dateRange, 0, mockConfig);

      expect(position).toBeNull();
    });

    it('should return null if dateRange has no minDate', () => {
      const item = createMockItem({ start_date: '2025-01-15' });
      const invalidRange = { minDate: null, maxDate: '2025-12-31', timeRange: 0 };

      const position = calculateItemPosition(item, invalidRange, 0, mockConfig);

      expect(position).toBeNull();
    });

    it('should enforce minimum width of 8px', () => {
      const item = createMockItem({
        start_date: '2025-01-01',
        end_date: '2025-01-01', // Same day (0 duration)
      });

      const position = calculateItemPosition(item, dateRange, 0, mockConfig);

      expect(position?.width).toBeGreaterThanOrEqual(8);
    });

    it('should position items in different lanes vertically', () => {
      const item = createMockItem({ start_date: '2025-01-15' });

      const pos0 = calculateItemPosition(item, dateRange, 0, mockConfig);
      const pos1 = calculateItemPosition(item, dateRange, 1, mockConfig);
      const pos2 = calculateItemPosition(item, dateRange, 2, mockConfig);

      expect(pos0).not.toBeNull();
      expect(pos1).not.toBeNull();
      expect(pos2).not.toBeNull();
      if (pos0 && pos1 && pos2) {
        expect(pos1.y).toBeGreaterThan(pos0.y);
        expect(pos2.y).toBeGreaterThan(pos1.y);
        expect(pos1.y).toBe(pos0.y + mockConfig.laneHeight);
      }
    });

    it('should use correct colors for different item types', () => {
      const task = calculateItemPosition(
        createMockItem({ type: 'task', start_date: '2025-01-15' }),
        dateRange,
        0,
        mockConfig
      );
      const milestone = calculateItemPosition(
        createMockItem({ type: 'milestone', start_date: '2025-01-15', end_date: null }),
        dateRange,
        0,
        mockConfig
      );
      const release = calculateItemPosition(
        createMockItem({ type: 'release', start_date: '2025-01-15' }),
        dateRange,
        0,
        mockConfig
      );
      const meeting = calculateItemPosition(
        createMockItem({ type: 'meeting', start_date: '2025-01-15' }),
        dateRange,
        0,
        mockConfig
      );

      expect(task).not.toBeNull();
      expect(milestone).not.toBeNull();
      expect(release).not.toBeNull();
      expect(meeting).not.toBeNull();
      expect(task?.color).toBe(DEFAULT_ITEM_COLORS.task);
      expect(milestone?.color).toBe(DEFAULT_ITEM_COLORS.milestone);
      expect(release?.color).toBe(DEFAULT_ITEM_COLORS.release);
      expect(meeting?.color).toBe(DEFAULT_ITEM_COLORS.meeting);
    });
  });

  describe('calculateTimeAxisTicks', () => {
    const dateRange = {
      minDate: '2025-01-01',
      maxDate: '2025-03-31',
      timeRange: 7776000000, // ~90 days in ms
    };

    it('should generate ticks for day zoom level', () => {
      const ticks = calculateTimeAxisTicks(dateRange, 'day', mockConfig);

      expect(ticks.length).toBeGreaterThan(0);
      expect(ticks[0]?.date).toBeDefined();
      expect(ticks[0]?.x).toBeGreaterThanOrEqual(mockConfig.margin.left);
      expect(ticks[0]?.label).toBeDefined();
    });

    it('should generate ticks for week zoom level', () => {
      const ticks = calculateTimeAxisTicks(dateRange, 'week', mockConfig);

      expect(ticks.length).toBeGreaterThan(0);
      expect(ticks.length).toBeLessThan(
        calculateTimeAxisTicks(dateRange, 'day', mockConfig).length
      );
    });

    it('should generate ticks for month zoom level', () => {
      const ticks = calculateTimeAxisTicks(dateRange, 'month', mockConfig);

      expect(ticks.length).toBeGreaterThan(0);
      // Should have approximately 3 months
      expect(ticks.length).toBeLessThanOrEqual(5);
    });

    it('should generate ticks for quarter zoom level', () => {
      const yearRange = {
        minDate: '2025-01-01',
        maxDate: '2025-12-31',
        timeRange: 31536000000,
      };

      const ticks = calculateTimeAxisTicks(yearRange, 'quarter', mockConfig);

      expect(ticks.length).toBeGreaterThan(0);
    });

    it('should generate ticks for year zoom level', () => {
      const multiYearRange = {
        minDate: '2023-01-01',
        maxDate: '2025-12-31',
        timeRange: 94608000000, // ~3 years
      };

      const ticks = calculateTimeAxisTicks(multiYearRange, 'year', mockConfig);

      expect(ticks.length).toBeGreaterThan(0);
    });

    it('should mark major ticks correctly', () => {
      const ticks = calculateTimeAxisTicks(dateRange, 'day', mockConfig);

      // First day of month should be major
      const majorTicks = ticks.filter((t) => t.isMajor);
      expect(majorTicks.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid date range', () => {
      const invalidRange = { minDate: null, maxDate: null, timeRange: 0 };
      const ticks = calculateTimeAxisTicks(invalidRange, 'month', mockConfig);

      expect(ticks).toHaveLength(0);
    });

    it('should format labels correctly for different zoom levels', () => {
      const dayTicks = calculateTimeAxisTicks(dateRange, 'day', mockConfig);
      const monthTicks = calculateTimeAxisTicks(dateRange, 'month', mockConfig);

      // Day ticks should have format like "Jan 15"
      expect(dayTicks[0]?.label).toMatch(/[A-Z][a-z]{2} \d{1,2}/);

      // Month ticks should have format like "Jan 2025"
      expect(monthTicks[0]?.label).toMatch(/[A-Z][a-z]{2} \d{4}/);
    });
  });

  describe('getItemShape', () => {
    it('should return bar for task', () => {
      const item = createMockItem({ type: 'task' });
      expect(getItemShape(item)).toBe('bar');
    });

    it('should return diamond for milestone', () => {
      const item = createMockItem({ type: 'milestone' });
      expect(getItemShape(item)).toBe('diamond');
    });

    it('should return bar for release', () => {
      const item = createMockItem({ type: 'release' });
      expect(getItemShape(item)).toBe('bar');
    });

    it('should return bar for meeting', () => {
      const item = createMockItem({ type: 'meeting' });
      expect(getItemShape(item)).toBe('bar');
    });
  });

  describe('calculateLaneHeight', () => {
    it('should return default lane height for empty array', () => {
      const height = calculateLaneHeight([], mockConfig);
      expect(height).toBe(mockConfig.laneHeight);
    });

    it('should return default lane height for non-overlapping items', () => {
      const items = [
        createMockItem({ start_date: '2025-01-01', end_date: '2025-01-10' }),
        createMockItem({ start_date: '2025-01-15', end_date: '2025-01-20' }),
      ];

      const height = calculateLaneHeight(items, mockConfig);
      expect(height).toBe(mockConfig.laneHeight);
    });

    it('should return increased height for overlapping items', () => {
      const items = [
        createMockItem({ start_date: '2025-01-01', end_date: '2025-01-15' }),
        createMockItem({ start_date: '2025-01-10', end_date: '2025-01-20' }), // Overlaps with first
      ];

      const height = calculateLaneHeight(items, mockConfig);
      expect(height).toBeGreaterThan(mockConfig.laneHeight);
    });

    it('should handle multiple rows of overlapping items', () => {
      const items = [
        createMockItem({ id: '1', start_date: '2025-01-01', end_date: '2025-01-15' }),
        createMockItem({ id: '2', start_date: '2025-01-10', end_date: '2025-01-20' }), // Row 2
        createMockItem({ id: '3', start_date: '2025-01-12', end_date: '2025-01-18' }), // Row 3
      ];

      const height = calculateLaneHeight(items, mockConfig);
      const expectedHeight = 3 * (mockConfig.itemHeight + mockConfig.itemPadding);
      expect(height).toBeGreaterThanOrEqual(expectedHeight);
    });

    it('should ignore items with no start_date', () => {
      const items = [
        createMockItem({ start_date: null }),
        createMockItem({ start_date: '2025-01-01', end_date: '2025-01-10' }),
      ];

      const height = calculateLaneHeight(items, mockConfig);
      expect(height).toBe(mockConfig.laneHeight);
    });
  });

  describe('createLaneGroups', () => {
    it('should create lane groups with sorted names', () => {
      const laneData = {
        Backend: [createMockItem({ id: '1' })],
        Frontend: [createMockItem({ id: '2' })],
        Design: [createMockItem({ id: '3' })],
      };

      const groups = createLaneGroups(laneData, mockConfig);

      expect(groups).toHaveLength(3);
      expect(groups[0]?.laneName).toBe('Backend');
      expect(groups[1]?.laneName).toBe('Design');
      expect(groups[2]?.laneName).toBe('Frontend');
    });

    it('should assign correct indices', () => {
      const laneData = {
        'Lane A': [createMockItem()],
        'Lane B': [createMockItem()],
      };

      const groups = createLaneGroups(laneData, mockConfig);

      expect(groups[0]?.index).toBe(0);
      expect(groups[1]?.index).toBe(1);
    });

    it('should calculate lane heights', () => {
      const laneData = {
        'Lane A': [
          createMockItem({ start_date: '2025-01-01', end_date: '2025-01-15' }),
          createMockItem({ start_date: '2025-01-10', end_date: '2025-01-20' }), // Overlaps
        ],
        'Lane B': [createMockItem({ start_date: '2025-01-01', end_date: '2025-01-10' })],
      };

      const groups = createLaneGroups(laneData, mockConfig);

      expect(groups[0]?.height).toBeGreaterThan(mockConfig.laneHeight);
      expect(groups[1]?.height).toBe(mockConfig.laneHeight);
    });

    it('should handle empty lane data', () => {
      const groups = createLaneGroups({}, mockConfig);
      expect(groups).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('should handle 1000 items efficiently', () => {
      const items = Array.from({ length: 1000 }, (_, i) =>
        createMockItem({
          id: `item-${i}`,
          start_date: `2025-01-${(i % 28) + 1}`,
          end_date: `2025-02-${(i % 28) + 1}`,
          lane: `Lane ${i % 10}`,
        })
      );

      const start = performance.now();
      const grouped = groupItemsByLane(items, 'lane');
      const range = calculateDateRange(items);
      const laneGroups = createLaneGroups(grouped, mockConfig);
      const end = performance.now();

      expect(end - start).toBeLessThan(300); // Should complete in <300ms
      expect(Object.keys(grouped)).toHaveLength(10);
      expect(range.minDate).toBeDefined();
      expect(laneGroups).toHaveLength(10);
    });
  });
});
