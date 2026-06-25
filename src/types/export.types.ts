/**
 * HTML timeline artifact export type definitions for SwimLanes
 *
 * These types support exporting a branch (and, in future, multiple branches)
 * to a standalone, self-contained HTML file with an inlined dataset and a
 * hand-rolled SVG renderer. See `ref/html-artifact-export.md`.
 */

import type { Item } from './database.types';
import type {
  ZoomLevel,
  LaneGroupBy,
  DateRange,
  LaneGroup,
  TimeAxisTick,
  TimelineConfig,
} from './timeline.types';

/**
 * Filters applied when baking a branch into the artifact.
 *
 * Mirrors the in-app timeline filters so the exported file matches what the
 * user currently sees. Empty/undefined fields mean "no filtering".
 */
export interface ExportFilters {
  /** Filter by exact item type ('' / undefined = all) */
  type?: string;

  /** Filter by project (partial, case-insensitive match; '' / undefined = all) */
  project?: string;

  /** Only include items ending on or after this ISO date */
  startDate?: string;

  /** Only include items starting on or before this ISO date */
  endDate?: string;
}

/**
 * A single branch's data to bake into the artifact.
 *
 * v1 callers pass exactly one branch, but the export payload is structured to
 * hold many so that v2 (multi-scenario toggle) is purely additive.
 */
export interface ExportBranchInput {
  /** Branch identifier */
  branchId: string;

  /** Human-readable branch label (falls back to branchId in the UI) */
  label?: string | null;

  /** Items belonging to this branch (already on the branch; pre-filter optional) */
  items: Item[];
}

/**
 * Options controlling artifact generation.
 */
export interface ExportOptions {
  /** Branch rendered as the active/visible timeline */
  activeBranchId: string;

  /** Zoom level used for layout (defaults to 'month') */
  zoomLevel?: ZoomLevel;

  /** How to group items into swim lanes (defaults to 'lane') */
  laneGroupBy?: LaneGroupBy;

  /** Filters applied to every branch before rendering */
  filters?: ExportFilters;

  /** Title shown in the artifact header (defaults to a generated title) */
  title?: string;

  /** Generation timestamp (defaults to `new Date()`) */
  generatedAt?: Date;
}

/**
 * Pure, serializable render model for one branch.
 *
 * This is the view model the exporter computes from the timeline service. It is
 * also embedded (as JSON) in the artifact so future versions can re-render
 * client-side without recomputation.
 */
export interface ExportRenderModel {
  /** Timeline layout configuration used to position items */
  config: TimelineConfig;

  /** Overall date range of the (filtered) items */
  dateRange: DateRange;

  /** Swim lanes with their items and computed heights */
  laneGroups: LaneGroup[];

  /** Time axis tick marks */
  timeAxisTicks: TimeAxisTick[];

  /** Total SVG width in pixels */
  svgWidth: number;

  /** Total SVG height in pixels */
  svgHeight: number;
}

/**
 * The full payload embedded in the artifact as inlined JSON.
 *
 * v1 populates `branches` with a single entry; the shape supports N branches.
 */
export interface ExportPayload {
  /** Artifact format version (bump when the embedded shape changes) */
  formatVersion: number;

  /** Display title */
  title: string;

  /** ISO timestamp of generation */
  generatedAt: string;

  /** Zoom level used for layout */
  zoomLevel: ZoomLevel;

  /** Lane grouping strategy used */
  laneGroupBy: LaneGroupBy;

  /** Filters applied before rendering */
  filters: ExportFilters;

  /** Branch id rendered as active */
  activeBranchId: string;

  /** All baked branches (v1: one) */
  branches: ExportPayloadBranch[];
}

/**
 * One branch entry inside {@link ExportPayload}.
 */
export interface ExportPayloadBranch {
  branchId: string;
  label: string | null;
  items: Item[];
}
