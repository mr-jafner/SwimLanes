/**
 * Integration tests for DatabaseService
 *
 * These tests use actual sql.js to verify the service works correctly.
 * They test real database operations without heavy mocking.
 *
 * @module services/database.service.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseService, DatabaseError, ConnectionState } from './database.service';
import { CURRENT_SCHEMA_VERSION } from '@/db/schema';

// Polyfill Blob.arrayBuffer() for Node.js/vitest environment
if (typeof Blob !== 'undefined' && !Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = async function () {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}

// Mock IndexedDB for browser environment
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

describe('DatabaseService Integration Tests', () => {
  let service: DatabaseService;

  beforeEach(() => {
    mockIndexedDB();
    service = new DatabaseService({
      enableAutoSave: false, // Disable auto-save for tests
      sqlJsCdnUrl: './node_modules/sql.js/dist/', // Use local WASM files in tests
    });
  });

  afterEach(async () => {
    try {
      if (service.isReady()) {
        await service.close();
      }
    } catch {
      // Database already closed or in error state, ignore
    }
  });

  describe('Initialization', () => {
    it('should start in UNINITIALIZED state', () => {
      expect(service.getState()).toBe(ConnectionState.UNINITIALIZED);
      expect(service.isReady()).toBe(false);
    });

    it('should initialize and create schema', async () => {
      await service.initialize();

      expect(service.getState()).toBe(ConnectionState.READY);
      expect(service.isReady()).toBe(true);

      // Verify schema version
      const version = service.getSchemaVersion();
      expect(version).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('should not reinitialize if already ready', async () => {
      await service.initialize();
      const stateBefore = service.getState();

      await service.initialize(); // Should not throw or change state

      expect(service.getState()).toBe(stateBefore);
    });

    it('should throw error when accessing database before initialization', () => {
      expect(() => service.getDatabase()).toThrow(DatabaseError);
      expect(() => service.getDatabase()).toThrow(/not ready/);
    });
  });

  describe('Schema Operations', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should return correct schema version', () => {
      const version = service.getSchemaVersion();
      expect(version).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('should have created all required tables', () => {
      const db = service.getDatabase();
      const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");

      expect(result.length).toBeGreaterThan(0);
      const tables = result[0]?.values.map((row) => row[0]) ?? [];

      expect(tables).toContain('item');
      expect(tables).toContain('item_history');
      expect(tables).toContain('branches');
      expect(tables).toContain('import_profiles');
      expect(tables).toContain('app_params');
      expect(tables).toContain('_schema_version');
    });

    it('should have created the default main branch', () => {
      const db = service.getDatabase();
      const result = db.exec("SELECT branch_id, label FROM branches WHERE branch_id = 'main'");

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.values.length).toBe(1);
      expect(result[0]?.values[0]).toEqual(['main', 'Main Branch']);
    });
  });

  describe('Database Operations', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should allow inserting and querying data', () => {
      const db = service.getDatabase();

      db.run(
        `INSERT INTO item (id, type, title, start_date, branch_id)
         VALUES ('test-1', 'task', 'Test Task', '2025-01-01', 'main')`
      );

      const result = db.exec("SELECT id, title FROM item WHERE id = 'test-1'");

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.values[0]).toEqual(['test-1', 'Test Task']);
    });

    it('should create history entries on insert', () => {
      const db = service.getDatabase();

      db.run(
        `INSERT INTO item (id, type, title, start_date, branch_id)
         VALUES ('test-2', 'milestone', 'Test Milestone', '2025-02-01', 'main')`
      );

      const result = db.exec("SELECT id, version, op, title FROM item_history WHERE id = 'test-2'");

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.values.length).toBe(1);
      const [id, version, op, title] = result[0]?.values[0] ?? [];
      expect(id).toBe('test-2');
      expect(version).toBe(1);
      expect(op).toBe('insert');
      expect(title).toBe('Test Milestone');
    });

    it('should create history entries on update', () => {
      const db = service.getDatabase();

      // Insert
      db.run(
        `INSERT INTO item (id, type, title, start_date, branch_id)
         VALUES ('test-3', 'task', 'Original Title', '2025-03-01', 'main')`
      );

      // Update
      db.run("UPDATE item SET title = 'Updated Title' WHERE id = 'test-3'");

      const result = db.exec(
        "SELECT version, op, title FROM item_history WHERE id = 'test-3' ORDER BY version"
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.values.length).toBe(2);

      // Check version 1 (insert)
      expect(result[0]?.values[0]).toEqual([1, 'insert', 'Original Title']);

      // Check version 2 (update)
      expect(result[0]?.values[1]).toEqual([2, 'update', 'Updated Title']);
    });

    it('should enforce CHECK constraints', () => {
      const db = service.getDatabase();

      // Invalid type
      expect(() => {
        db.run(
          `INSERT INTO item (id, type, title, start_date, branch_id)
           VALUES ('bad-1', 'invalid', 'Bad Type', '2025-01-01', 'main')`
        );
      }).toThrow();

      // Invalid date range (end before start)
      expect(() => {
        db.run(
          `INSERT INTO item (id, type, title, start_date, end_date, branch_id)
           VALUES ('bad-2', 'task', 'Bad Dates', '2025-12-31', '2025-01-01', 'main')`
        );
      }).toThrow();
    });
  });

  describe('Reset', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should reset database and recreate schema', async () => {
      const db = service.getDatabase();

      // Add some data
      db.run(
        `INSERT INTO item (id, type, title, start_date, branch_id)
         VALUES ('temp-1', 'task', 'Temp Task', '2025-01-01', 'main')`
      );

      let result = db.exec('SELECT COUNT(*) FROM item');
      expect(result[0]?.values[0]?.[0]).toBe(1);

      // Reset
      await service.reset();

      // Verify data is gone
      result = db.exec('SELECT COUNT(*) FROM item');
      expect(result[0]?.values[0]?.[0]).toBe(0);

      // Verify schema still exists
      result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='item'");
      expect(result.length).toBeGreaterThan(0);

      // Verify main branch is restored
      result = db.exec("SELECT COUNT(*) FROM branches WHERE branch_id = 'main'");
      expect(result[0]?.values[0]?.[0]).toBe(1);
    });
  });

  describe('Export/Import', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should export database to blob', () => {
      const blob = service.exportToFile();

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/x-sqlite3');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should import database from file', async () => {
      const db = service.getDatabase();

      // Add data
      db.run(
        `INSERT INTO item (id, type, title, start_date, branch_id)
         VALUES ('export-1', 'task', 'Export Test', '2025-01-01', 'main')`
      );

      // Export
      const blob = service.exportToFile();

      // Create new service and import
      const newService = new DatabaseService({
        enableAutoSave: false,
        sqlJsCdnUrl: './node_modules/sql.js/dist/',
      });
      await newService.importFromFile(blob);

      // Verify data was imported
      const newDb = newService.getDatabase();
      const result = newDb.exec("SELECT title FROM item WHERE id = 'export-1'");

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.values[0]?.[0]).toBe('Export Test');

      await newService.close();
    });

    it('should reject import of invalid database', async () => {
      const invalidBlob = new Blob(['not a database'], { type: 'application/x-sqlite3' });

      await expect(service.importFromFile(invalidBlob)).rejects.toThrow(DatabaseError);
    });
  });

  describe('Close', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should close database successfully', async () => {
      await service.close();

      expect(service.getState()).toBe(ConnectionState.CLOSED);
      expect(() => service.getDatabase()).toThrow(DatabaseError);
    });

    it('should not throw if closing already closed database', async () => {
      await service.close();
      await expect(service.close()).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should throw error for database with wrong schema version', async () => {
      // Initialize a database
      await service.initialize();
      const db = service.getDatabase();

      // Manually set wrong schema version
      db.run('UPDATE _schema_version SET version = 999');

      // Export with wrong version
      const blob = service.exportToFile();
      await service.close();

      // Try to import - should detect version mismatch
      const newService = new DatabaseService({
        enableAutoSave: false,
        sqlJsCdnUrl: './node_modules/sql.js/dist/',
      });
      // SchemaError is wrapped in DatabaseError (correct error handling pattern)
      await expect(newService.importFromFile(blob)).rejects.toThrow(DatabaseError);
    });

    it('should throw DatabaseError when operating on closed database', async () => {
      await service.initialize();
      await service.close();

      expect(() => service.getDatabase()).toThrow(DatabaseError);
      expect(() => service.getSchemaVersion()).toThrow(DatabaseError);
      expect(() => service.exportToFile()).toThrow(DatabaseError);
    });
  });
});
