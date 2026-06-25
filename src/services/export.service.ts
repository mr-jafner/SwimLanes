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

/** Parses an item's `dependencies` field (a JSON array of item ids). */
export function parseDependencies(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

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

/** Geometry of a positioned item, used for arrows and rendering. */
interface PositionedItem {
  item: Item;
  isMilestone: boolean;
  startX: number;
  endX: number;
  centerY: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

/** Options shared by the SVG renderers. */
export interface RenderSvgOptions {
  /** If set (ISO YYYY-MM-DD) and within range, draws a "Today" marker line. */
  nowDate?: string;
}

/** Computes lane tops and positioned items for a model. */
function computeLayout(model: ExportRenderModel): {
  laneTops: number[];
  positioned: PositionedItem[];
  posMap: Map<string, PositionedItem>;
} {
  const { config, dateRange, laneGroups } = model;
  const { margin } = config;

  let cumulativeY = margin.top;
  const laneTops: number[] = [];
  const positioned: PositionedItem[] = [];
  const posMap = new Map<string, PositionedItem>();

  laneGroups.forEach((lane, laneIndex) => {
    laneTops[laneIndex] = cumulativeY;
    const laneTop = cumulativeY;
    const rowMap = assignItemRows(lane.items);

    lane.items.forEach((item) => {
      const pos = calculateItemPosition(item, dateRange, 0, config);
      if (!pos) return;

      const rowIndex = rowMap.get(item.id) ?? 0;
      const itemY =
        laneTop + config.itemPadding + rowIndex * (config.itemHeight + config.itemPadding);
      const isMilestone = item.type === 'milestone';
      const r = pos.height / 2;
      const cx = pos.x + pos.width / 2;

      const entry: PositionedItem = {
        item,
        isMilestone,
        startX: isMilestone ? cx - r : pos.x,
        endX: isMilestone ? cx + r : pos.x + pos.width,
        centerY: itemY + pos.height / 2,
        x: pos.x,
        y: itemY,
        width: pos.width,
        height: pos.height,
        color: DEFAULT_ITEM_COLORS[item.type],
      };
      positioned.push(entry);
      // Last writer wins on duplicate ids; fine for arrow anchoring.
      posMap.set(item.id, entry);
    });

    cumulativeY += lane.height;
  });

  return { laneTops, positioned, posMap };
}

/** Marker def for dependency arrowheads. */
function depArrowDefs(): string {
  return (
    `<defs><marker id="dep-arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" ` +
    `orient="auto" markerUnits="userSpaceOnUse">` +
    `<path d="M0,0 L8,4 L0,8 z" fill="#6b7280"/></marker></defs>`
  );
}

/** Emits alternating lane background rects spanning [0, width]. */
function emitBackgrounds(model: ExportRenderModel, laneTops: number[], width: number): string[] {
  return model.laneGroups.map((lane, index) => {
    const cls = index % 2 === 0 ? 'lane-bg-even' : 'lane-bg-odd';
    return `<rect class="${cls}" x="0" y="${laneTops[index]}" width="${width}" height="${lane.height}"/>`;
  });
}

/** Emits dependency arrow paths between positioned items. */
function emitArrows(positioned: PositionedItem[], posMap: Map<string, PositionedItem>): string[] {
  const out: string[] = [];
  positioned.forEach((target) => {
    parseDependencies(target.item.dependencies).forEach((depId) => {
      const source = posMap.get(depId);
      if (!source) return;
      const sx = source.endX;
      const sy = source.centerY;
      const tx = target.startX;
      const ty = target.centerY;
      const dx = Math.max(16, Math.abs(tx - sx) / 2);
      out.push(
        `<path class="dep-arrow" d="M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ` +
          `${tx} ${ty}" marker-end="url(#dep-arrowhead)"/>`
      );
    });
  });
  return out;
}

/** Emits item bars/diamonds with hover tooltips. */
function emitItems(positioned: PositionedItem[]): string[] {
  return positioned.map((p) => {
    const tooltip = itemTooltip(p.item);
    if (p.isMilestone) {
      const cx = p.x + p.width / 2;
      const cy = p.centerY;
      const r = p.height / 2;
      const points = `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
      return (
        `<g><title>${tooltip}</title>` +
        `<polygon points="${points}" fill="${p.color}" stroke="${p.color}" ` +
        `stroke-width="2" opacity="0.85"/>` +
        `<text class="milestone-label" x="${cx + r + 8}" y="${cy}" dominant-baseline="middle" ` +
        `font-size="11">${escapeXml(p.item.title)}</text>` +
        `</g>`
      );
    }
    const label =
      p.width > 50
        ? `<text x="${p.x + 6}" y="${p.centerY}" dominant-baseline="middle" ` +
          `font-size="11" font-weight="bold" fill="#ffffff">` +
          `${escapeXml(truncateToWidth(p.item.title, p.width - 12, 6.2))}</text>`
        : '';
    return (
      `<g><title>${tooltip}</title>` +
      `<rect x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" ` +
      `rx="4" fill="${p.color}" opacity="0.9"/>` +
      label +
      `</g>`
    );
  });
}

/** Computes the x position of a date within the chart, or null if out of range. */
function dateToX(model: ExportRenderModel, isoDate: string): number | null {
  const { config, dateRange } = model;
  if (!dateRange.minDate || !dateRange.maxDate || dateRange.timeRange <= 0) return null;
  if (isoDate < dateRange.minDate || isoDate > dateRange.maxDate) return null;
  const chartWidth = config.canvasWidth - config.margin.left - config.margin.right;
  const ms = new Date(isoDate).getTime() - new Date(dateRange.minDate).getTime();
  return config.margin.left + (ms / dateRange.timeRange) * chartWidth;
}

/** Emits a "Today" marker line if nowDate falls within the timeline range. */
function emitTodayMarker(model: ExportRenderModel, nowDate: string | undefined): string[] {
  if (!nowDate) return [];
  const x = dateToX(model, nowDate);
  if (x === null) return [];
  const top = model.config.margin.top;
  return [
    `<line class="today-line" x1="${x}" y1="${top}" x2="${x}" y2="${model.svgHeight}">` +
      `<title>Today: ${escapeXml(nowDate)}</title></line>`,
    `<text class="today-label" x="${x + 4}" y="${top + 12}" font-size="10">Today</text>`,
  ];
}

/** Emits the top time axis (strip, ticks, labels, baseline) across [0, width]. */
function emitAxis(model: ExportRenderModel, width: number): string[] {
  const top = model.config.margin.top;
  const out: string[] = [`<rect class="axis-strip" x="0" y="0" width="${width}" height="${top}"/>`];
  model.timeAxisTicks.forEach((tick) => {
    const cls = tick.isMajor ? 'tick-major' : 'tick-minor';
    out.push(`<line class="${cls}" x1="${tick.x}" y1="${top - 10}" x2="${tick.x}" y2="${top}"/>`);
    out.push(
      `<text class="axis-label" x="${tick.x}" y="${top - 16}" text-anchor="middle" ` +
        `font-size="12">${escapeXml(tick.label)}</text>`
    );
  });
  out.push(`<line class="axis-line" x1="0" y1="${top}" x2="${width}" y2="${top}"/>`);
  return out;
}

/** Emits lane label strips + text spanning [0, marginLeft]. */
function emitLaneLabels(model: ExportRenderModel, laneTops: number[]): string[] {
  const marginLeft = model.config.margin.left;
  const out: string[] = [];
  model.laneGroups.forEach((lane, index) => {
    const top = laneTops[index] ?? model.config.margin.top;
    const centerY = top + lane.height / 2;
    out.push(
      `<rect class="lane-strip" x="0" y="${top}" width="${marginLeft}" height="${lane.height}"/>`
    );
    const labelText = truncateToWidth(lane.laneName, marginLeft - 20, 7.5);
    out.push(
      `<text class="lane-label" x="10" y="${centerY}" dominant-baseline="middle" font-size="14" ` +
        `font-weight="bold"><title>${escapeXml(lane.laneName)}</title>` +
        `${escapeXml(labelText)}</text>`
    );
  });
  return out;
}

/** Wraps body markup in an `<svg>` element. */
function svgWrap(width: number, height: number, viewBox: string, body: string[]): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="${viewBox}" font-family="-apple-system, system-ui, sans-serif">\n` +
    body.join('\n') +
    `\n</svg>`
  );
}

/** Renders the empty-state SVG. */
function emptySvg(width: number, height: number): string {
  return svgWrap(width, height, `0 0 ${width} ${height}`, [
    `<text class="empty-msg" x="${width / 2}" y="${height / 2}" text-anchor="middle" ` +
      `font-size="16">No dated items to display</text>`,
  ]);
}

/**
 * Renders the full timeline model to a single self-contained SVG (chart + lane
 * labels together). Used standalone; the artifact uses {@link renderChartSvg} +
 * {@link renderGutterSvg} for a frozen label column.
 *
 * @param model - Render model from {@link buildRenderModel}
 * @param options - Optional render options (e.g. today marker)
 */
export function renderSvg(model: ExportRenderModel, options: RenderSvgOptions = {}): string {
  const { svgWidth, svgHeight, laneGroups, dateRange } = model;
  if (laneGroups.length === 0 || !dateRange.minDate) return emptySvg(svgWidth, svgHeight);

  const { laneTops, positioned, posMap } = computeLayout(model);
  return svgWrap(svgWidth, svgHeight, `0 0 ${svgWidth} ${svgHeight}`, [
    depArrowDefs(),
    ...emitBackgrounds(model, laneTops, svgWidth),
    ...emitTodayMarker(model, options.nowDate),
    ...emitArrows(positioned, posMap),
    ...emitItems(positioned),
    ...emitAxis(model, svgWidth),
    ...emitLaneLabels(model, laneTops),
  ]);
}

/**
 * Renders the scrollable chart (everything except the left lane-label column).
 * The viewBox crops the left margin so x=0 begins at the chart area, letting a
 * separate frozen gutter ({@link renderGutterSvg}) sit to its left.
 */
export function renderChartSvg(model: ExportRenderModel, options: RenderSvgOptions = {}): string {
  const { svgWidth, svgHeight, laneGroups, dateRange, config } = model;
  const chartWidth = Math.max(svgWidth - config.margin.left, 1);
  if (laneGroups.length === 0 || !dateRange.minDate) return emptySvg(chartWidth, svgHeight);

  const { laneTops, positioned, posMap } = computeLayout(model);
  const viewBox = `${config.margin.left} 0 ${chartWidth} ${svgHeight}`;
  return svgWrap(chartWidth, svgHeight, viewBox, [
    depArrowDefs(),
    ...emitBackgrounds(model, laneTops, svgWidth),
    ...emitTodayMarker(model, options.nowDate),
    ...emitArrows(positioned, posMap),
    ...emitItems(positioned),
    ...emitAxis(model, svgWidth),
  ]);
}

/**
 * Renders the frozen left gutter: alternating lane backgrounds, the top-left
 * corner, and the lane labels. Stays fixed while the chart scrolls.
 */
export function renderGutterSvg(model: ExportRenderModel): string {
  const { svgHeight, laneGroups, dateRange, config } = model;
  const width = config.margin.left;
  if (laneGroups.length === 0 || !dateRange.minDate) {
    return svgWrap(width, svgHeight, `0 0 ${width} ${svgHeight}`, [
      `<rect class="axis-strip" x="0" y="0" width="${width}" height="${svgHeight}"/>`,
    ]);
  }

  const { laneTops } = computeLayout(model);
  return svgWrap(width, svgHeight, `0 0 ${width} ${svgHeight}`, [
    ...emitBackgrounds(model, laneTops, width),
    ...emitLaneLabels(model, laneTops),
    // Top-left corner over the lane backgrounds, aligned with the time axis.
    `<rect class="axis-strip" x="0" y="0" width="${width}" height="${config.margin.top}"/>`,
    `<text class="lane-corner" x="10" y="${config.margin.top - 16}" font-size="11">Lanes</text>`,
  ]);
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

/** One branch rendered to SVG, with the metadata the switcher/header need. */
interface RenderedBranch {
  branchId: string;
  label: string;
  itemCount: number;
  gutterSvg: string;
  chartSvg: string;
}

/**
 * Builds the scenario switcher markup (one button per branch). Returns an empty
 * string when there is only a single branch (no switcher needed).
 */
function renderSwitcher(rendered: RenderedBranch[], activeBranchId: string): string {
  if (rendered.length <= 1) return '';

  const buttons = rendered
    .map((r) => {
      const on = r.branchId === activeBranchId;
      return (
        `<button type="button" class="scenario-btn${on ? ' active' : ''}" ` +
        `data-branch-id="${escapeXml(r.branchId)}" data-label="${escapeXml(r.label)}" ` +
        `data-item-count="${r.itemCount}" aria-pressed="${on ? 'true' : 'false'}">` +
        `${escapeXml(r.label)} <span class="count">${r.itemCount}</span></button>`
      );
    })
    .join('\n    ');

  return `<div class="scenario-switcher" role="group" aria-label="Scenarios">
    <span class="switcher-label">Scenario:</span>
    ${buttons}
  </div>`;
}

/**
 * Runtime script (vanilla JS) that toggles which branch view is visible and
 * updates the header counts. Only emitted when there is more than one branch.
 */
function renderSwitcherScript(): string {
  return `<script>
(function () {
  var views = document.querySelectorAll('.branch-view');
  var btns = document.querySelectorAll('.scenario-btn');
  var metaBranch = document.getElementById('meta-branch');
  var metaItems = document.getElementById('meta-items');
  function activate(id, label, count) {
    views.forEach(function (v) { v.hidden = v.getAttribute('data-branch-id') !== id; });
    btns.forEach(function (b) {
      var on = b.getAttribute('data-branch-id') === id;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (metaBranch && label != null) metaBranch.textContent = label;
    if (metaItems && count != null) metaItems.textContent = count;
  }
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      activate(b.getAttribute('data-branch-id'), b.getAttribute('data-label'), b.getAttribute('data-item-count'));
    });
  });
})();
</script>`;
}

/**
 * Runtime script for the light/dark theme toggle. Initializes from the OS
 * preference and lets the reader flip it; the choice is not persisted (the
 * artifact is a stateless snapshot).
 */
function renderThemeScript(): string {
  return `<script>
(function () {
  var root = document.documentElement;
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  var btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
    });
  }
})();
</script>`;
}

/**
 * Generates the complete self-contained HTML artifact for one or more branches.
 *
 * When multiple branches are supplied, all are rendered into the single file and
 * an embedded vanilla-JS switcher lets the reader toggle between scenarios
 * offline. The active branch is shown initially. Every branch's data is also
 * embedded as JSON. No external requests, no runtime dependencies.
 *
 * @param branches - Branch data to bake in (one for a single-scenario export)
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

  // "Today" marker date (the generation date), drawn if within a branch's range.
  const nowDate = generatedAt.toISOString().split('T')[0];

  // Filter + render every branch (active shown initially, the rest hidden).
  const rendered: RenderedBranch[] = branches.map((b) => {
    const items = filterItems(b.items, filters);
    const model = buildRenderModel(items, zoomLevel, laneGroupBy);
    return {
      branchId: b.branchId,
      label: b.label || b.branchId,
      itemCount: items.length,
      gutterSvg: renderGutterSvg(model),
      chartSvg: renderChartSvg(model, { nowDate }),
    };
  });

  const activeBranchId = options.activeBranchId;
  const activeRendered = rendered.find((r) => r.branchId === activeBranchId)!;

  const branchViews = rendered
    .map((r) => {
      const hidden = r.branchId === activeBranchId ? '' : ' hidden';
      return `<section class="branch-view" data-branch-id="${escapeXml(r.branchId)}"${hidden}>
  <div class="timeline-frame">
    <div class="lane-gutter">${r.gutterSvg}</div>
    <div class="timeline-scroll">${r.chartSvg}</div>
  </div>
</section>`;
    })
    .join('\n');

  const switcher = renderSwitcher(rendered, activeBranchId);
  const switcherScript = rendered.length > 1 ? renderSwitcherScript() : '';

  // Build the N-branch payload (each branch's items pre-filtered).
  const payload: ExportPayload = {
    formatVersion: EXPORT_FORMAT_VERSION,
    title,
    generatedAt: generatedAt.toISOString(),
    zoomLevel,
    laneGroupBy,
    filters,
    activeBranchId,
    branches: branches.map((b) => ({
      branchId: b.branchId,
      label: b.label ?? null,
      items: filterItems(b.items, filters),
    })),
  };
  const payloadJson = escapeForScript(JSON.stringify(payload));

  const itemCount = activeRendered.itemCount;
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
  :root {
    color-scheme: light;
    --bg: #f9fafb; --panel: #ffffff; --border: #e5e7eb;
    --text: #1f2937; --muted: #6b7280; --label: #4b5563;
    --btn-bg: #f9fafb; --btn-border: #d1d5db; --btn-text: #374151; --btn-hover: #f3f4f6;
    --accent: #2563eb; --accent-text: #ffffff;
    --svg-bg: #ffffff;
    --lane-even: #e5e7eb; --lane-odd: #ffffff; --strip: #ffffff;
    --axis: #333333; --tick-minor: #999999; --milestone-label: #374151;
    --count-bg: rgba(0,0,0,0.08);
  }
  :root[data-theme="dark"] {
    color-scheme: dark;
    --bg: #0b1220; --panel: #111827; --border: #1f2937;
    --text: #e5e7eb; --muted: #9ca3af; --label: #cbd5e1;
    --btn-bg: #1f2937; --btn-border: #374151; --btn-text: #e5e7eb; --btn-hover: #374151;
    --accent: #3b82f6; --accent-text: #ffffff;
    --svg-bg: #0f172a;
    --lane-even: #1e293b; --lane-odd: #0f172a; --strip: #111827;
    --axis: #cbd5e1; --tick-minor: #64748b; --milestone-label: #e5e7eb;
    --count-bg: rgba(255,255,255,0.18);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif;
    color: var(--text); background: var(--bg);
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  header {
    display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
    padding: 16px 20px; background: var(--panel); border-bottom: 1px solid var(--border);
  }
  header h1 { margin: 0 0 4px; font-size: 18px; }
  header .meta { font-size: 12px; color: var(--muted); }
  header .meta span { margin-right: 16px; white-space: nowrap; }
  .legend { margin-top: 8px; font-size: 12px; color: var(--label); }
  .legend .swatch {
    display: inline-block; width: 10px; height: 10px; border-radius: 2px;
    margin: 0 4px 0 12px; vertical-align: middle;
  }
  .legend .swatch:first-child { margin-left: 0; }
  .theme-toggle {
    flex: none; font: inherit; font-size: 13px; padding: 6px 12px;
    border: 1px solid var(--btn-border); border-radius: 6px;
    background: var(--btn-bg); color: var(--btn-text); cursor: pointer;
  }
  .theme-toggle:hover { background: var(--btn-hover); }
  .scenario-switcher {
    display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
    padding: 12px 20px; background: var(--panel); border-bottom: 1px solid var(--border);
  }
  .scenario-switcher .switcher-label {
    font-size: 12px; font-weight: 600; color: var(--muted); margin-right: 4px;
  }
  .scenario-btn {
    font: inherit; font-size: 13px; padding: 6px 12px; border: 1px solid var(--btn-border);
    border-radius: 6px; background: var(--btn-bg); color: var(--btn-text); cursor: pointer;
  }
  .scenario-btn:hover { background: var(--btn-hover); }
  .scenario-btn.active { background: var(--accent); border-color: var(--accent); color: var(--accent-text); }
  .scenario-btn .count {
    display: inline-block; min-width: 18px; padding: 0 4px; margin-left: 4px;
    font-size: 11px; text-align: center; border-radius: 9px; background: var(--count-bg);
  }
  .scenario-btn.active .count { background: rgba(255, 255, 255, 0.25); }
  .branch-view[hidden] { display: none; }
  /* Frozen lane-label gutter + scrollable chart */
  .timeline-frame {
    display: flex; align-items: flex-start; margin: 16px 20px 40px;
    border: 1px solid var(--border); border-radius: 8px; overflow: hidden;
    background: var(--svg-bg);
  }
  .lane-gutter { flex: 0 0 auto; border-right: 1px solid var(--border); }
  .timeline-scroll { flex: 1 1 auto; min-width: 0; overflow-x: auto; overflow-y: hidden; }
  .lane-gutter svg, .timeline-scroll svg { display: block; }
  .lane-corner { fill: var(--muted); font-weight: 600; }
  .today-line { stroke: var(--accent); stroke-width: 1.5; stroke-dasharray: 4 3; opacity: 0.85; }
  .today-label { fill: var(--accent); font-weight: 600; }
  .timeline-scroll g:hover rect, .timeline-scroll g:hover polygon { opacity: 1; }
  /* Theme-able SVG chrome */
  .lane-bg-even { fill: var(--lane-even); }
  .lane-bg-odd { fill: var(--lane-odd); }
  .axis-strip { fill: var(--strip); }
  .lane-strip { fill: var(--strip); fill-opacity: 0.97; }
  .axis-line, .tick-major { stroke: var(--axis); stroke-width: 2; }
  .tick-minor { stroke: var(--tick-minor); stroke-width: 1; }
  .axis-label { fill: var(--axis); }
  .lane-label { fill: var(--label); }
  .milestone-label { fill: var(--milestone-label); }
  .empty-msg { fill: var(--muted); }
  .dep-arrow { stroke: #6b7280; stroke-width: 1.5; fill: none; opacity: 0.75; }
  footer { padding: 12px 20px 28px; font-size: 11px; color: var(--muted); }
  @media print {
    body { background: #ffffff; }
    .no-print { display: none !important; }
    .timeline-frame { overflow: visible; max-width: none; }
    .timeline-scroll { overflow: visible; }
    @page { size: landscape; margin: 1cm; }
  }
</style>
</head>
<body>
<header>
  <div class="header-main">
    <h1>${escapeXml(title)}</h1>
    <div class="meta">
      <span>Branch: <strong id="meta-branch">${escapeXml(activeLabel)}</strong></span>
      <span>Items: <strong id="meta-items">${itemCount}</strong></span>
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
  </div>
  <button type="button" id="theme-toggle" class="theme-toggle no-print" aria-label="Toggle theme">
    Theme
  </button>
</header>
${switcher}
<main>
${branchViews}
</main>
<footer>Generated by SwimLanes · self-contained, offline timeline artifact</footer>
<script type="application/json" id="swimlanes-data">
${payloadJson}
</script>
${renderThemeScript()}
${switcherScript}
</body>
</html>`;
}
