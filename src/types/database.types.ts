/**
 * Core database type definitions for SwimLanes
 *
 * These types match the SQLite schema from the legacy prototype and provide
 * full type safety for database operations.
 */

/**
 * Item types supported by the application.
 *
 * - task: Work items with start and end dates (rendered as blue bars)
 * - milestone: Single-date markers (rendered as green diamonds)
 * - release: Deployment/launch events (rendered as orange bars)
 * - meeting: Calendar events (rendered as purple bars)
 */
export type ItemType = 'task' | 'milestone' | 'release' | 'meeting';

/**
 * Operations tracked in item history.
 *
 * - insert: Item was created
 * - update: Item was modified
 * - delete: Item was removed (future feature)
 */
export type HistoryOperation = 'insert' | 'update' | 'delete';

/**
 * Main item entity representing a task, milestone, release, or meeting.
 *
 * Items use a composite primary key (id, branch_id) to enable branch isolation.
 * Each item belongs to exactly one branch and can be versioned independently.
 *
 * @example
 * ```typescript
 * const item: Item = {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   branch_id: 'main',
 *   type: 'task',
 *   title: 'Implement user authentication',
 *   start_date: '2025-02-01',
 *   end_date: '2025-02-15',
 *   owner: 'Alice',
 *   lane: 'Backend',
 *   project: 'Auth System',
 *   tags: 'security,backend',
 *   dependencies: null,
 *   source_id: null,
 *   source_row_hash: 'abc123...',
 *   updated_at: '2025-02-01T10:30:00Z'
 * };
 * ```
 */
export interface Item {
  /** Unique identifier (UUID or user-provided). Part of composite key with branch_id. */
  id: string;

  /** Branch this item belongs to. Part of composite key with id. Default: 'main' */
  branch_id: string;

  /** Type of item (task, milestone, release, or meeting) */
  type: ItemType;

  /** Display title/name of the item */
  title: string;

  /** Start date in ISO format (YYYY-MM-DD). Required for all types. */
  start_date: string | null;

  /** End date in ISO format (YYYY-MM-DD). Typically null for milestones. Must be >= start_date. */
  end_date: string | null;

  /** Person or team responsible for this item */
  owner: string | null;

  /** Swim lane this item appears in (for grouping/visualization) */
  lane: string | null;

  /** Project or epic this item belongs to */
  project: string | null;

  /** Comma-separated tags or labels for filtering */
  tags: string | null;

  /** JSON array of item IDs this item depends on (future feature) */
  dependencies?: string | null;

  /** Original source identifier for provenance tracking (future feature) */
  source_id?: string | null;

  /** Hash of original CSV row for change detection during re-import */
  source_row_hash: string | null;

  /** Last modification timestamp in ISO format */
  updated_at: string;
}

/**
 * Version history record for an item.
 *
 * Every INSERT and UPDATE on the item table automatically creates a snapshot
 * in item_history via database triggers. This enables full audit trail and
 * undo/redo functionality.
 *
 * The version number auto-increments per (id, branch_id) pair, so each item
 * on each branch has its own version sequence starting at 1.
 *
 * @example
 * ```typescript
 * const historyRecord: ItemHistory = {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   branch_id: 'main',
 *   version: 3,
 *   op: 'update',
 *   snapshot_at: '2025-02-01T10:30:00Z',
 *   type: 'task',
 *   title: 'Implement user authentication',
 *   start_date: '2025-02-01',
 *   end_date: '2025-02-15',
 *   owner: 'Alice',
 *   lane: 'Backend',
 *   project: 'Auth System',
 *   tags: 'security,backend',
 *   dependencies: null
 * };
 * ```
 */
export interface ItemHistory {
  /** Item ID. Part of composite key with branch_id and version. */
  id: string;

  /** Branch ID. Part of composite key with id and version. */
  branch_id: string;

  /** Version number (auto-increments per id+branch_id). Part of composite key. */
  version: number;

  /** Operation that created this history record */
  op: HistoryOperation;

  /** Timestamp when this snapshot was created */
  snapshot_at: string;

  // Snapshot of all item fields at this version (nullable for deleted items)
  type: string | null;
  title: string | null;
  start_date: string | null;
  end_date: string | null;
  owner: string | null;
  lane: string | null;
  project: string | null;
  tags: string | null;
  dependencies?: string | null;
}

/**
 * Branch metadata.
 *
 * Branches enable scenario planning and what-if analysis. Each branch contains
 * an isolated copy of items (via composite key). Branches can be created from
 * any existing branch and compared to see differences.
 *
 * @example
 * ```typescript
 * const branch: Branch = {
 *   branch_id: 'q1-stretch-goals',
 *   label: 'Q1 Stretch Goals',
 *   created_from: 'main',
 *   note: 'What if we add these 5 extra features?',
 *   created_at: '2025-02-01T10:30:00Z'
 * };
 * ```
 */
export interface Branch {
  /** Unique branch identifier (kebab-case recommended) */
  branch_id: string;

  /** Human-readable branch name */
  label: string | null;

  /** Parent branch this was created from */
  created_from: string | null;

  /** Description of branch purpose or scenario */
  note: string | null;

  /** Creation timestamp */
  created_at: string;
}

/**
 * Saved import mapping profile.
 *
 * Import profiles store the column-to-field mappings and import settings
 * used during CSV/JSON import. This enables quick re-import with the same
 * configuration (Update/Append workflow).
 *
 * The `json` field contains a serialized ColumnMapping object.
 *
 * @example
 * ```typescript
 * const profile: ImportProfile = {
 *   name: 'Jira Export Format',
 *   json: '{"title":"Summary","type":"Issue Type",...}',
 *   created_at: '2025-02-01T10:30:00Z'
 * };
 * ```
 */
export interface ImportProfile {
  /** Unique profile name */
  name: string;

  /** JSON-serialized ColumnMapping configuration */
  json: string;

  /** Creation timestamp */
  created_at: string;
}

/**
 * Application parameter key-value store.
 *
 * Generic table for storing miscellaneous app settings that don't fit
 * into other tables (e.g., current branch, UI preferences, feature flags).
 *
 * @example
 * ```typescript
 * const param: AppParam = {
 *   key: 'current_branch',
 *   value: 'main'
 * };
 * ```
 */
export interface AppParam {
  /** Setting key */
  key: string;

  /** Setting value (nullable) */
  value: string | null;
}

/**
 * Schema version tracking for migrations.
 *
 * Tracks which schema version is currently applied to the database.
 * Used for future schema migration logic.
 *
 * @example
 * ```typescript
 * const schemaVersion: SchemaVersion = {
 *   version: 1,
 *   applied_at: '2025-02-01T10:30:00Z'
 * };
 * ```
 */
export interface SchemaVersion {
  /** Schema version number (increments with each migration) */
  version: number;

  /** Timestamp when this version was applied */
  applied_at: string;
}
