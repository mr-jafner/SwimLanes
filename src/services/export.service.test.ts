/**
 * Tests for the HTML timeline artifact export service.
 */

import { describe, it, expect } from 'vitest';
import {
  filterItems,
  buildRenderModel,
  renderSvg,
  escapeXml,
  generateTimelineArtifact,
  EXPORT_FORMAT_VERSION,
} from './export.service';
import type { Item } from '../types/database.types';
import type { ExportBranchInput, ExportPayload } from '../types/export.types';

/**
 * Builds a minimal valid Item with sensible defaults. Uses a spread so that
 * explicit `null` overrides (e.g. a milestone's end_date) are respected.
 */
function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'i1',
    branch_id: 'main',
    type: 'task',
    title: 'Task One',
    start_date: '2025-01-01',
    end_date: '2025-01-31',
    owner: 'Alice',
    lane: 'Backend',
    project: 'Auth',
    tags: null,
    dependencies: null,
    source_id: null,
    source_row_hash: null,
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

const SAMPLE_ITEMS: Item[] = [
  makeItem({ id: 'a', title: 'Design', type: 'task', project: 'Auth', lane: 'UX' }),
  makeItem({
    id: 'b',
    title: 'Launch',
    type: 'milestone',
    start_date: '2025-02-15',
    end_date: null,
    project: 'Auth',
    lane: 'Release',
  }),
  makeItem({
    id: 'c',
    title: 'API work',
    type: 'task',
    start_date: '2025-01-10',
    end_date: '2025-03-01',
    project: 'Payments',
    lane: 'Backend',
  }),
];

describe('export.service', () => {
  describe('filterItems', () => {
    it('returns all items when no filters are given', () => {
      expect(filterItems(SAMPLE_ITEMS)).toHaveLength(3);
    });

    it('filters by exact type', () => {
      const result = filterItems(SAMPLE_ITEMS, { type: 'milestone' });
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('b');
    });

    it('filters by project with partial, case-insensitive match', () => {
      const result = filterItems(SAMPLE_ITEMS, { project: 'pay' });
      expect(result.map((i) => i.id)).toEqual(['c']);
    });

    it('filters by start date (item must end on or after)', () => {
      const result = filterItems(SAMPLE_ITEMS, { startDate: '2025-02-01' });
      // 'a' ends 2025-01-31 -> excluded; 'b' milestone (no end) kept; 'c' ends 03-01 kept
      expect(result.map((i) => i.id).sort()).toEqual(['b', 'c']);
    });

    it('filters by end date (item must start on or before)', () => {
      const result = filterItems(SAMPLE_ITEMS, { endDate: '2025-01-05' });
      // only 'a' starts 2025-01-01 <= 2025-01-05
      expect(result.map((i) => i.id)).toEqual(['a']);
    });
  });

  describe('escapeXml', () => {
    it('escapes the five XML metacharacters', () => {
      expect(escapeXml(`<a href="x" id='y'>& </a>`)).toBe(
        '&lt;a href=&quot;x&quot; id=&#39;y&#39;&gt;&amp; &lt;/a&gt;'
      );
    });
  });

  describe('buildRenderModel', () => {
    it('computes lane groups, date range, and positive SVG dimensions', () => {
      const model = buildRenderModel(SAMPLE_ITEMS, 'month', 'lane');
      expect(model.dateRange.minDate).toBe('2025-01-01');
      expect(model.dateRange.maxDate).toBe('2025-03-01');
      expect(model.laneGroups.length).toBeGreaterThan(0);
      expect(model.svgWidth).toBeGreaterThan(0);
      expect(model.svgHeight).toBeGreaterThan(model.config.margin.top);
    });

    it('groups by the requested strategy', () => {
      const byType = buildRenderModel(SAMPLE_ITEMS, 'month', 'type');
      const names = byType.laneGroups.map((l) => l.laneName).sort();
      expect(names).toEqual(['milestone', 'task']);
    });

    it('handles an empty item list without throwing', () => {
      const model = buildRenderModel([], 'month', 'lane');
      expect(model.laneGroups).toHaveLength(0);
      expect(model.dateRange.minDate).toBeNull();
    });
  });

  describe('renderSvg', () => {
    it('produces an svg root element with matching dimensions', () => {
      const model = buildRenderModel(SAMPLE_ITEMS, 'month', 'lane');
      const svg = renderSvg(model);
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
      expect(svg).toContain(`width="${model.svgWidth}"`);
    });

    it('renders milestones as polygons (diamonds) and tasks as rects', () => {
      const model = buildRenderModel(SAMPLE_ITEMS, 'month', 'lane');
      const svg = renderSvg(model);
      expect(svg).toContain('<polygon');
      expect(svg).toContain('<rect');
    });

    it('renders an empty-state message when there are no dated items', () => {
      const model = buildRenderModel([], 'month', 'lane');
      const svg = renderSvg(model);
      expect(svg).toContain('No dated items to display');
    });

    it('escapes item titles to prevent markup injection', () => {
      const evil = [makeItem({ id: 'x', title: '<script>alert(1)</script>', type: 'milestone' })];
      const model = buildRenderModel(evil, 'month', 'lane');
      const svg = renderSvg(model);
      expect(svg).not.toContain('<script>alert(1)</script>');
      expect(svg).toContain('&lt;script&gt;');
    });
  });

  describe('generateTimelineArtifact', () => {
    const branches: ExportBranchInput[] = [
      { branchId: 'main', label: 'Main', items: SAMPLE_ITEMS },
    ];

    it('produces a self-contained HTML document with inlined svg and data', () => {
      const html = generateTimelineArtifact(branches, { activeBranchId: 'main' });
      expect(html.startsWith('<!doctype html>')).toBe(true);
      expect(html).toContain('<svg');
      expect(html).toContain('id="swimlanes-data"');
      // No external/network resource references. (The SVG xmlns namespace URI is
      // an identifier, not something the browser fetches, so it's allowed.)
      expect(html).not.toMatch(/src=["']https?:/);
      expect(html).not.toMatch(/href=["']https?:/);
      expect(html).not.toMatch(/url\(https?:/);
      expect(html).not.toContain('<script src');
      expect(html).not.toContain('cdnjs');
    });

    it('embeds a parseable payload structured for N branches', () => {
      const html = generateTimelineArtifact(branches, {
        activeBranchId: 'main',
        zoomLevel: 'month',
        laneGroupBy: 'project',
      });
      const match = html.match(
        /<script type="application\/json" id="swimlanes-data">\s*([\s\S]*?)\s*<\/script>/
      );
      expect(match).not.toBeNull();
      const payload = JSON.parse(match![1]!) as ExportPayload;
      expect(payload.formatVersion).toBe(EXPORT_FORMAT_VERSION);
      expect(payload.activeBranchId).toBe('main');
      expect(payload.branches).toHaveLength(1);
      expect(payload.branches[0]?.items).toHaveLength(3);
      expect(payload.laneGroupBy).toBe('project');
    });

    it('applies filters to the rendered branch and the embedded payload', () => {
      const html = generateTimelineArtifact(branches, {
        activeBranchId: 'main',
        filters: { type: 'milestone' },
      });
      const match = html.match(
        /<script type="application\/json" id="swimlanes-data">\s*([\s\S]*?)\s*<\/script>/
      );
      const payload = JSON.parse(match![1]!) as ExportPayload;
      expect(payload.branches[0]?.items).toHaveLength(1);
      expect(payload.branches[0]?.items[0]?.type).toBe('milestone');
    });

    it('neutralizes a </script> sequence inside embedded data', () => {
      const tricky: ExportBranchInput[] = [
        {
          branchId: 'main',
          label: 'Main',
          items: [makeItem({ id: 'evil', title: 'pwn </script><script>bad()</script>' })],
        },
      ];
      const html = generateTimelineArtifact(tricky, { activeBranchId: 'main' });
      // The data script block must not be broken open by the payload contents.
      const dataBlock = html.split('id="swimlanes-data">')[1] ?? '';
      expect(dataBlock).not.toContain('</script><script>bad()');
    });

    it('throws when the active branch is missing', () => {
      expect(() =>
        generateTimelineArtifact(branches, { activeBranchId: 'does-not-exist' })
      ).toThrow(/not found/);
    });

    it('uses the branch label and generation time in the header', () => {
      const when = new Date('2026-06-25T12:00:00Z');
      const html = generateTimelineArtifact(branches, {
        activeBranchId: 'main',
        generatedAt: when,
      });
      expect(html).toContain('Main');
      expect(html).toContain('SwimLanes Timeline');
    });
  });
});
