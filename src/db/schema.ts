/**
 * Database schema definitions for SwimLanes
 *
 * This module contains all SQL DDL statements for creating tables, indexes,
 * and triggers. The schema is versioned and matches the legacy prototype
 * from timeline-app.html (lines 675-772).
 *
 * @module db/schema
 */

/**
 * Current schema version.
 *
 * Increment this when making breaking schema changes. The database service
 * will check this version against the database to detect schema mismatches.
 */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * SQL statement to create the main item table.
 *
 * Items use a composite primary key (id, branch_id) to enable branch isolation.
 * Each item belongs to exactly one branch and can be versioned independently.
 *
 * Constraints:
 * - type must be one of: task, milestone, release, meeting
 * - end_date must be >= start_date (or null)
 * - composite primary key (id, branch_id)
 */
export const CREATE_ITEM_TABLE = `
  CREATE TABLE IF NOT EXISTS item (
    id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    owner TEXT,
    lane TEXT,
    project TEXT,
    tags TEXT,
    source_id TEXT,
    source_row_hash TEXT,
    branch_id TEXT DEFAULT 'main',
    updated_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (id, branch_id),
    CHECK(type IN ('task','milestone','release','meeting')),
    CHECK(end_date IS NULL OR end_date >= start_date)
  )
`;

/**
 * SQL statement to create the item history table.
 *
 * Every INSERT and UPDATE on the item table automatically creates a snapshot
 * in item_history via database triggers. This enables full audit trail and
 * undo/redo functionality.
 *
 * The version number auto-increments per (id, branch_id) pair via triggers.
 */
export const CREATE_ITEM_HISTORY_TABLE = `
  CREATE TABLE IF NOT EXISTS item_history (
    id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    op TEXT NOT NULL,
    snapshot_at TEXT DEFAULT (datetime('now')),
    type TEXT,
    title TEXT,
    start_date TEXT,
    end_date TEXT,
    owner TEXT,
    lane TEXT,
    project TEXT,
    tags TEXT,
    PRIMARY KEY(id, branch_id, version)
  )
`;

/**
 * SQL statement to create the branches table.
 *
 * Branches enable scenario planning and what-if analysis. Each branch contains
 * an isolated copy of items (via composite key on item table).
 */
export const CREATE_BRANCHES_TABLE = `
  CREATE TABLE IF NOT EXISTS branches (
    branch_id TEXT PRIMARY KEY,
    label TEXT,
    created_from TEXT,
    note TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`;

/**
 * SQL statement to create the import profiles table.
 *
 * Import profiles store column-to-field mappings used during CSV/JSON import.
 * This enables quick re-import with the same configuration.
 */
export const CREATE_IMPORT_PROFILES_TABLE = `
  CREATE TABLE IF NOT EXISTS import_profiles (
    name TEXT PRIMARY KEY,
    json TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )
`;

/**
 * SQL statement to create the app parameters table.
 *
 * Generic key-value store for miscellaneous app settings (e.g., current branch,
 * UI preferences, feature flags).
 */
export const CREATE_APP_PARAMS_TABLE = `
  CREATE TABLE IF NOT EXISTS app_params (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`;

/**
 * SQL statement to create the schema version table.
 *
 * Tracks which schema version is currently applied to the database.
 * Used for detecting schema mismatches and future migration logic.
 */
export const CREATE_SCHEMA_VERSION_TABLE = `
  CREATE TABLE IF NOT EXISTS _schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TEXT DEFAULT (datetime('now'))
  )
`;

/**
 * SQL statement to create index on item_history for efficient branch/time queries.
 */
export const CREATE_IDX_HISTORY_BRANCH = `
  CREATE INDEX IF NOT EXISTS idx_history_branch ON item_history(branch_id, snapshot_at)
`;

/**
 * SQL statement to create index on item_history for efficient item lookup.
 */
export const CREATE_IDX_HISTORY_ID = `
  CREATE INDEX IF NOT EXISTS idx_history_id ON item_history(id, branch_id, version)
`;

/**
 * SQL statement to create index on item for efficient branch/type queries.
 */
export const CREATE_IDX_ITEM_BRANCH = `
  CREATE INDEX IF NOT EXISTS idx_item_branch ON item(branch_id, type)
`;

/**
 * SQL statement to create index on item for efficient date range queries.
 */
export const CREATE_IDX_ITEM_DATES = `
  CREATE INDEX IF NOT EXISTS idx_item_dates ON item(start_date, end_date)
`;

/**
 * SQL statement to create index on item for efficient project queries.
 */
export const CREATE_IDX_ITEM_PROJECT = `
  CREATE INDEX IF NOT EXISTS idx_item_project ON item(project)
`;

/**
 * SQL statement to create trigger for auto-creating history snapshots on INSERT.
 *
 * This trigger fires after every INSERT on the item table and creates a snapshot
 * in item_history with version = 1 (or max + 1 if item was previously deleted).
 */
export const CREATE_TRIGGER_INSERT_HISTORY = `
  CREATE TRIGGER IF NOT EXISTS item_insert_history
  AFTER INSERT ON item
  BEGIN
    INSERT INTO item_history (id, branch_id, version, op, type, title, start_date, end_date, owner, lane, project, tags)
    SELECT NEW.id, NEW.branch_id,
           COALESCE((SELECT MAX(version) FROM item_history WHERE id = NEW.id AND branch_id = NEW.branch_id), 0) + 1,
           'insert', NEW.type, NEW.title, NEW.start_date, NEW.end_date, NEW.owner, NEW.lane, NEW.project, NEW.tags;
  END
`;

/**
 * SQL statement to create trigger for auto-creating history snapshots on UPDATE.
 *
 * This trigger fires after every UPDATE on the item table and creates a snapshot
 * in item_history with version = previous max + 1.
 */
export const CREATE_TRIGGER_UPDATE_HISTORY = `
  CREATE TRIGGER IF NOT EXISTS item_update_history
  AFTER UPDATE ON item
  BEGIN
    INSERT INTO item_history (id, branch_id, version, op, type, title, start_date, end_date, owner, lane, project, tags)
    SELECT NEW.id, NEW.branch_id,
           (SELECT MAX(version) FROM item_history WHERE id = NEW.id AND branch_id = NEW.branch_id) + 1,
           'update', NEW.type, NEW.title, NEW.start_date, NEW.end_date, NEW.owner, NEW.lane, NEW.project, NEW.tags;
  END
`;

/**
 * SQL statement to insert the default 'main' branch.
 */
export const INSERT_DEFAULT_BRANCH = `
  INSERT OR IGNORE INTO branches (branch_id, label) VALUES ('main', 'Main Branch')
`;

/**
 * SQL statement to insert the current schema version.
 */
export const INSERT_SCHEMA_VERSION = `
  INSERT OR REPLACE INTO _schema_version (version) VALUES (${CURRENT_SCHEMA_VERSION})
`;

/**
 * SQL statement to query the current schema version.
 */
export const QUERY_SCHEMA_VERSION = `
  SELECT version FROM _schema_version ORDER BY version DESC LIMIT 1
`;

/**
 * Complete schema creation script.
 *
 * This array contains all DDL statements in the correct order for initializing
 * a new database. Execute these statements sequentially during database setup.
 */
export const SCHEMA_STATEMENTS = [
  // Tables (order matters due to potential foreign keys in future)
  CREATE_ITEM_TABLE,
  CREATE_ITEM_HISTORY_TABLE,
  CREATE_BRANCHES_TABLE,
  CREATE_IMPORT_PROFILES_TABLE,
  CREATE_APP_PARAMS_TABLE,
  CREATE_SCHEMA_VERSION_TABLE,

  // Indexes
  CREATE_IDX_HISTORY_BRANCH,
  CREATE_IDX_HISTORY_ID,
  CREATE_IDX_ITEM_BRANCH,
  CREATE_IDX_ITEM_DATES,
  CREATE_IDX_ITEM_PROJECT,

  // Triggers
  CREATE_TRIGGER_INSERT_HISTORY,
  CREATE_TRIGGER_UPDATE_HISTORY,

  // Initial data
  INSERT_DEFAULT_BRANCH,
  INSERT_SCHEMA_VERSION,
] as const;
