/**
 * HTML Timeline Artifact Export Service
 *
 * Generates a standalone, self-contained HTML file rendering a branch's timeline
 * as hand-rolled SVG, with the dataset inlined as JSON. The output opens in any
 * browser, offline, with no app, server, sql.js, or React runtime.
 *
 * This is the flagship *output* of SwimLanes (the app remains the authoring
 * tool). See `ref/html-artifact-export.md` for positioning and rationale.
 *
 * Design notes:
 * - The exporter is a *consumer* of `timeline.service.ts` — it reuses the same
 *   layout math the in-app canvas uses, so the artifact matches what users see.
 * - v1 renders a single branch. The embedded payload is structured for N
 *   branches so v2 (multi-scenario toggle) is purely additive.
 * - The artifact is read-only: no edit/re-import logic is embedded.
 *
 * All functions are pure for easy testing.
 */

import type { Item } from '../types/database.types';
import type { ZoomLevel, LaneGroupBy, TimelineConfig } from '../types/timeline.types';
import type {
  ExportOptions,
  ExportBranchInput,
  ExportFilters,
  ExportRenderModel,
  ExportPayload,
} from '../types/export.types';
import {
  groupItemsByLane,
  calculateDateRange,
  createLaneGroups,
  calculateTimeAxisTicks,
  calculateChartWidth,
  calculateItemPosition,
  assignItemRows,
  DEFAULT_ITEM_COLORS,
} from './timeline.service';

/** Current artifact format version. Bump when the embedded payload shape changes. */
export const EXPORT_FORMAT_VERSION = 1;

/** Default zoom level when none is supplied. */
const DEFAULT_ZOOM: ZoomLevel = 'month';

/** Default lane grouping when none is supplied. */
const DEFAULT_GROUP_BY: LaneGroupBy = 'lane';

/**
 * Timeline layout config used for the artifact. Mirrors the in-app defaults
 * (see `useTimelineData`) so positioning matches the canvas. `canvasWidth` is
 * computed per export from the date range + zoom level.
 */
const BASE_CONFIG: Omit<TimelineConfig, 'canvasWidth'> = {
  canvasHeight: 600,
  margin: { top: 60, right: 20, bottom: 20, left: 150 },
  laneHeight: 50,
  itemPadding: 4,
  itemHeight: 36,
};

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

/**
 * Filters items the same way the in-app timeline does (type exact match,
 * project partial case-insensitive, date-range overlap).
 *
 * @param items - Items to filter
 * @param filters - Active filters (empty/undefined fields are ignored)
 * @returns Filtered items
 */
export function filterItems(items: Item[], filters: ExportFilters = {}): Item[] {
  const { type, project, startDate, endDate } = filters;

  return items.filter((item) => {
    if (type && item.type !== type) return false;

    if (project && !item.project?.toLowerCase().includes(project.toLowerCase())) return false;

    // Item must end on or after the filter start date
    if (startDate && item.end_date && item.end_date < startDate) return false;

    // Item must start on or before the filter end date
    if (endDate && item.start_date && item.start_date > endDate) return false;

    return true;
  });
}

// ---------------------------------------------------------------------------
// Render model
// ---------------------------------------------------------------------------

/**
 * Builds the pure, serializable render model for a set of items.
 *
 * @param items - Items to render (already filtered)
 * @param zoomLevel - Zoom level for layout
 * @param laneGroupBy - Lane grouping strategy
 * @returns Render model with config, lanes, ticks, and SVG dimensions
 */
export function buildRenderModel(
  items: Item[],
  zoomLevel: ZoomLevel = DEFAULT_ZOOM,
  laneGroupBy: LaneGroupBy = DEFAULT_GROUP_BY
): ExportRenderModel {
  const dateRange = calculateDateRange(items);
  const chartWidth = calculateChartWidth(dateRange, zoomLevel);

  const config: TimelineConfig = {
    ...BASE_CONFIG,
    canvasWidth: chartWidth,
  };

  const laneData = groupItemsByLane(items, laneGroupBy);
  const laneGroups = createLaneGroups(laneData, config);
  const timeAxisTicks = calculateTimeAxisTicks(dateRange, zoomLevel, config);

  const totalLaneHeight = laneGroups.reduce((sum, group) => sum + group.height, 0);
  const svgWidth = config.canvasWidth;
  const svgHeight = config.margin.top + totalLaneHeight + config.margin.bottom;

  return { config, dateRange, laneGroups, timeAxisTicks, svgWidth, svgHeight };
}

// ---------------------------------------------------------------------------
// String escaping
// ---------------------------------------------------------------------------

/** Escapes text for safe inclusion in XML/SVG/HTML text and attribute values. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escapes a JSON string so it can be embedded inside a <script> tag safely. */
function escapeForScript(json: string): string {
  // Prevent a literal </script> in the data from terminating the tag, and
  // neutralize HTML-comment / line-separator edge cases.
  return json
    .replace(/<\/script/gi, '<\\/script')
    .replace(/<!--/g, '<\\!--')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Truncates text to roughly fit a pixel width, appending an ellipsis.
 * SVG has no native text truncation, so this is an approximation.
 */
function truncateToWidth(text: string, maxPx: number, pxPerChar: number): string {
  if (maxPx <= 0) return '';
  const maxChars = Math.floor(maxPx / pxPerChar);
  if (text.length <= maxChars) return text;
  if (maxChars <= 1) return '…';
  return text.slice(0, maxChars - 1) + '…';
}

// ---------------------------------------------------------------------------
// SVG rendering
// ---------------------------------------------------------------------------

/** Builds the multi-line hover tooltip text for an item (one item per `<title>`). */
function itemTooltip(item: Item): string {
  const lines: string[] = [`${item.title} (${item.type})`];
  if (item.start_date) lines.push(`Start: ${item.start_date}`);
  if (item.end_date && item.type !== 'milestone') lines.push(`End: ${item.end_date}`);
  if (item.owner) lines.push(`Owner: ${item.owner}`);
  if (item.project) lines.push(`Project: ${item.project}`);
  if (item.lane) lines.push(`Lane: ${item.lane}`);
  if (item.tags) lines.push(`Tags: ${item.tags}`);
  return escapeXml(lines.join('\n'));
}

/**
 * Renders the timeline render model to an SVG string.
 *
 * Visual encoding matches the app: tasks=blue, milestones=green diamonds,
 * releases=orange, meetings=purple. Lanes alternate background shades, with
 * fixed lane labels on the left and a time axis across the top.
 *
 * @param model - Render model from {@link buildRenderModel}
 * @returns Standalone `<svg>...</svg>` markup
 */
export function renderSvg(model: ExportRenderModel): string {
  const { config, dateRange, laneGroups, timeAxisTicks, svgWidth, svgHeight } = model;
  const { margin } = config;

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" ` +
      `viewBox="0 0 ${svgWidth} ${svgHeight}" font-family="-apple-system, system-ui, sans-serif">`
  );

  // Empty state
  if (laneGroups.length === 0 || !dateRange.minDate) {
    parts.push(
      `<text x="${svgWidth / 2}" y="${svgHeight / 2}" text-anchor="middle" ` +
        `font-size="16" fill="#6b7280">No dated items to display</text>`
    );
    parts.push('</svg>');
    return parts.join('\n');
  }

  // --- Layer 1: lane backgrounds (alternating shades) ---
  let cumulativeY = margin.top;
  const laneTops: number[] = [];
  laneGroups.forEach((lane, index) => {
    laneTops.push(cumulativeY);
    const fill = index % 2 === 0 ? '#e5e7eb' : '#ffffff';
    parts.push(
      `<rect x="0" y="${cumulativeY}" width="${svgWidth}" height="${lane.height}" fill="${fill}"/>`
    );
    cumulativeY += lane.height;
  });

  // --- Layer 2: items ---
  laneGroups.forEach((lane, laneIndex) => {
    const laneTop = laneTops[laneIndex] ?? margin.top;
    const rowMap = assignItemRows(lane.items);

    lane.items.forEach((item) => {
      const pos = calculateItemPosition(item, dateRange, 0, config);
      if (!pos) return;

      const rowIndex = rowMap.get(item.id) ?? 0;
      const itemY =
        laneTop + config.itemPadding + rowIndex * (config.itemHeight + config.itemPadding);
      const color = DEFAULT_ITEM_COLORS[item.type];
      const tooltip = itemTooltip(item);

      if (item.type === 'milestone') {
        // Diamond centered on the start date
        const cx = pos.x + pos.width / 2;
        const cy = itemY + pos.height / 2;
        const r = pos.height / 2;
        const points = `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
        parts.push(
          `<g><title>${tooltip}</title>` +
            `<polygon points="${points}" fill="${color}" stroke="${color}" ` +
            `stroke-width="2" opacity="0.85"/>` +
            `<text x="${cx + r + 8}" y="${cy}" dominant-baseline="middle" ` +
            `font-size="11" fill="#374151">${escapeXml(item.title)}</text>` +
            `</g>`
        );
      } else {
        // Bar for task / release / meeting
        const label =
          pos.width > 50
            ? `<text x="${pos.x + 6}" y="${itemY + pos.height / 2}" dominant-baseline="middle" ` +
              `font-size="11" font-weight="bold" fill="#ffffff">` +
              `${escapeXml(truncateToWidth(item.title, pos.width - 12, 6.2))}</text>`
            : '';
        parts.push(
          `<g><title>${tooltip}</title>` +
            `<rect x="${pos.x}" y="${itemY}" width="${pos.width}" height="${pos.height}" ` +
            `rx="4" fill="${color}" opacity="0.9"/>` +
            label +
            `</g>`
        );
      }
    });
  });

  // --- Layer 3: time axis (white strip across the top, drawn over item tops) ---
  parts.push(`<rect x="0" y="0" width="${svgWidth}" height="${margin.top}" fill="#ffffff"/>`);
  timeAxisTicks.forEach((tick) => {
    const stroke = tick.isMajor ? '#333333' : '#999999';
    const strokeWidth = tick.isMajor ? 2 : 1;
    parts.push(
      `<line x1="${tick.x}" y1="${margin.top - 10}" x2="${tick.x}" y2="${margin.top}" ` +
        `stroke="${stroke}" stroke-width="${strokeWidth}"/>`
    );
    parts.push(
      `<text x="${tick.x}" y="${margin.top - 16}" text-anchor="middle" font-size="12" ` +
        `fill="#333333">${escapeXml(tick.label)}</text>`
    );
  });
  parts.push(
    `<line x1="0" y1="${margin.top}" x2="${svgWidth}" y2="${margin.top}" ` +
      `stroke="#333333" stroke-width="2"/>`
  );

  // --- Layer 4: lane labels (white strip down the left, drawn over item starts) ---
  laneGroups.forEach((lane, index) => {
    const top = laneTops[index] ?? margin.top;
    const centerY = top + lane.height / 2;
    parts.push(
      `<rect x="0" y="${top}" width="${margin.left}" height="${lane.height}" ` +
        `fill="#ffffff" opacity="0.97"/>`
    );
    const labelText = truncateToWidth(lane.laneName, margin.left - 20, 7.5);
    parts.push(
      `<text x="10" y="${centerY}" dominant-baseline="middle" font-size="14" ` +
        `font-weight="bold" fill="#4b5563"><title>${escapeXml(lane.laneName)}</title>` +
        `${escapeXml(labelText)}</text>`
    );
  });

  parts.push('</svg>');
  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// HTML document
// ---------------------------------------------------------------------------

/** Human-readable summary of the active filters for the header. */
function describeFilters(filters: ExportFilters): string {
  const parts: string[] = [];
  if (filters.type) parts.push(`type=${filters.type}`);
  if (filters.project) parts.push(`project~"${filters.project}"`);
  if (filters.startDate) parts.push(`from ${filters.startDate}`);
  if (filters.endDate) parts.push(`to ${filters.endDate}`);
  return parts.length > 0 ? parts.join(', ') : 'none';
}

/**
 * Generates the complete self-contained HTML artifact for one or more branches.
 *
 * v1 renders the active branch's timeline as inline SVG and embeds every
 * provided branch's data as JSON (for v2 to consume). No external requests,
 * no runtime dependencies.
 *
 * @param branches - Branch data to bake in (v1 callers pass one)
 * @param options - Export options (active branch, zoom, grouping, filters, title)
 * @returns A full HTML document string
 * @throws If the active branch is not present in `branches`
 */
export function generateTimelineArtifact(
  branches: ExportBranchInput[],
  options: ExportOptions
): string {
  const zoomLevel = options.zoomLevel ?? DEFAULT_ZOOM;
  const laneGroupBy = options.laneGroupBy ?? DEFAULT_GROUP_BY;
  const filters = options.filters ?? {};
  const generatedAt = options.generatedAt ?? new Date();

  const active = branches.find((b) => b.branchId === options.activeBranchId);
  if (!active) {
    throw new Error(`Active branch "${options.activeBranchId}" not found among provided branches`);
  }

  const activeLabel = active.label || active.branchId;
  const title = options.title || `SwimLanes Timeline — ${activeLabel}`;

  // Filter then render the active branch.
  const filteredActiveItems = filterItems(active.items, filters);
  const model = buildRenderModel(filteredActiveItems, zoomLevel, laneGroupBy);
  const svg = renderSvg(model);

  // Build the N-branch payload (each branch's items pre-filtered for v2 reuse).
  const payload: ExportPayload = {
    formatVersion: EXPORT_FORMAT_VERSION,
    title,
    generatedAt: generatedAt.toISOString(),
    zoomLevel,
    laneGroupBy,
    filters,
    activeBranchId: options.activeBranchId,
    branches: branches.map((b) => ({
      branchId: b.branchId,
      label: b.label ?? null,
      items: filterItems(b.items, filters),
    })),
  };
  const payloadJson = escapeForScript(JSON.stringify(payload));

  const itemCount = filteredActiveItems.length;
  const generatedDisplay = generatedAt.toLocaleString();
  const filterSummary = describeFilters(filters);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="generator" content="SwimLanes"/>
<title>${escapeXml(title)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif;
    color: #1f2937;
    background: #f9fafb;
  }
  header {
    padding: 16px 20px;
    background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
  }
  header h1 { margin: 0 0 4px; font-size: 18px; }
  header .meta { font-size: 12px; color: #6b7280; }
  header .meta span { margin-right: 16px; white-space: nowrap; }
  .legend { margin-top: 8px; font-size: 12px; color: #4b5563; }
  .legend .swatch {
    display: inline-block; width: 10px; height: 10px; border-radius: 2px;
    margin: 0 4px 0 12px; vertical-align: middle;
  }
  .legend .swatch:first-child { margin-left: 0; }
  .timeline-scroll { overflow: auto; padding: 16px 20px 40px; }
  .timeline-scroll svg { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; }
</style>
</head>
<body>
<header>
  <h1>${escapeXml(title)}</h1>
  <div class="meta">
    <span>Branch: <strong>${escapeXml(activeLabel)}</strong></span>
    <span>Items: <strong>${itemCount}</strong></span>
    <span>Zoom: ${escapeXml(zoomLevel)}</span>
    <span>Grouped by: ${escapeXml(laneGroupBy)}</span>
    <span>Filters: ${escapeXml(filterSummary)}</span>
    <span>Generated: ${escapeXml(generatedDisplay)}</span>
  </div>
  <div class="legend">
    <span class="swatch" style="background:${DEFAULT_ITEM_COLORS.task}"></span>Task
    <span class="swatch" style="background:${DEFAULT_ITEM_COLORS.milestone}"></span>Milestone
    <span class="swatch" style="background:${DEFAULT_ITEM_COLORS.release}"></span>Release
    <span class="swatch" style="background:${DEFAULT_ITEM_COLORS.meeting}"></span>Meeting
  </div>
</header>
<main class="timeline-scroll">
${svg}
</main>
<script type="application/json" id="swimlanes-data">
${payloadJson}
</script>
</body>
</html>`;
}
