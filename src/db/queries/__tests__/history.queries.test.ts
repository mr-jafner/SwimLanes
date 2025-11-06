/**
 * Unit tests for history query builders
 *
 * @module db/queries/__tests__/history.queries.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import initSqlJs, { type Database } from 'sql.js';
import { SCHEMA_STATEMENTS } from '../../schema';
import {
  getItemHistory,
  getItemVersion,
  getLatestVersion,
  compareBranches,
  getRecentHistory,
  searchHistory,
} from '../history.queries';
import { insertItem, updateItem, deleteItem } from '../items.queries';
import { createBranch } from '../branches.queries';
import type { Item } from '@/types/database.types';

describe('History Query Builders', () => {
  let db: Database;

  beforeEach(async () => {
    // Create fresh database for each test
    const SQL = await initSqlJs({
      locateFile: (file: string) => `./node_modules/sql.js/dist/${file}`,
    });

    db = new SQL.Database();

    // Initialize schema
    for (const statement of SCHEMA_STATEMENTS) {
      db.run(statement);
    }
  });

  afterEach(() => {
    if (db) {
      try {
        db.close();
      } catch {
        // Database already closed, ignore
      }
    }
  });

  describe('getItemHistory', () => {
    it('should return empty array for item with no history', () => {
      const history = getItemHistory(db, 'non-existent', 'main');
      expect(history.length).toBe(0);
    });

    it('should return history after insert', () => {
      const item: Item = {
        id: 'test-1',
        branch_id: 'main',
        type: 'task',
        title: 'Test Task',
        start_date: '2025-01-01',
        end_date: '2025-01-15',
        owner: 'Alice',
        lane: 'Backend',
        project: 'Project A',
        tags: 'test',
        source_row_hash: null,
        updated_at: new Date().toISOString(),
      };

      insertItem(db, item);

      const history = getItemHistory(db, 'test-1', 'main');
      expect(history.length).toBe(1);
      expect(history[0]?.version).toBe(1);
      expect(history[0]?.op).toBe('insert');
      expect(history[0]?.title).toBe('Test Task');
    });

    it('should track multiple versions after updates', () => {
      const item: Item = {
        id: 'test-2',
        branch_id: 'main',
        type: 'task',
        title: 'Original Title',
        start_date: '2025-01-01',
        end_date: '2025-01-15',
        owner: 'Alice',
        lane: 'Backend',
        project: 'Project A',
        tags: 'test',
        source_row_hash: null,
        updated_at: new Date().toISOString(),
      };

      insertItem(db, item);
      updateItem(db, 'test-2', 'main', { title: 'Updated Title 1' });
      updateItem(db, 'test-2', 'main', { title: 'Updated Title 2' });

      const history = getItemHistory(db, 'test-2', 'main');
      expect(history.length).toBe(3);
      expect(history[0]?.version).toBe(1);
      expect(history[0]?.op).toBe('insert');
      expect(history[1]?.version).toBe(2);
      expect(history[1]?.op).toBe('update');
      expect(history[2]?.version).toBe(3);
      expect(history[2]?.op).toBe('update');
    });

    it('should preserve history after item deletion', () => {
      const item: Item = {
        id: 'test-3',
        branch_id: 'main',
        type: 'task',
        title: 'To Delete',
        start_date: '2025-01-01',
        end_date: '2025-01-15',
        owner: 'Alice',
        lane: 'Backend',
        project: 'Project A',
        tags: 'test',
        source_row_hash: null,
        updated_at: new Date().toISOString(),
      };

      insertItem(db, item);
      deleteItem(db, 'test-3', 'main');

      const history = getItemHistory(db, 'test-3', 'main');
      expect(history.length).toBe(1); // Insert history still exists
    });
  });

  describe('getItemVersion', () => {
    beforeEach(() => {
      const item: Item = {
        id: 'version-test',
        branch_id: 'main',
        type: 'task',
        title: 'Version 1',
        start_date: '2025-01-01',
        end_date: '2025-01-15',
        owner: 'Alice',
        lane: 'Backend',
        project: 'Project A',
        tags: 'test',
        source_row_hash: null,
        updated_at: new Date().toISOString(),
      };

      insertItem(db, item);
      updateItem(db, 'version-test', 'main', { title: 'Version 2' });
      updateItem(db, 'version-test', 'main', { title: 'Version 3' });
    });

    it('should retrieve specific version', () => {
      const v2 = getItemVersion(db, 'version-test', 'main', 2);
      expect(v2).not.toBeNull();
      expect(v2?.version).toBe(2);
      expect(v2?.title).toBe('Version 2');
    });

    it('should return null for non-existent version', () => {
      const v99 = getItemVersion(db, 'version-test', 'main', 99);
      expect(v99).toBeNull();
    });
  });

  describe('getLatestVersion', () => {
    it('should return 0 for item with no history', () => {
      const version = getLatestVersion(db, 'non-existent', 'main');
      expect(version).toBe(0);
    });

    it('should return latest version number', () => {
      const item: Item = {
        id: 'latest-test',
        branch_id: 'main',
        type: 'task',
        title: 'Test',
        start_date: '2025-01-01',
        end_date: '2025-01-15',
        owner: 'Alice',
        lane: 'Backend',
        project: 'Project A',
        tags: 'test',
        source_row_hash: null,
        updated_at: new Date().toISOString(),
      };

      insertItem(db, item);
      updateItem(db, 'latest-test', 'main', { title: 'Update 1' });
      updateItem(db, 'latest-test', 'main', { title: 'Update 2' });

      const version = getLatestVersion(db, 'latest-test', 'main');
      expect(version).toBe(3);
    });
  });

  describe('compareBranches', () => {
    beforeEach(() => {
      // Create items in main branch
      const mainItems: Item[] = [
        {
          id: 'shared-1',
          branch_id: 'main',
          type: 'task',
          title: 'Shared Task',
          start_date: '2025-01-01',
          end_date: '2025-01-15',
          owner: 'Alice',
          lane: 'Backend',
          project: 'Project A',
          tags: 'shared',
          source_row_hash: null,
          updated_at: new Date().toISOString(),
        },
        {
          id: 'removed-1',
          branch_id: 'main',
          type: 'milestone',
          title: 'Will be removed',
          start_date: '2025-01-20',
          end_date: null,
          owner: 'Bob',
          lane: 'Frontend',
          project: 'Project B',
          tags: 'removed',
          source_row_hash: null,
          updated_at: new Date().toISOString(),
        },
        {
          id: 'changed-1',
          branch_id: 'main',
          type: 'task',
          title: 'Original Title',
          start_date: '2025-02-01',
          end_date: '2025-02-15',
          owner: 'Charlie',
          lane: 'DevOps',
          project: 'Project C',
          tags: 'will-change',
          source_row_hash: null,
          updated_at: new Date().toISOString(),
        },
      ];

      mainItems.forEach((item) => insertItem(db, item));

      // Create feature branch
      createBranch(db, 'main', 'feature', 'Feature Branch');

      // Remove an item from feature branch
      deleteItem(db, 'removed-1', 'feature');

      // Modify an item in feature branch
      updateItem(db, 'changed-1', 'feature', {
        title: 'Changed Title',
        owner: 'Diana',
      });

      // Add a new item to feature branch
      const newItem: Item = {
        id: 'added-1',
        branch_id: 'feature',
        type: 'release',
        title: 'New Release',
        start_date: '2025-03-01',
        end_date: '2025-03-01',
        owner: 'Eve',
        lane: 'Release',
        project: 'Project D',
        tags: 'new',
        source_row_hash: null,
        updated_at: new Date().toISOString(),
      };

      insertItem(db, newItem);
    });

    it('should identify added items', () => {
      const comparison = compareBranches(db, 'main', 'feature');

      expect(comparison.added.length).toBe(1);
      expect(comparison.added[0]?.id).toBe('added-1');
      expect(comparison.added[0]?.title).toBe('New Release');
    });

    it('should identify removed items', () => {
      const comparison = compareBranches(db, 'main', 'feature');

      expect(comparison.removed.length).toBe(1);
      expect(comparison.removed[0]?.id).toBe('removed-1');
      expect(comparison.removed[0]?.title).toBe('Will be removed');
    });

    it('should identify changed items', () => {
      const comparison = compareBranches(db, 'main', 'feature');

      expect(comparison.changed.length).toBe(1);
      expect(comparison.changed[0]?.before.title).toBe('Original Title');
      expect(comparison.changed[0]?.after.title).toBe('Changed Title');
      expect(comparison.changed[0]?.before.owner).toBe('Charlie');
      expect(comparison.changed[0]?.after.owner).toBe('Diana');
    });

    it('should identify unchanged items', () => {
      const comparison = compareBranches(db, 'main', 'feature');

      expect(comparison.unchanged.length).toBe(1);
      expect(comparison.unchanged[0]?.id).toBe('shared-1');
    });

    it('should populate diffs array', () => {
      const comparison = compareBranches(db, 'main', 'feature');

      expect(comparison.diffs.length).toBe(4); // 1 added + 1 removed + 1 changed + 1 unchanged
    });

    it('should handle identical branches', () => {
      const comparison = compareBranches(db, 'main', 'main');

      expect(comparison.added.length).toBe(0);
      expect(comparison.removed.length).toBe(0);
      expect(comparison.changed.length).toBe(0);
      expect(comparison.unchanged.length).toBe(3);
    });

    it('should handle empty branches', () => {
      createBranch(db, 'main', 'empty-1', 'Empty 1');
      createBranch(db, 'main', 'empty-2', 'Empty 2');

      // Delete all items from both branches
      db.run('DELETE FROM item WHERE branch_id = ?', ['empty-1']);
      db.run('DELETE FROM item WHERE branch_id = ?', ['empty-2']);

      const comparison = compareBranches(db, 'empty-1', 'empty-2');

      expect(comparison.added.length).toBe(0);
      expect(comparison.removed.length).toBe(0);
      expect(comparison.changed.length).toBe(0);
      expect(comparison.unchanged.length).toBe(0);
    });
  });

  describe('getRecentHistory', () => {
    beforeEach(() => {
      // Create multiple items with history
      for (let i = 1; i <= 5; i++) {
        const item: Item = {
          id: `item-${i}`,
          branch_id: 'main',
          type: 'task',
          title: `Task ${i}`,
          start_date: '2025-01-01',
          end_date: '2025-01-15',
          owner: 'Alice',
          lane: 'Backend',
          project: 'Project A',
          tags: 'test',
          source_row_hash: null,
          updated_at: new Date().toISOString(),
        };

        insertItem(db, item);
      }
    });

    it('should return recent history', () => {
      const history = getRecentHistory(db, 'main');
      expect(history.length).toBe(5);
    });

    it('should respect limit parameter', () => {
      const history = getRecentHistory(db, 'main', 3);
      expect(history.length).toBe(3);
    });

    it('should order by snapshot time (newest first)', () => {
      const item: Item = {
        id: 'newest',
        branch_id: 'main',
        type: 'task',
        title: 'Newest Task',
        start_date: '2025-01-01',
        end_date: '2025-01-15',
        owner: 'Alice',
        lane: 'Backend',
        project: 'Project A',
        tags: 'test',
        source_row_hash: null,
        updated_at: new Date().toISOString(),
      };

      insertItem(db, item);

      const history = getRecentHistory(db, 'main', 1);
      expect(history[0]?.id).toBe('newest');
    });

    it('should return empty array for branch with no history', () => {
      const history = getRecentHistory(db, 'empty-branch');
      expect(history.length).toBe(0);
    });
  });

  describe('searchHistory', () => {
    beforeEach(() => {
      const items: Item[] = [
        {
          id: 'search-1',
          branch_id: 'main',
          type: 'task',
          title: 'Implement authentication',
          start_date: '2025-01-01',
          end_date: '2025-01-15',
          owner: 'Alice',
          lane: 'Backend',
          project: 'Auth',
          tags: 'security',
          source_row_hash: null,
          updated_at: new Date().toISOString(),
        },
        {
          id: 'search-2',
          branch_id: 'main',
          type: 'task',
          title: 'Add authorization checks',
          start_date: '2025-01-10',
          end_date: '2025-01-20',
          owner: 'Bob',
          lane: 'Backend',
          project: 'Auth',
          tags: 'security',
          source_row_hash: null,
          updated_at: new Date().toISOString(),
        },
        {
          id: 'search-3',
          branch_id: 'main',
          type: 'task',
          title: 'Design UI mockups',
          start_date: '2025-01-15',
          end_date: '2025-01-25',
          owner: 'Charlie',
          lane: 'Design',
          project: 'UI',
          tags: 'design',
          source_row_hash: null,
          updated_at: new Date().toISOString(),
        },
      ];

      items.forEach((item) => insertItem(db, item));
    });

    it('should find items matching search term', () => {
      const results = searchHistory(db, 'main', 'auth');
      expect(results.length).toBe(2);
      expect(results[0]?.title).toContain('auth');
    });

    it('should be case-insensitive', () => {
      const results = searchHistory(db, 'main', 'AUTH');
      expect(results.length).toBe(2);
    });

    it('should respect limit parameter', () => {
      const results = searchHistory(db, 'main', 'auth', 1);
      expect(results.length).toBe(1);
    });

    it('should return empty array for no matches', () => {
      const results = searchHistory(db, 'main', 'nonexistent');
      expect(results.length).toBe(0);
    });
  });
});
