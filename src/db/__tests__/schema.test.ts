/**
 * Schema validation tests for SwimLanes database
 *
 * These tests verify that all schema DDL statements from the prototype
 * have been correctly migrated to TypeScript and execute properly.
 *
 * Tests validate Issue #12 acceptance criteria:
 * - All tables create successfully
 * - Triggers fire correctly
 * - Indexes are created
 * - Schema version tracking works
 *
 * @module db/__tests__/schema.test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import initSqlJs, { type Database } from 'sql.js';
import { SCHEMA_STATEMENTS, CURRENT_SCHEMA_VERSION } from '../schema';

describe('Schema Migration Validation (Issue #12)', () => {
  let db: Database;

  beforeAll(async () => {
    // Load sql.js
    const SQL = await initSqlJs({
      locateFile: (file: string) => `./node_modules/sql.js/dist/${file}`,
    });

    // Create fresh database
    db = new SQL.Database();

    // Execute all schema statements
    for (const statement of SCHEMA_STATEMENTS) {
      db.run(statement);
    }
  });

  afterAll(() => {
    if (db) {
      db.close();
    }
  });

  describe('Table Creation', () => {
    it('should create all 6 required tables', () => {
      const result = db.exec(`
        SELECT name FROM sqlite_master
        WHERE type='table'
        ORDER BY name
      `);

      expect(result.length).toBeGreaterThan(0);
      const tables = result[0]?.values.map((row) => row[0] as string) ?? [];

      expect(tables).toContain('_schema_version');
      expect(tables).toContain('app_params');
      expect(tables).toContain('branches');
      expect(tables).toContain('import_profiles');
      expect(tables).toContain('item');
      expect(tables).toContain('item_history');
      expect(tables.length).toBe(6);
    });

    it('should create item table with composite primary key', () => {
      const result = db.exec(`
        SELECT sql FROM sqlite_master
        WHERE type='table' AND name='item'
      `);

      const sql = result[0]?.values[0]?.[0] as string;
      expect(sql).toContain('PRIMARY KEY (id, branch_id)');
    });

    it('should create item table with type CHECK constraint', () => {
      const result = db.exec(`
        SELECT sql FROM sqlite_master
        WHERE type='table' AND name='item'
      `);

      const sql = result[0]?.values[0]?.[0] as string;
      expect(sql).toContain("CHECK(type IN ('task','milestone','release','meeting'))");
    });

    it('should create item table with date CHECK constraint', () => {
      const result = db.exec(`
        SELECT sql FROM sqlite_master
        WHERE type='table' AND name='item'
      `);

      const sql = result[0]?.values[0]?.[0] as string;
      expect(sql).toContain('CHECK(end_date IS NULL OR end_date >= start_date)');
    });

    it('should create item_history table with triple composite primary key', () => {
      const result = db.exec(`
        SELECT sql FROM sqlite_master
        WHERE type='table' AND name='item_history'
      `);

      const sql = result[0]?.values[0]?.[0] as string;
      expect(sql).toContain('PRIMARY KEY(id, branch_id, version)');
    });
  });

  describe('Index Creation', () => {
    it('should create all 5 required indexes', () => {
      const result = db.exec(`
        SELECT name FROM sqlite_master
        WHERE type='index'
        AND name LIKE 'idx_%'
        ORDER BY name
      `);

      expect(result.length).toBeGreaterThan(0);
      const indexes = result[0]?.values.map((row) => row[0] as string) ?? [];

      expect(indexes).toContain('idx_history_branch');
      expect(indexes).toContain('idx_history_id');
      expect(indexes).toContain('idx_item_branch');
      expect(indexes).toContain('idx_item_dates');
      expect(indexes).toContain('idx_item_project');
      expect(indexes.length).toBe(5);
    });

    it('should create idx_history_branch on (branch_id, snapshot_at)', () => {
      const result = db.exec(`
        SELECT sql FROM sqlite_master
        WHERE type='index' AND name='idx_history_branch'
      `);

      const sql = result[0]?.values[0]?.[0] as string;
      expect(sql).toContain('(branch_id, snapshot_at)');
    });

    it('should create idx_history_id on (id, branch_id, version)', () => {
      const result = db.exec(`
        SELECT sql FROM sqlite_master
        WHERE type='index' AND name='idx_history_id'
      `);

      const sql = result[0]?.values[0]?.[0] as string;
      expect(sql).toContain('(id, branch_id, version)');
    });

    it('should create idx_item_branch on (branch_id, type)', () => {
      const result = db.exec(`
        SELECT sql FROM sqlite_master
        WHERE type='index' AND name='idx_item_branch'
      `);

      const sql = result[0]?.values[0]?.[0] as string;
      expect(sql).toContain('(branch_id, type)');
    });

    it('should create idx_item_dates on (start_date, end_date)', () => {
      const result = db.exec(`
        SELECT sql FROM sqlite_master
        WHERE type='index' AND name='idx_item_dates'
      `);

      const sql = result[0]?.values[0]?.[0] as string;
      expect(sql).toContain('(start_date, end_date)');
    });

    it('should create idx_item_project on (project)', () => {
      const result = db.exec(`
        SELECT sql FROM sqlite_master
        WHERE type='index' AND name='idx_item_project'
      `);

      const sql = result[0]?.values[0]?.[0] as string;
      expect(sql).toContain('(project)');
    });
  });

  describe('Trigger Creation', () => {
    it('should create both history triggers', () => {
      const result = db.exec(`
        SELECT name FROM sqlite_master
        WHERE type='trigger'
        ORDER BY name
      `);

      expect(result.length).toBeGreaterThan(0);
      const triggers = result[0]?.values.map((row) => row[0] as string) ?? [];

      expect(triggers).toContain('item_insert_history');
      expect(triggers).toContain('item_update_history');
      expect(triggers.length).toBe(2);
    });

    it('should create INSERT trigger that fires AFTER INSERT', () => {
      const result = db.exec(`
        SELECT sql FROM sqlite_master
        WHERE type='trigger' AND name='item_insert_history'
      `);

      const sql = result[0]?.values[0]?.[0] as string;
      expect(sql).toContain('AFTER INSERT ON item');
    });

    it('should create UPDATE trigger that fires AFTER UPDATE', () => {
      const result = db.exec(`
        SELECT sql FROM sqlite_master
        WHERE type='trigger' AND name='item_update_history'
      `);

      const sql = result[0]?.values[0]?.[0] as string;
      expect(sql).toContain('AFTER UPDATE ON item');
    });
  });

  describe('Trigger Functionality', () => {
    it('should create history snapshot on INSERT with version 1', () => {
      db.run(`
        INSERT INTO item (id, type, title, start_date, branch_id)
        VALUES ('test-insert', 'task', 'Test Task', '2025-01-01', 'main')
      `);

      const result = db.exec(`
        SELECT id, branch_id, version, op, title
        FROM item_history
        WHERE id = 'test-insert'
      `);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.values.length).toBe(1);

      const [id, branchId, version, op, title] = result[0]?.values[0] ?? [];
      expect(id).toBe('test-insert');
      expect(branchId).toBe('main');
      expect(version).toBe(1);
      expect(op).toBe('insert');
      expect(title).toBe('Test Task');
    });

    it('should create history snapshot on UPDATE with incremented version', () => {
      // Insert
      db.run(`
        INSERT INTO item (id, type, title, start_date, branch_id)
        VALUES ('test-update', 'milestone', 'Original', '2025-02-01', 'main')
      `);

      // Update
      db.run(`
        UPDATE item
        SET title = 'Modified'
        WHERE id = 'test-update'
      `);

      const result = db.exec(`
        SELECT version, op, title
        FROM item_history
        WHERE id = 'test-update'
        ORDER BY version
      `);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.values.length).toBe(2);

      // Version 1 (insert)
      const [v1, op1, title1] = result[0]?.values[0] ?? [];
      expect(v1).toBe(1);
      expect(op1).toBe('insert');
      expect(title1).toBe('Original');

      // Version 2 (update)
      const [v2, op2, title2] = result[0]?.values[1] ?? [];
      expect(v2).toBe(2);
      expect(op2).toBe('update');
      expect(title2).toBe('Modified');
    });

    it('should track multiple updates with incrementing versions', () => {
      // Insert
      db.run(`
        INSERT INTO item (id, type, title, start_date, branch_id)
        VALUES ('test-multi', 'release', 'V1', '2025-03-01', 'main')
      `);

      // Multiple updates
      db.run("UPDATE item SET title = 'V2' WHERE id = 'test-multi'");
      db.run("UPDATE item SET title = 'V3' WHERE id = 'test-multi'");
      db.run("UPDATE item SET title = 'V4' WHERE id = 'test-multi'");

      const result = db.exec(`
        SELECT version, op
        FROM item_history
        WHERE id = 'test-multi'
        ORDER BY version
      `);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.values.length).toBe(4);

      // Verify versions increment correctly
      expect(result[0]?.values[0]?.[0]).toBe(1);
      expect(result[0]?.values[1]?.[0]).toBe(2);
      expect(result[0]?.values[2]?.[0]).toBe(3);
      expect(result[0]?.values[3]?.[0]).toBe(4);
    });
  });

  describe('Schema Constraints', () => {
    it('should enforce type CHECK constraint', () => {
      expect(() => {
        db.run(`
          INSERT INTO item (id, type, title, start_date, branch_id)
          VALUES ('bad-type', 'invalid-type', 'Bad', '2025-01-01', 'main')
        `);
      }).toThrow();
    });

    it('should allow valid types: task', () => {
      expect(() => {
        db.run(`
          INSERT INTO item (id, type, title, start_date, branch_id)
          VALUES ('valid-task', 'task', 'Valid Task', '2025-01-01', 'main')
        `);
      }).not.toThrow();
    });

    it('should allow valid types: milestone', () => {
      expect(() => {
        db.run(`
          INSERT INTO item (id, type, title, start_date, branch_id)
          VALUES ('valid-milestone', 'milestone', 'Valid Milestone', '2025-01-01', 'main')
        `);
      }).not.toThrow();
    });

    it('should allow valid types: release', () => {
      expect(() => {
        db.run(`
          INSERT INTO item (id, type, title, start_date, branch_id)
          VALUES ('valid-release', 'release', 'Valid Release', '2025-01-01', 'main')
        `);
      }).not.toThrow();
    });

    it('should allow valid types: meeting', () => {
      expect(() => {
        db.run(`
          INSERT INTO item (id, type, title, start_date, branch_id)
          VALUES ('valid-meeting', 'meeting', 'Valid Meeting', '2025-01-01', 'main')
        `);
      }).not.toThrow();
    });

    it('should enforce date CHECK constraint (end_date >= start_date)', () => {
      expect(() => {
        db.run(`
          INSERT INTO item (id, type, title, start_date, end_date, branch_id)
          VALUES ('bad-dates', 'task', 'Bad Dates', '2025-12-31', '2025-01-01', 'main')
        `);
      }).toThrow();
    });

    it('should allow end_date = start_date', () => {
      expect(() => {
        db.run(`
          INSERT INTO item (id, type, title, start_date, end_date, branch_id)
          VALUES ('same-dates', 'task', 'Same Dates', '2025-06-15', '2025-06-15', 'main')
        `);
      }).not.toThrow();
    });

    it('should allow NULL end_date', () => {
      expect(() => {
        db.run(`
          INSERT INTO item (id, type, title, start_date, end_date, branch_id)
          VALUES ('null-end', 'milestone', 'No End Date', '2025-06-15', NULL, 'main')
        `);
      }).not.toThrow();
    });

    it('should enforce composite primary key uniqueness', () => {
      // First insert should succeed
      db.run(`
        INSERT INTO item (id, type, title, start_date, branch_id)
        VALUES ('dup-test', 'task', 'Original', '2025-01-01', 'main')
      `);

      // Duplicate (id, branch_id) should fail
      expect(() => {
        db.run(`
          INSERT INTO item (id, type, title, start_date, branch_id)
          VALUES ('dup-test', 'task', 'Duplicate', '2025-01-01', 'main')
        `);
      }).toThrow();
    });

    it('should allow same id on different branch_id', () => {
      db.run(`
        INSERT INTO item (id, type, title, start_date, branch_id)
        VALUES ('multi-branch', 'task', 'Main Branch', '2025-01-01', 'main')
      `);

      // First create the branch
      db.run(`
        INSERT INTO branches (branch_id, label)
        VALUES ('dev', 'Dev Branch')
      `);

      // Same id, different branch - should succeed
      expect(() => {
        db.run(`
          INSERT INTO item (id, type, title, start_date, branch_id)
          VALUES ('multi-branch', 'task', 'Dev Branch', '2025-01-01', 'dev')
        `);
      }).not.toThrow();
    });
  });

  describe('Schema Version Tracking', () => {
    it('should insert schema version', () => {
      const result = db.exec(`
        SELECT version FROM _schema_version
        ORDER BY version DESC
        LIMIT 1
      `);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.values[0]?.[0]).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('should have exactly one schema version record', () => {
      const result = db.exec(`SELECT COUNT(*) FROM _schema_version`);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.values[0]?.[0]).toBe(1);
    });
  });

  describe('Default Data Initialization', () => {
    it('should insert default main branch', () => {
      const result = db.exec(`
        SELECT branch_id, label FROM branches
        WHERE branch_id = 'main'
      `);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.values.length).toBe(1);
      expect(result[0]?.values[0]).toEqual(['main', 'Main Branch']);
    });

    it('should have main branch present after initialization', () => {
      const result = db.exec(`
        SELECT COUNT(*) FROM branches WHERE branch_id = 'main'
      `);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.values[0]?.[0]).toBe(1);
    });
  });
});
