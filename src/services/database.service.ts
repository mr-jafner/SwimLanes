/**
 * Database service layer for SwimLanes
 *
 * This service wraps sql.js (SQLite WebAssembly) and provides a clean,
 * typed interface for all database operations. It handles:
 * - Loading sql.js from CDN
 * - Initializing and managing the database connection
 * - Schema creation and versioning
 * - Persistence to IndexedDB
 * - Export/import of .sqlite files
 * - Error handling and validation
 *
 * Architecture:
 * Component → Store → Service → Query Builder → DatabaseService → sql.js
 *
 * @module services/database.service
 */

import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import { SCHEMA_STATEMENTS, QUERY_SCHEMA_VERSION, CURRENT_SCHEMA_VERSION } from '@/db/schema';
import {
  saveToIndexedDB as persistSave,
  loadFromIndexedDB as persistLoad,
  clearIndexedDB as persistClear,
  PersistenceError,
} from './persistence.service';

/**
 * Custom error class for database-related errors.
 */
export class DatabaseError extends Error {
  public readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'DatabaseError';
    this.cause = cause;
  }
}

/**
 * Custom error class for schema-related errors.
 */
export class SchemaError extends Error {
  public readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'SchemaError';
    this.cause = cause;
  }
}

// PersistenceError is now imported from persistence.service
export { PersistenceError };

/**
 * Database connection state values.
 */
export const ConnectionState = {
  UNINITIALIZED: 'uninitialized',
  INITIALIZING: 'initializing',
  READY: 'ready',
  ERROR: 'error',
  CLOSED: 'closed',
} as const;

/**
 * Database connection state type.
 */
export type ConnectionState = (typeof ConnectionState)[keyof typeof ConnectionState];

/**
 * Configuration options for database initialization.
 */
export interface DatabaseConfig {
  /**
   * URL for sql.js CDN. Defaults to cdnjs.cloudflare.com.
   */
  sqlJsCdnUrl?: string;

  /**
   * Whether to enable auto-save to IndexedDB.
   * Default: true
   */
  enableAutoSave?: boolean;

  /**
   * Auto-save interval in milliseconds.
   * Default: 5000 (5 seconds)
   */
  autoSaveInterval?: number;

  /**
   * IndexedDB database name.
   * Default: 'swimlanes-db'
   */
  indexedDbName?: string;

  /**
   * IndexedDB object store name.
   * Default: 'database'
   */
  indexedDbStoreName?: string;
}

/**
 * Default configuration values.
 */
const DEFAULT_CONFIG: Required<DatabaseConfig> = {
  sqlJsCdnUrl: 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.13.0/',
  enableAutoSave: true,
  autoSaveInterval: 5000,
  indexedDbName: 'swimlanes-db',
  indexedDbStoreName: 'database',
};

/**
 * Database service singleton.
 *
 * Manages the SQLite database connection, schema, and persistence.
 *
 * @example
 * ```typescript
 * // Initialize the database
 * await databaseService.initialize();
 *
 * // Get the database instance for queries
 * const db = databaseService.getDatabase();
 * const result = db.exec('SELECT * FROM item WHERE branch_id = ?', ['main']);
 *
 * // Export database to file
 * const blob = await databaseService.exportToFile();
 *
 * // Close and cleanup
 * await databaseService.close();
 * ```
 */
export class DatabaseService {
  private SQL: SqlJsStatic | null = null;
  private db: Database | null = null;
  private state: ConnectionState = ConnectionState.UNINITIALIZED;
  private config: Required<DatabaseConfig>;
  private autoSaveTimer: number | null = null;

  constructor(config: DatabaseConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get current connection state.
   */
  public getState(): ConnectionState {
    return this.state;
  }

  /**
   * Check if database is ready for use.
   */
  public isReady(): boolean {
    return this.state === ConnectionState.READY && this.db !== null;
  }

  /**
   * Initialize the database.
   *
   * This method:
   * 1. Loads sql.js from CDN
   * 2. Attempts to load existing database from IndexedDB
   * 3. If not found, creates a new database and initializes schema
   * 4. Validates schema version
   * 5. Sets up auto-save if enabled
   *
   * @throws {DatabaseError} If initialization fails
   * @throws {SchemaError} If schema version mismatch is detected
   */
  public async initialize(): Promise<void> {
    if (this.state === ConnectionState.READY) {
      console.warn('Database already initialized');
      return;
    }

    if (this.state === ConnectionState.INITIALIZING) {
      throw new DatabaseError('Database is already initializing');
    }

    try {
      this.state = ConnectionState.INITIALIZING;

      // Load sql.js from CDN
      console.log('Loading sql.js from CDN...');
      this.SQL = await initSqlJs({
        locateFile: (file: string) => `${this.config.sqlJsCdnUrl}${file}`,
      });

      // Try to load existing database from IndexedDB
      const existingData = await this.loadFromIndexedDB();

      if (existingData) {
        console.log('Loading existing database from IndexedDB...');
        this.db = new this.SQL.Database(existingData);

        // Validate schema version
        await this.validateSchemaVersion();
      } else {
        console.log('Creating new database...');
        this.db = new this.SQL.Database();

        // Initialize schema
        await this.createSchema();
      }

      this.state = ConnectionState.READY;

      // Set up auto-save
      if (this.config.enableAutoSave) {
        this.startAutoSave();
      }

      console.log('Database initialized successfully');
    } catch (error) {
      this.state = ConnectionState.ERROR;
      throw new DatabaseError('Failed to initialize database', error);
    }
  }

  /**
   * Create database schema.
   *
   * Executes all schema creation statements in order. This should only be
   * called during initialization or reset when db is available.
   *
   * @throws {SchemaError} If schema creation fails
   */
  private async createSchema(): Promise<void> {
    if (!this.db) {
      throw new SchemaError('Database instance not available');
    }

    try {
      console.log('Creating database schema...');

      for (const statement of SCHEMA_STATEMENTS) {
        this.db.run(statement);
      }

      console.log('Schema created successfully');
    } catch (error) {
      throw new SchemaError('Failed to create schema', error);
    }
  }

  /**
   * Get the current schema version from the database.
   *
   * @returns Schema version number, or null if no version is set
   * @throws {DatabaseError} If query fails
   */
  public getSchemaVersion(): number | null {
    this.ensureReady();
    return this.getSchemaVersionInternal();
  }

  /**
   * Internal method to get schema version without ready check.
   * Used during initialization when state is not yet 'ready'.
   *
   * @returns Schema version number, or null if no version is set
   * @throws {DatabaseError} If query fails
   */
  private getSchemaVersionInternal(): number | null {
    try {
      const result = this.db!.exec(QUERY_SCHEMA_VERSION);

      if (result.length === 0 || !result[0] || result[0].values.length === 0) {
        return null;
      }

      const firstRow = result[0].values[0];
      if (!firstRow || firstRow[0] === undefined) {
        return null;
      }

      return firstRow[0] as number;
    } catch (error) {
      throw new DatabaseError('Failed to query schema version', error);
    }
  }

  /**
   * Validate that the database schema version matches the expected version.
   *
   * @throws {SchemaError} If version mismatch is detected
   */
  private async validateSchemaVersion(): Promise<void> {
    const dbVersion = this.getSchemaVersionInternal();

    if (dbVersion === null) {
      throw new SchemaError(
        'Database has no schema version. This may indicate a corrupted database.'
      );
    }

    if (dbVersion !== CURRENT_SCHEMA_VERSION) {
      throw new SchemaError(
        `Schema version mismatch. Database is version ${dbVersion}, but expected version ${CURRENT_SCHEMA_VERSION}. Migration is not yet supported.`
      );
    }

    console.log(`Schema version validated: ${dbVersion}`);
  }

  /**
   * Get the database instance for direct SQL queries.
   *
   * @throws {DatabaseError} If database is not ready
   */
  public getDatabase(): Database {
    this.ensureReady();
    return this.db!;
  }

  /**
   * Reset the database by dropping all tables and recreating the schema.
   *
   * WARNING: This will delete all data!
   *
   * @throws {DatabaseError} If reset fails
   */
  public async reset(): Promise<void> {
    this.ensureReady();

    try {
      console.log('Resetting database...');

      // Get all table names
      const result = this.db!.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );

      if (result.length > 0 && result[0]) {
        const tables = result[0].values.map((row: unknown[]) => row[0] as string);

        // Drop all tables
        for (const table of tables) {
          this.db!.run(`DROP TABLE IF EXISTS ${table}`);
        }
      }

      // Recreate schema
      await this.createSchema();

      // Save to IndexedDB
      if (this.config.enableAutoSave) {
        await this.saveToIndexedDB();
      }

      console.log('Database reset successfully');
    } catch (error) {
      throw new DatabaseError('Failed to reset database', error);
    }
  }

  /**
   * Save the current database state to IndexedDB.
   *
   * Uses the persistence service to save the database export to IndexedDB.
   *
   * @throws {PersistenceError} If save fails
   */
  public async saveToIndexedDB(): Promise<void> {
    this.ensureReady();

    try {
      const data = this.db!.export();
      await persistSave(
        this.config.indexedDbName,
        this.config.indexedDbStoreName,
        'database',
        data
      );
      console.log('Database saved to IndexedDB');
    } catch (error) {
      throw new PersistenceError('Failed to save database to IndexedDB', error);
    }
  }

  /**
   * Load database state from IndexedDB.
   *
   * Uses the persistence service to load the database from IndexedDB.
   *
   * @returns Uint8Array of database data, or null if not found
   * @throws {PersistenceError} If load fails
   */
  private async loadFromIndexedDB(): Promise<Uint8Array | null> {
    try {
      return await persistLoad<Uint8Array>(
        this.config.indexedDbName,
        this.config.indexedDbStoreName,
        'database'
      );
    } catch (error) {
      throw new PersistenceError('Failed to load database from IndexedDB', error);
    }
  }

  /**
   * Export database to a .sqlite file blob.
   *
   * @returns Blob containing the database file
   * @throws {DatabaseError} If export fails
   */
  public exportToFile(): Blob {
    this.ensureReady();

    try {
      const data = this.db!.export();
      // Convert to regular Uint8Array for Blob compatibility
      const buffer = new Uint8Array(data);
      return new Blob([buffer], { type: 'application/x-sqlite3' });
    } catch (error) {
      throw new DatabaseError('Failed to export database to file', error);
    }
  }

  /**
   * Import database from a .sqlite file.
   *
   * This will replace the current database with the imported one.
   * If sql.js is not loaded, it will be loaded automatically.
   *
   * @param file File or Blob containing the database
   * @throws {DatabaseError} If import fails
   * @throws {SchemaError} If imported database has wrong schema version
   */
  public async importFromFile(file: Blob): Promise<void> {
    // Load sql.js if not already loaded
    if (!this.SQL) {
      console.log('Loading sql.js for import...');
      this.SQL = await initSqlJs({
        locateFile: (fileParam: string) => `${this.config.sqlJsCdnUrl}${fileParam}`,
      });
    }

    try {
      console.log('Importing database from file...');

      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);

      // Close existing database
      if (this.db) {
        this.db.close();
      }

      // Create new database from imported data
      this.db = new this.SQL.Database(data);
      this.state = ConnectionState.READY;

      // Validate schema version
      await this.validateSchemaVersion();

      // Save to IndexedDB
      if (this.config.enableAutoSave) {
        await this.saveToIndexedDB();
      }

      console.log('Database imported successfully');
    } catch (error) {
      this.state = ConnectionState.ERROR;
      throw new DatabaseError('Failed to import database from file', error);
    }
  }

  /**
   * Start auto-save timer.
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer !== null) {
      return;
    }

    this.autoSaveTimer = window.setInterval(() => {
      this.saveToIndexedDB().catch((error) => {
        console.error('Auto-save failed:', error);
      });
    }, this.config.autoSaveInterval);

    console.log(`Auto-save enabled (interval: ${this.config.autoSaveInterval}ms)`);
  }

  /**
   * Stop auto-save timer.
   */
  private stopAutoSave(): void {
    if (this.autoSaveTimer !== null) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      console.log('Auto-save disabled');
    }
  }

  /**
   * Close the database connection and cleanup resources.
   *
   * This will:
   * 1. Stop auto-save timer
   * 2. Save final state to IndexedDB (if auto-save enabled)
   * 3. Close the database connection
   *
   * @throws {DatabaseError} If close fails
   */
  public async close(): Promise<void> {
    if (this.state === ConnectionState.CLOSED) {
      console.warn('Database already closed');
      return;
    }

    try {
      console.log('Closing database...');

      // Stop auto-save
      this.stopAutoSave();

      // Final save to IndexedDB
      if (this.config.enableAutoSave && this.db) {
        await this.saveToIndexedDB();
      }

      // Close database
      if (this.db) {
        this.db.close();
        this.db = null;
      }

      this.state = ConnectionState.CLOSED;
      console.log('Database closed successfully');
    } catch (error) {
      throw new DatabaseError('Failed to close database', error);
    }
  }

  /**
   * Clear all persisted data from IndexedDB.
   *
   * This deletes the entire IndexedDB database used for persistence.
   * Useful for "reset app data" functionality. The current in-memory
   * database remains open and unchanged.
   *
   * Warning: This permanently deletes all persisted data and cannot be undone.
   *
   * @throws {PersistenceError} If clear operation fails
   *
   * @example
   * ```typescript
   * // Clear persisted data (but keep in-memory database)
   * await databaseService.clearPersistedData();
   *
   * // Or reset everything
   * await databaseService.clearPersistedData();
   * await databaseService.reset(); // Also reset in-memory database
   * ```
   */
  public async clearPersistedData(): Promise<void> {
    try {
      await persistClear(this.config.indexedDbName);
      console.log('Persisted data cleared from IndexedDB');
    } catch (error) {
      throw new PersistenceError('Failed to clear persisted data', error);
    }
  }

  /**
   * Ensure database is ready for use.
   *
   * @throws {DatabaseError} If database is not ready
   */
  private ensureReady(): void {
    if (!this.isReady()) {
      throw new DatabaseError(
        `Database is not ready (state: ${this.state}). Call initialize() first.`
      );
    }
  }
}

/**
 * Global database service instance.
 *
 * This singleton should be used throughout the application for all database
 * operations. Initialize it once during app startup.
 *
 * @example
 * ```typescript
 * // In your app initialization code
 * import { databaseService } from '@/services/database.service';
 *
 * await databaseService.initialize();
 * ```
 */
export const databaseService = new DatabaseService();
