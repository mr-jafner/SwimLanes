/**
 * SwimLanes Type Definitions
 *
 * Central barrel export for all TypeScript types used throughout the application.
 * Import types from this module using path alias:
 *
 * @example
 * ```typescript
 * import type { Item, Branch, ColumnMapping, TimelineViewState } from '@/types';
 * ```
 */

// Database types
export type {
  ItemType,
  HistoryOperation,
  Item,
  ItemHistory,
  Branch,
  ImportProfile,
  AppParam,
  SchemaVersion,
} from './database.types';

// Import workflow types
export type {
  IDStrategy,
  ColumnMapping,
  AutoDetectPatterns,
  ParsedRow,
  DryRunItem,
  DryRunResult,
  SkippedRow,
  ImportSummary,
  ImportMode,
  ValidationResult,
  CSVParseOptions,
} from './import.types';

// Timeline visualization types
export type {
  ZoomLevel,
  LaneGroupBy,
  PanOffset,
  TimelineMargin,
  DateRange,
  TimelineViewState,
  ItemColors,
  TickIntervals,
  LaneData,
  ItemRenderData,
  TimeAxisTick,
  TimelineFilters,
  TimelineInteraction,
} from './timeline.types';

// Branch comparison types
export type {
  ComparisonStatus,
  ComparisonItem,
  ComparisonResult,
  ComparisonSummary,
  FieldDifference,
  DetailedComparison,
  ComparisonFilters,
  MergeConflict,
  MergeOptions,
} from './branch.types';
