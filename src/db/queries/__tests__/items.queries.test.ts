/**
 * Unit tests for items query builders
 *
 * @module db/queries/__tests__/items.queries.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import initSqlJs, { type Database } from 'sql.js';
import { SCHEMA_STATEMENTS } from '../../schema';
import {
  getItems,
  getItemById,
  insertItem,
  updateItem,
  deleteItem,
  countItems,
  type ItemFilters,
} from '../items.queries';
import type { Item } from '@/types/database.types';

describe('Items Query Builders', () => {
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

  describe('insertItem', () => {
    it('should insert a new item', () => {
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
        tags: 'test,demo',
        source_row_hash: null,
        updated_at: new Date().toISOString(),
      };

      insertItem(db, item);

      const retrieved = getItemById(db, 'test-1', 'main');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.title).toBe('Test Task');
      expect(retrieved?.type).toBe('task');
    });

    it('should handle nullable fields', () => {
      const item: Item = {
        id: 'test-2',
        branch_id: 'main',
        type: 'milestone',
        title: 'Milestone',
        start_date: '2025-01-01',
        end_date: null,
        owner: null,
        lane: null,
        project: null,
        tags: null,
        source_row_hash: null,
        updated_at: new Date().toISOString(),
      };

      insertItem(db, item);

      const retrieved = getItemById(db, 'test-2', 'main');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.end_date).toBeNull();
      expect(retrieved?.owner).toBeNull();
    });

    it('should create history record on insert', () => {
      const item: Item = {
        id: 'test-3',
        branch_id: 'main',
        type: 'task',
        title: 'Task with History',
        start_date: '2025-01-01',
        end_date: '2025-01-15',
        owner: 'Bob',
        lane: 'Frontend',
        project: 'Project B',
        tags: 'history',
        source_row_hash: null,
        updated_at: new Date().toISOString(),
      };

      insertItem(db, item);

      // Check history was created
      const historyResult = db.exec('SELECT * FROM item_history WHERE id = ? AND branch_id = ?', [
        'test-3',
        'main',
      ]);

      expect(historyResult.length).toBeGreaterThan(0);
      expect(historyResult[0]?.values.length).toBe(1);
    });
  });

  describe('getItems', () => {
    beforeEach(() => {
      // Insert test data
      const items: Item[] = [
        {
          id: 'item-1',
          branch_id: 'main',
          type: 'task',
          title: 'Task 1',
          start_date: '2025-01-01',
          end_date: '2025-01-15',
          owner: 'Alice',
          lane: 'Backend',
          project: 'Project A',
          tags: 'urgent,backend',
          source_row_hash: null,
          updated_at: new Date().toISOString(),
        },
        {
          id: 'item-2',
          branch_id: 'main',
          type: 'milestone',
          title: 'Milestone 1',
          start_date: '2025-01-20',
          end_date: null,
          owner: 'Bob',
          lane: 'Frontend',
          project: 'Project A',
          tags: 'important',
          source_row_hash: null,
          updated_at: new Date().toISOString(),
        },
        {
          id: 'item-3',
          branch_id: 'main',
          type: 'release',
          title: 'Release 1.0',
          start_date: '2025-02-01',
          end_date: '2025-02-01',
          owner: 'Charlie',
          lane: 'DevOps',
          project: 'Project B',
          tags: 'release',
          source_row_hash: null,
          updated_at: new Date().toISOString(),
        },
        {
          id: 'item-4',
          branch_id: 'feature-x',
          type: 'task',
          title: 'Feature Task',
          start_date: '2025-01-10',
          end_date: '2025-01-20',
          owner: 'Alice',
          lane: 'Backend',
          project: 'Project A',
          tags: 'feature',
          source_row_hash: null,
          updated_at: new Date().toISOString(),
        },
      ];

      items.forEach((item) => insertItem(db, item));
    });

    it('should get all items for a branch', () => {
      const items = getItems(db, 'main');
      expect(items.length).toBe(3);
    });

    it('should filter by single type', () => {
      const filters: ItemFilters = { type: 'task' };
      const items = getItems(db, 'main', filters);
      expect(items.length).toBe(1);
      expect(items[0]?.type).toBe('task');
    });

    it('should filter by multiple types', () => {
      const filters: ItemFilters = { type: ['task', 'milestone'] };
      const items = getItems(db, 'main', filters);
      expect(items.length).toBe(2);
    });

    it('should filter by project', () => {
      const filters: ItemFilters = { project: 'Project A' };
      const items = getItems(db, 'main', filters);
      expect(items.length).toBe(2);
    });

    it('should filter by owner', () => {
      const filters: ItemFilters = { owner: 'Alice' };
      const items = getItems(db, 'main', filters);
      expect(items.length).toBe(1);
    });

    it('should filter by lane', () => {
      const filters: ItemFilters = { lane: 'Backend' };
      const items = getItems(db, 'main', filters);
      expect(items.length).toBe(1);
    });

    it('should filter by date range', () => {
      const filters: ItemFilters = {
        dateRange: { start: '2025-01-01', end: '2025-01-31' },
      };
      const items = getItems(db, 'main', filters);
      expect(items.length).toBe(2); // Task 1 and Milestone 1
    });

    it('should filter by tags', () => {
      const filters: ItemFilters = { tags: 'urgent' };
      const items = getItems(db, 'main', filters);
      expect(items.length).toBe(1);
      expect(items[0]?.tags).toContain('urgent');
    });

    it('should combine multiple filters', () => {
      const filters: ItemFilters = {
        type: 'task',
        project: 'Project A',
        owner: 'Alice',
      };
      const items = getItems(db, 'main', filters);
      expect(items.length).toBe(1);
    });

    it('should return empty array for non-existent branch', () => {
      const items = getItems(db, 'non-existent');
      expect(items.length).toBe(0);
    });
  });

  describe('getItemById', () => {
    beforeEach(() => {
      const item: Item = {
        id: 'unique-1',
        branch_id: 'main',
        type: 'task',
        title: 'Unique Task',
        start_date: '2025-01-01',
        end_date: '2025-01-15',
        owner: 'Alice',
        lane: 'Backend',
        project: 'Project A',
        tags: 'unique',
        source_row_hash: null,
        updated_at: new Date().toISOString(),
      };

      insertItem(db, item);
    });

    it('should retrieve item by id and branch', () => {
      const item = getItemById(db, 'unique-1', 'main');
      expect(item).not.toBeNull();
      expect(item?.title).toBe('Unique Task');
    });

    it('should return null for non-existent id', () => {
      const item = getItemById(db, 'non-existent', 'main');
      expect(item).toBeNull();
    });

    it('should return null for wrong branch', () => {
      const item = getItemById(db, 'unique-1', 'feature-x');
      expect(item).toBeNull();
    });
  });

  describe('updateItem', () => {
    beforeEach(() => {
      const item: Item = {
        id: 'update-1',
        branch_id: 'main',
        type: 'task',
        title: 'Original Title',
        start_date: '2025-01-01',
        end_date: '2025-01-15',
        owner: 'Alice',
        lane: 'Backend',
        project: 'Project A',
        tags: 'original',
        source_row_hash: null,
        updated_at: new Date().toISOString(),
      };

      insertItem(db, item);
    });

    it('should update item title', () => {
      const rowsUpdated = updateItem(db, 'update-1', 'main', {
        title: 'Updated Title',
      });

      expect(rowsUpdated).toBe(1);

      const item = getItemById(db, 'update-1', 'main');
      expect(item?.title).toBe('Updated Title');
    });

    it('should update multiple fields', () => {
      updateItem(db, 'update-1', 'main', {
        title: 'New Title',
        owner: 'Bob',
        end_date: '2025-02-01',
      });

      const item = getItemById(db, 'update-1', 'main');
      expect(item?.title).toBe('New Title');
      expect(item?.owner).toBe('Bob');
      expect(item?.end_date).toBe('2025-02-01');
    });

    it('should update timestamp automatically', () => {
      const before = getItemById(db, 'update-1', 'main');
      const oldTimestamp = before?.updated_at;

      // Wait a tiny bit to ensure timestamp changes
      setTimeout(() => {
        updateItem(db, 'update-1', 'main', { title: 'New Title' });

        const after = getItemById(db, 'update-1', 'main');
        expect(after?.updated_at).not.toBe(oldTimestamp);
      }, 10);
    });

    it('should create history record on update', () => {
      updateItem(db, 'update-1', 'main', { title: 'Updated' });

      const historyResult = db.exec(
        'SELECT COUNT(*) as count FROM item_history WHERE id = ? AND branch_id = ?',
        ['update-1', 'main']
      );

      const count = historyResult[0]?.values[0]?.[0] as number;
      expect(count).toBe(2); // 1 insert + 1 update
    });

    it('should return 0 for non-existent item', () => {
      const rowsUpdated = updateItem(db, 'non-existent', 'main', {
        title: 'New Title',
      });

      expect(rowsUpdated).toBe(0);
    });
  });

  describe('deleteItem', () => {
    beforeEach(() => {
      const item: Item = {
        id: 'delete-1',
        branch_id: 'main',
        type: 'task',
        title: 'To Delete',
        start_date: '2025-01-01',
        end_date: '2025-01-15',
        owner: 'Alice',
        lane: 'Backend',
        project: 'Project A',
        tags: 'delete-me',
        source_row_hash: null,
        updated_at: new Date().toISOString(),
      };

      insertItem(db, item);
    });

    it('should delete an item', () => {
      const rowsDeleted = deleteItem(db, 'delete-1', 'main');
      expect(rowsDeleted).toBe(1);

      const item = getItemById(db, 'delete-1', 'main');
      expect(item).toBeNull();
    });

    it('should preserve history after delete', () => {
      deleteItem(db, 'delete-1', 'main');

      const historyResult = db.exec('SELECT * FROM item_history WHERE id = ? AND branch_id = ?', [
        'delete-1',
        'main',
      ]);

      expect(historyResult.length).toBeGreaterThan(0);
      expect(historyResult[0]?.values.length).toBe(1); // Insert history still exists
    });

    it('should return 0 for non-existent item', () => {
      const rowsDeleted = deleteItem(db, 'non-existent', 'main');
      expect(rowsDeleted).toBe(0);
    });
  });

  describe('countItems', () => {
    beforeEach(() => {
      const items: Item[] = [
        {
          id: 'count-1',
          branch_id: 'main',
          type: 'task',
          title: 'Task 1',
          start_date: '2025-01-01',
          end_date: '2025-01-15',
          owner: 'Alice',
          lane: 'Backend',
          project: 'Project A',
          tags: 'test',
          source_row_hash: null,
          updated_at: new Date().toISOString(),
        },
        {
          id: 'count-2',
          branch_id: 'main',
          type: 'task',
          title: 'Task 2',
          start_date: '2025-01-10',
          end_date: '2025-01-20',
          owner: 'Bob',
          lane: 'Frontend',
          project: 'Project B',
          tags: 'test',
          source_row_hash: null,
          updated_at: new Date().toISOString(),
        },
        {
          id: 'count-3',
          branch_id: 'main',
          type: 'milestone',
          title: 'Milestone',
          start_date: '2025-01-15',
          end_date: null,
          owner: 'Alice',
          lane: 'Backend',
          project: 'Project A',
          tags: 'important',
          source_row_hash: null,
          updated_at: new Date().toISOString(),
        },
      ];

      items.forEach((item) => insertItem(db, item));
    });

    it('should count all items in branch', () => {
      const count = countItems(db, 'main');
      expect(count).toBe(3);
    });

    it('should count items with filters', () => {
      const count = countItems(db, 'main', { type: 'task' });
      expect(count).toBe(2);
    });

    it('should return 0 for empty branch', () => {
      const count = countItems(db, 'empty-branch');
      expect(count).toBe(0);
    });
  });
});
