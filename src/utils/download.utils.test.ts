/**
 * Tests for browser download utilities.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildArtifactFilename, downloadTextFile } from './download.utils';

describe('download.utils', () => {
  describe('buildArtifactFilename', () => {
    it('slugifies the label and appends the ISO date and extension', () => {
      const name = buildArtifactFilename('Main Plan', new Date('2026-06-25T12:00:00Z'));
      expect(name).toBe('swimlanes-main-plan-2026-06-25.html');
    });

    it('collapses runs of non-alphanumerics and trims edge dashes', () => {
      const name = buildArtifactFilename('  Q1 // Stretch!! ', new Date('2026-01-02T00:00:00Z'));
      expect(name).toBe('swimlanes-q1-stretch-2026-01-02.html');
    });

    it('falls back to "timeline" when the label has no usable characters', () => {
      const name = buildArtifactFilename('!!!', new Date('2026-01-02T00:00:00Z'));
      expect(name).toBe('swimlanes-timeline-2026-01-02.html');
    });

    it('honors a custom extension', () => {
      const name = buildArtifactFilename('main', new Date('2026-01-02T00:00:00Z'), 'svg');
      expect(name.endsWith('.svg')).toBe(true);
    });
  });

  describe('downloadTextFile', () => {
    beforeEach(() => {
      // jsdom lacks object URL APIs; stub them.
      (URL as unknown as { createObjectURL: () => string }).createObjectURL = vi.fn(
        () => 'blob:mock'
      );
      (URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('creates an anchor, clicks it, and revokes the object URL', () => {
      const clickSpy = vi.fn();
      const realCreate = document.createElement.bind(document);
      const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = realCreate(tag);
        if (tag === 'a') el.click = clickSpy;
        return el;
      });

      downloadTextFile('test.html', '<html></html>');

      expect(URL.createObjectURL).toHaveBeenCalledOnce();
      expect(clickSpy).toHaveBeenCalledOnce();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');

      createSpy.mockRestore();
    });
  });
});
