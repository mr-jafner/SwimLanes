/**
 * Unit tests for branches query builders
 *
 * @module db/queries/__tests__/branches.queries.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import initSqlJs, { type Database } from 'sql.js';
import { SCHEMA_STATEMENTS } from '../../schema';
import {
  getBranches,
  getBranchById,
  createBranch,
  deleteBranch,
  updateBranch,
  getItemCountForBranch,
} from '../branches.queries';
import { insertItem } from '../items.queries';
import type { Item } from '@/types/database.types';

describe('Branches Query Builders', () => {
  let db: Database;

  beforeEach(async () => {
    // Create fresh database for each test
    const SQL = await initSqlJs({
      locateFile: (file: string) => `./node_modules/sql.js/dist/${file}`,
    });

    db = new SQL.Database();

    // Initialize schema (includes 'main' branch)
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

  describe('getBranches', () => {
    it('should get all branches including main', () => {
      const branches = getBranches(db);
      expect(branches.length).toBe(1);
      expect(branches[0]?.branch_id).toBe('main');
    });

    it('should return multiple branches when created', () => {
      createBranch(db, 'main', 'feature-1', 'Feature 1', 'Test feature');
      createBranch(db, 'main', 'feature-2', 'Feature 2', 'Another test');

      const branches = getBranches(db);
      expect(branches.length).toBe(3);
    });

    it('should include created_at timestamps for ordering', () => {
      createBranch(db, 'main', 'branch-1', 'Branch 1');
      createBranch(db, 'main', 'branch-2', 'Branch 2');

      const branches = getBranches(db);

      // Verify all branches have created_at timestamps
      expect(branches.length).toBe(3);
      branches.forEach((branch) => {
        expect(branch.created_at).toBeDefined();
        expect(branch.created_at).toBeTruthy();
      });
    });
  });

  describe('getBranchById', () => {
    it('should get main branch', () => {
      const branch = getBranchById(db, 'main');
      expect(branch).not.toBeNull();
      expect(branch?.branch_id).toBe('main');
      expect(branch?.label).toBe('Main Branch');
    });

    it('should get created branch', () => {
      createBranch(db, 'main', 'test-branch', 'Test Branch', 'Test note');

      const branch = getBranchById(db, 'test-branch');
      expect(branch).not.toBeNull();
      expect(branch?.label).toBe('Test Branch');
      expect(branch?.created_from).toBe('main');
      expect(branch?.note).toBe('Test note');
    });

    it('should return null for non-existent branch', () => {
      const branch = getBranchById(db, 'non-existent');
      expect(branch).toBeNull();
    });
  });

  describe('createBranch', () => {
    beforeEach(() => {
      // Add some items to main branch
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
          tags: 'test',
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
          project: 'Project B',
          tags: 'important',
          source_row_hash: null,
          updated_at: new Date().toISOString(),
        },
      ];

      items.forEach((item) => insertItem(db, item));
    });

    it('should create a new branch', () => {
      createBranch(db, 'main', 'new-branch', 'New Branch', 'Testing');

      const branch = getBranchById(db, 'new-branch');
      expect(branch).not.toBeNull();
      expect(branch?.label).toBe('New Branch');
      expect(branch?.created_from).toBe('main');
      expect(branch?.note).toBe('Testing');
    });

    it('should copy all items from source branch', () => {
      createBranch(db, 'main', 'copy-branch', 'Copy Branch');

      const itemCount = getItemCountForBranch(db, 'copy-branch');
      expect(itemCount).toBe(2); // Should have copied both items
    });

    it('should allow creating branch without note', () => {
      createBranch(db, 'main', 'no-note', 'No Note Branch');

      const branch = getBranchById(db, 'no-note');
      expect(branch).not.toBeNull();
      expect(branch?.note).toBeNull();
    });

    it('should throw error if source branch does not exist', () => {
      expect(() => {
        createBranch(db, 'non-existent', 'new-branch', 'New Branch');
      }).toThrow("Source branch 'non-existent' does not exist");
    });

    it('should throw error if target branch already exists', () => {
      createBranch(db, 'main', 'duplicate', 'Duplicate Branch');

      expect(() => {
        createBranch(db, 'main', 'duplicate', 'Duplicate Again');
      }).toThrow("Branch 'duplicate' already exists");
    });

    it('should allow branching from non-main branch', () => {
      createBranch(db, 'main', 'feature-1', 'Feature 1');
      createBranch(db, 'feature-1', 'feature-1-1', 'Sub-feature');

      const branch = getBranchById(db, 'feature-1-1');
      expect(branch).not.toBeNull();
      expect(branch?.created_from).toBe('feature-1');
    });
  });

  describe('deleteBranch', () => {
    beforeEach(() => {
      createBranch(db, 'main', 'to-delete', 'To Delete');

      // Add an item to the branch
      const item: Item = {
        id: 'item-1',
        branch_id: 'to-delete',
        type: 'task',
        title: 'Task in branch',
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
    });

    it('should delete a branch and its items', () => {
      deleteBranch(db, 'to-delete');

      const branch = getBranchById(db, 'to-delete');
      expect(branch).toBeNull();

      const itemCount = getItemCountForBranch(db, 'to-delete');
      expect(itemCount).toBe(0);
    });

    it('should throw error when deleting main branch', () => {
      expect(() => {
        deleteBranch(db, 'main');
      }).toThrow("Cannot delete 'main' branch");
    });

    it('should throw error when deleting non-existent branch', () => {
      expect(() => {
        deleteBranch(db, 'non-existent');
      }).toThrow("Branch 'non-existent' does not exist");
    });
  });

  describe('updateBranch', () => {
    beforeEach(() => {
      createBranch(db, 'main', 'update-test', 'Original Label', 'Original note');
    });

    it('should update branch label', () => {
      const rowsUpdated = updateBranch(db, 'update-test', {
        label: 'Updated Label',
      });

      expect(rowsUpdated).toBe(1);

      const branch = getBranchById(db, 'update-test');
      expect(branch?.label).toBe('Updated Label');
      expect(branch?.note).toBe('Original note'); // Should remain unchanged
    });

    it('should update branch note', () => {
      updateBranch(db, 'update-test', {
        note: 'Updated note',
      });

      const branch = getBranchById(db, 'update-test');
      expect(branch?.note).toBe('Updated note');
      expect(branch?.label).toBe('Original Label'); // Should remain unchanged
    });

    it('should update both label and note', () => {
      updateBranch(db, 'update-test', {
        label: 'New Label',
        note: 'New note',
      });

      const branch = getBranchById(db, 'update-test');
      expect(branch?.label).toBe('New Label');
      expect(branch?.note).toBe('New note');
    });

    it('should return 0 for non-existent branch', () => {
      const rowsUpdated = updateBranch(db, 'non-existent', {
        label: 'New Label',
      });

      expect(rowsUpdated).toBe(0);
    });

    it('should return 0 when no updates provided', () => {
      const rowsUpdated = updateBranch(db, 'update-test', {});
      expect(rowsUpdated).toBe(0);
    });
  });

  describe('getItemCountForBranch', () => {
    beforeEach(() => {
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
          tags: 'test',
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
          project: 'Project B',
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
          project: 'Project C',
          tags: 'release',
          source_row_hash: null,
          updated_at: new Date().toISOString(),
        },
      ];

      items.forEach((item) => insertItem(db, item));
    });

    it('should count items in main branch', () => {
      const count = getItemCountForBranch(db, 'main');
      expect(count).toBe(3);
    });

    it('should return 0 for empty branch', () => {
      createBranch(db, 'main', 'empty-branch', 'Empty');

      // Delete all items from this branch
      db.run('DELETE FROM item WHERE branch_id = ?', ['empty-branch']);

      const count = getItemCountForBranch(db, 'empty-branch');
      expect(count).toBe(0);
    });

    it('should return 0 for non-existent branch', () => {
      const count = getItemCountForBranch(db, 'non-existent');
      expect(count).toBe(0);
    });
  });
});
