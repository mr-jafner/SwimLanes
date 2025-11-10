/**
 * Integration tests for import service
 *
 * Tests the full import workflow end-to-end with real database operations
 *
 * NOTE: These tests are currently skipped in CI due to sql.js WASM loading issues
 * in Node.js environment. They can be enabled for local testing.
 *
 * TODO: Configure proper WASM loading or use browser-based testing for integration tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { databaseService } from '../database.service';
import { importService, performDryRun, commitImport } from '../import.service';
import type { ParsedRow, ColumnMapping } from '@/types/import.types';
import { getItems } from '@/db/queries/items.queries';

/**
 * Mock IndexedDB for Node.js test environment
 */
const mockIndexedDB = () => {
  const store = new Map<string, Uint8Array>();

  const mockIDB = {
    open: vi.fn(() => {
      const request = {
        result: {
          objectStoreNames: { contains: () => true },
          transaction: () => ({
            objectStore: () => ({
              get: (key: string) => {
                const req = {
                  result: store.get(key),
                  onsuccess: null as (() => void) | null,
                  onerror: null,
                };
                setTimeout(() => req.onsuccess?.(), 0);
                return req;
              },
              put: (value: Uint8Array, key: string) => {
                store.set(key, value);
                const req = { onsuccess: null as (() => void) | null, onerror: null };
                setTimeout(() => req.onsuccess?.(), 0);
                return req;
              },
            }),
          }),
          createObjectStore: vi.fn(),
        },
        onsuccess: null as (() => void) | null,
        onerror: null as (() => void) | null,
        onupgradeneeded: null as (() => void) | null,
      };

      setTimeout(() => {
        if (request.onupgradeneeded) request.onupgradeneeded();
        if (request.onsuccess) request.onsuccess();
      }, 0);

      return request;
    }),
    deleteDatabase: vi.fn(),
  };

  // @ts-expect-error - Mocking global indexedDB
  window.indexedDB = mockIDB;

  return { store, mockIDB };
};

describe.skip('Import Service Integration Tests', () => {
  beforeEach(async () => {
    // Mock IndexedDB for Node.js environment
    mockIndexedDB();

    // Initialize the singleton database service
    // Note: In CI, this uses CDN. Tests may be slow but should work.
    await databaseService.initialize();
  });

  afterEach(() => {
    databaseService.close();
  });

  describe('Full Import Workflow', () => {
    it('should complete full import workflow: parse → dry-run → commit', async () => {
      const db = databaseService.getDatabase();
      expect(db).toBeDefined();

      // Sample CSV data
      const csvData: ParsedRow[] = [
        {
          'Issue Key': 'PROJ-1',
          Summary: 'Implement login',
          'Issue Type': 'Task',
          Assignee: 'Alice',
          Created: '1/15/2025',
          'Due Date': '1/20/2025',
          Labels: 'backend,security',
        },
        {
          'Issue Key': 'PROJ-2',
          Summary: 'Design dashboard',
          'Issue Type': 'Task',
          Assignee: 'Bob',
          Created: '1/16/2025',
          'Due Date': '1/22/2025',
          Labels: 'frontend,ui',
        },
      ];

      // Auto-detect mapping
      const headers = Object.keys(csvData[0]!);
      const detectedMapping = importService.autoDetectMapping(headers);

      expect(detectedMapping.title).toBe('Summary');
      expect(detectedMapping.type).toBe('Issue Type');
      expect(detectedMapping.id).toBe('Issue Key');

      // Create full mapping
      const mapping: ColumnMapping = {
        title: detectedMapping.title!,
        type: detectedMapping.type!,
        start_date: detectedMapping.start_date!,
        end_date: detectedMapping.end_date!,
        owner: detectedMapping.owner!,
        lane: '',
        project: '',
        tags: detectedMapping.tags!,
        id: detectedMapping.id!,
        idStrategy: 'column',
        tagsDelimiter: ',',
      };

      // Perform dry-run
      const dryRunResult = performDryRun(csvData, mapping, 'main', 'upsert');

      expect(dryRunResult.added.length).toBe(2);
      expect(dryRunResult.updated.length).toBe(0);
      expect(dryRunResult.skipped.length).toBe(0);
      expect(dryRunResult.conflicts.length).toBe(0);

      // Verify item details
      expect(dryRunResult.added[0]!.item.title).toBe('Implement login');
      expect(dryRunResult.added[0]!.item.type).toBe('task');
      expect(dryRunResult.added[0]!.item.owner).toBe('Alice');
      expect(dryRunResult.added[0]!.item.start_date).toBe('2025-01-15');
      expect(dryRunResult.added[0]!.item.tags).toBe('backend, security');

      // Commit import
      const commitResult = await commitImport(dryRunResult, 'main');

      expect(commitResult.addedCount).toBe(2);
      expect(commitResult.updatedCount).toBe(0);

      // Verify items in database
      const items = getItems(db!, 'main');
      expect(items.length).toBe(2);
      expect(items[0]!.title).toBe('Implement login');
      expect(items[1]!.title).toBe('Design dashboard');
    });

    it('should detect and update changed items on re-import', async () => {
      const db = databaseService.getDatabase();

      // Initial import
      const initialData: ParsedRow[] = [
        {
          ID: 'ITEM-1',
          Title: 'Original Title',
          Type: 'Task',
          Start: '1/15/2025',
          End: '1/20/2025',
        },
      ];

      const mapping: ColumnMapping = {
        title: 'Title',
        type: 'Type',
        start_date: 'Start',
        end_date: 'End',
        owner: '',
        lane: '',
        project: '',
        tags: '',
        id: 'ID',
        idStrategy: 'column',
        tagsDelimiter: ',',
      };

      const firstDryRun = performDryRun(initialData, mapping, 'main', 'upsert');
      await commitImport(firstDryRun, 'main');

      expect(getItems(db!, 'main').length).toBe(1);

      // Re-import with changes
      const updatedData: ParsedRow[] = [
        {
          ID: 'ITEM-1',
          Title: 'Updated Title',
          Type: 'Task',
          Start: '1/15/2025',
          End: '1/25/2025', // Changed date
        },
      ];

      const secondDryRun = performDryRun(updatedData, mapping, 'main', 'upsert');

      expect(secondDryRun.added.length).toBe(0);
      expect(secondDryRun.updated.length).toBe(1);
      expect(secondDryRun.skipped.length).toBe(0);

      expect(secondDryRun.updated[0]!.item.title).toBe('Updated Title');
      expect(secondDryRun.updated[0]!.item.end_date).toBe('2025-01-25');

      await commitImport(secondDryRun, 'main');

      const items = getItems(db!, 'main');
      expect(items.length).toBe(1);
      expect(items[0]!.title).toBe('Updated Title');
      expect(items[0]!.end_date).toBe('2025-01-25');
    });

    it('should skip unchanged items on re-import', async () => {
      const data: ParsedRow[] = [
        {
          ID: 'ITEM-1',
          Title: 'Unchanged Item',
          Type: 'Task',
          Start: '1/15/2025',
        },
      ];

      const mapping: ColumnMapping = {
        title: 'Title',
        type: 'Type',
        start_date: 'Start',
        end_date: '',
        owner: '',
        lane: '',
        project: '',
        tags: '',
        id: 'ID',
        idStrategy: 'column',
        tagsDelimiter: ',',
      };

      // First import
      const firstDryRun = performDryRun(data, mapping, 'main', 'upsert');
      await commitImport(firstDryRun, 'main');

      // Re-import same data
      const secondDryRun = performDryRun(data, mapping, 'main', 'upsert');

      expect(secondDryRun.added.length).toBe(0);
      expect(secondDryRun.updated.length).toBe(0);
      expect(secondDryRun.skipped.length).toBe(1);
      expect(secondDryRun.skipped[0]!.reason).toContain('No changes detected');
    });

    it('should handle update-only mode correctly', async () => {
      // Initial import
      const initialData: ParsedRow[] = [{ ID: 'ITEM-1', Title: 'Existing Item', Type: 'Task' }];

      const mapping: ColumnMapping = {
        title: 'Title',
        type: 'Type',
        start_date: '',
        end_date: '',
        owner: '',
        lane: '',
        project: '',
        tags: '',
        id: 'ID',
        idStrategy: 'column',
        tagsDelimiter: ',',
      };

      const firstDryRun = performDryRun(initialData, mapping, 'main', 'upsert');
      await commitImport(firstDryRun, 'main');

      // Try to import with update-only mode (includes new item)
      const newData: ParsedRow[] = [
        { ID: 'ITEM-1', Title: 'Updated Item', Type: 'Task' },
        { ID: 'ITEM-2', Title: 'New Item', Type: 'Task' },
      ];

      const dryRun = performDryRun(newData, mapping, 'main', 'update-only');

      expect(dryRun.added.length).toBe(0);
      expect(dryRun.updated.length).toBe(1);
      expect(dryRun.skipped.length).toBe(1);
      expect(dryRun.skipped[0]!.reason).toContain('update-only mode');
    });

    it('should detect conflicts in import data (duplicate IDs)', () => {
      const data: ParsedRow[] = [
        { ID: 'ITEM-1', Title: 'First Item', Type: 'Task' },
        { ID: 'ITEM-2', Title: 'Second Item', Type: 'Task' },
        { ID: 'ITEM-1', Title: 'Duplicate Item', Type: 'Task' }, // Conflict!
      ];

      const mapping: ColumnMapping = {
        title: 'Title',
        type: 'Type',
        start_date: '',
        end_date: '',
        owner: '',
        lane: '',
        project: '',
        tags: '',
        id: 'ID',
        idStrategy: 'column',
        tagsDelimiter: ',',
      };

      const dryRun = performDryRun(data, mapping, 'main', 'upsert');

      expect(dryRun.added.length).toBe(2);
      expect(dryRun.conflicts.length).toBe(1);
      expect(dryRun.conflicts[0]!.reason).toContain('Duplicate ID');
      expect(dryRun.conflicts[0]!.rowIndex).toBe(2);
    });

    it('should detect conflicts with match strategy (duplicate project+title)', () => {
      const data: ParsedRow[] = [
        { Title: 'Task 1', Type: 'Task', Project: 'ProjectA' },
        { Title: 'Task 2', Type: 'Task', Project: 'ProjectA' },
        { Title: 'Task 1', Type: 'Task', Project: 'ProjectA' }, // Conflict!
      ];

      const mapping: ColumnMapping = {
        title: 'Title',
        type: 'Type',
        start_date: '',
        end_date: '',
        owner: '',
        lane: '',
        project: 'Project',
        tags: '',
        id: '',
        idStrategy: 'match',
        tagsDelimiter: ',',
      };

      const dryRun = performDryRun(data, mapping, 'main', 'upsert');

      expect(dryRun.added.length).toBe(2);
      expect(dryRun.conflicts.length).toBe(1);
      expect(dryRun.conflicts[0]!.reason).toContain('project+title');
    });

    it('should handle validation errors correctly', () => {
      const data: ParsedRow[] = [
        { Title: 'Valid Task', Type: 'Task' },
        { Title: '', Type: 'Task' }, // Missing title
        { Title: 'Another Task', Type: 'InvalidType' }, // Invalid type
        { Title: 'Date Error', Type: 'Task', Start: 'invalid-date' },
      ];

      const mapping: ColumnMapping = {
        title: 'Title',
        type: 'Type',
        start_date: 'Start',
        end_date: '',
        owner: '',
        lane: '',
        project: '',
        tags: '',
        id: '',
        idStrategy: 'generate',
        tagsDelimiter: ',',
      };

      const dryRun = performDryRun(data, mapping, 'main', 'upsert');

      expect(dryRun.added.length).toBe(1);
      expect(dryRun.skipped.length).toBe(3);
      expect(dryRun.skipped[0]!.reason).toContain('Title is required');
      expect(dryRun.skipped[1]!.reason).toContain('Invalid type');
      expect(dryRun.skipped[2]!.reason).toContain('Invalid');
    });

    it('should work with all three ID strategies', async () => {
      const db = databaseService.getDatabase();

      const data: ParsedRow[] = [{ Title: 'Task 1', Type: 'Task', Project: 'Proj' }];

      // Test 'generate' strategy
      const generateMapping: ColumnMapping = {
        title: 'Title',
        type: 'Type',
        start_date: '',
        end_date: '',
        owner: '',
        lane: '',
        project: 'Project',
        tags: '',
        id: '',
        idStrategy: 'generate',
        tagsDelimiter: ',',
      };

      const generateResult = performDryRun(data, generateMapping, 'main', 'upsert');
      expect(generateResult.added[0]!.item.id).toMatch(/^[0-9a-f-]{36}$/); // UUID format

      await commitImport(generateResult, 'main');

      // Test 'column' strategy on different branch
      const columnData: ParsedRow[] = [{ Title: 'Task 2', Type: 'Task', ID: 'CUSTOM-123' }];

      const columnMapping: ColumnMapping = {
        title: 'Title',
        type: 'Type',
        start_date: '',
        end_date: '',
        owner: '',
        lane: '',
        project: '',
        tags: '',
        id: 'ID',
        idStrategy: 'column',
        tagsDelimiter: ',',
      };

      const columnResult = performDryRun(columnData, columnMapping, 'main', 'upsert');
      expect(columnResult.added[0]!.item.id).toBe('CUSTOM-123');

      await commitImport(columnResult, 'main');

      // Test 'match' strategy - should update first item
      const matchMapping: ColumnMapping = {
        title: 'Title',
        type: 'Type',
        start_date: '',
        end_date: '',
        owner: '',
        lane: '',
        project: 'Project',
        tags: '',
        id: '',
        idStrategy: 'match',
        tagsDelimiter: ',',
      };

      const matchData: ParsedRow[] = [
        { Title: 'Task 1', Type: 'Task', Project: 'Proj' }, // Should match first item
      ];

      const matchResult = performDryRun(matchData, matchMapping, 'main', 'upsert');
      expect(matchResult.updated.length).toBe(1); // Should detect existing item

      const items = getItems(db!, 'main');
      expect(items.length).toBe(2);
    });
  });

  describe('Profile Management', () => {
    it('should save and load import profiles', () => {
      const mapping: ColumnMapping = {
        title: 'Summary',
        type: 'Issue Type',
        start_date: 'Created',
        end_date: 'Due Date',
        owner: 'Assignee',
        lane: 'Status',
        project: 'Project',
        tags: 'Labels',
        id: 'Issue Key',
        idStrategy: 'column',
        tagsDelimiter: ',',
      };

      const saved = importService.saveProfile('Jira Standard', mapping);
      expect(saved).toBe(true);

      const loaded = importService.getProfile('Jira Standard');
      expect(loaded).toBeDefined();
      expect(loaded!.mapping.title).toBe('Summary');
      expect(loaded!.mapping.idStrategy).toBe('column');
    });

    it('should list all profiles', () => {
      importService.saveProfile('Profile 1', {
        title: 'Title',
        type: 'Type',
        start_date: '',
        end_date: '',
        owner: '',
        lane: '',
        project: '',
        tags: '',
        id: '',
        idStrategy: 'generate',
        tagsDelimiter: ',',
      });

      importService.saveProfile('Profile 2', {
        title: 'Name',
        type: 'Kind',
        start_date: '',
        end_date: '',
        owner: '',
        lane: '',
        project: '',
        tags: '',
        id: '',
        idStrategy: 'generate',
        tagsDelimiter: ',',
      });

      const profiles = importService.getAllProfiles();
      expect(profiles.length).toBeGreaterThanOrEqual(2);
    });

    it('should delete profiles', async () => {
      await importService.saveProfile('To Delete', {
        title: 'Title',
        type: 'Type',
        start_date: '',
        end_date: '',
        owner: '',
        lane: '',
        project: '',
        tags: '',
        id: '',
        idStrategy: 'generate',
        tagsDelimiter: ',',
      });

      expect(importService.profileExists('To Delete')).toBe(true);

      const deleted = await importService.deleteProfile('To Delete');
      expect(deleted).toBe(true);
      expect(importService.profileExists('To Delete')).toBe(false);
    });
  });
});
