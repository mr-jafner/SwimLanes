/**
 * Query builders for import_profiles table operations
 *
 * Provides typed, parameterized query functions for CRUD operations on import profiles.
 * All queries use parameterized statements to prevent SQL injection.
 *
 * @module db/queries/import.queries
 */

import type { Database, QueryExecResult } from 'sql.js';
import type { ColumnMapping } from '@/types/import.types';

/**
 * Import profile stored in database
 */
export interface ImportProfile {
  /** Profile name (unique identifier) */
  name: string;

  /** Serialized JSON of ColumnMapping */
  json: string;

  /** ISO timestamp when profile was created */
  created_at: string;
}

/**
 * Import profile with parsed mapping
 */
export interface ImportProfileWithMapping {
  /** Profile name */
  name: string;

  /** Parsed column mapping */
  mapping: ColumnMapping;

  /** ISO timestamp when profile was created */
  created_at: string;
}

/**
 * Get a single import profile by name
 *
 * @param db - Database instance
 * @param name - Profile name
 * @returns The profile if found, null otherwise
 *
 * @example
 * ```typescript
 * const profile = getImportProfile(db, 'jira-standard');
 * if (profile) {
 *   const mapping = JSON.parse(profile.json);
 *   console.log(`Loaded profile: ${profile.name}`);
 * }
 * ```
 */
export function getImportProfile(db: Database, name: string): ImportProfile | null {
  const sql = 'SELECT * FROM import_profiles WHERE name = ?';
  const result = db.exec(sql, [name]);

  const profiles = parseImportProfilesResult(result);
  return profiles.length > 0 ? (profiles[0] ?? null) : null;
}

/**
 * Get a single import profile with parsed mapping
 *
 * @param db - Database instance
 * @param name - Profile name
 * @returns The profile with parsed mapping if found, null otherwise
 *
 * @example
 * ```typescript
 * const profile = getImportProfileWithMapping(db, 'jira-standard');
 * if (profile) {
 *   console.log(`Title column: ${profile.mapping.title}`);
 * }
 * ```
 */
export function getImportProfileWithMapping(
  db: Database,
  name: string
): ImportProfileWithMapping | null {
  const profile = getImportProfile(db, name);
  if (!profile) {
    return null;
  }

  try {
    const mapping = JSON.parse(profile.json) as ColumnMapping;
    return {
      name: profile.name,
      mapping,
      created_at: profile.created_at,
    };
  } catch (error) {
    console.error(`Failed to parse profile ${name}:`, error);
    return null;
  }
}

/**
 * Get all import profiles
 *
 * @param db - Database instance
 * @returns Array of all import profiles
 *
 * @example
 * ```typescript
 * const profiles = getAllImportProfiles(db);
 * console.log(`Found ${profiles.length} saved profiles`);
 * ```
 */
export function getAllImportProfiles(db: Database): ImportProfile[] {
  const sql = 'SELECT * FROM import_profiles ORDER BY created_at DESC';
  const result = db.exec(sql);

  return parseImportProfilesResult(result);
}

/**
 * Get all import profiles with parsed mappings
 *
 * @param db - Database instance
 * @returns Array of all import profiles with parsed mappings
 *
 * @example
 * ```typescript
 * const profiles = getAllImportProfilesWithMappings(db);
 * profiles.forEach(p => {
 *   console.log(`${p.name}: ${p.mapping.title} -> title`);
 * });
 * ```
 */
export function getAllImportProfilesWithMappings(db: Database): ImportProfileWithMapping[] {
  const profiles = getAllImportProfiles(db);

  return profiles
    .map((profile) => {
      try {
        const mapping = JSON.parse(profile.json) as ColumnMapping;
        return {
          name: profile.name,
          mapping,
          created_at: profile.created_at,
        };
      } catch (error) {
        console.error(`Failed to parse profile ${profile.name}:`, error);
        return null;
      }
    })
    .filter((p): p is ImportProfileWithMapping => p !== null);
}

/**
 * Save an import profile (insert or replace)
 *
 * If a profile with the same name exists, it will be replaced.
 *
 * @param db - Database instance
 * @param name - Profile name
 * @param mapping - Column mapping configuration
 *
 * @example
 * ```typescript
 * saveImportProfile(db, 'jira-standard', {
 *   title: 'Summary',
 *   type: 'Issue Type',
 *   start_date: 'Created',
 *   end_date: 'Due Date',
 *   owner: 'Assignee',
 *   lane: 'Status',
 *   project: 'Project',
 *   tags: 'Labels',
 *   idStrategy: 'column',
 *   id: 'Issue Key',
 *   tagsDelimiter: ','
 * });
 * ```
 */
export function saveImportProfile(db: Database, name: string, mapping: ColumnMapping): void {
  const json = JSON.stringify(mapping);
  const sql = `
    INSERT OR REPLACE INTO import_profiles (name, json, created_at)
    VALUES (?, ?, COALESCE(
      (SELECT created_at FROM import_profiles WHERE name = ?),
      datetime('now')
    ))
  `;

  db.run(sql, [name, json, name]);
}

/**
 * Delete an import profile
 *
 * @param db - Database instance
 * @param name - Profile name
 * @returns Number of rows deleted (1 if successful, 0 if profile not found)
 *
 * @example
 * ```typescript
 * const deleted = deleteImportProfile(db, 'old-profile');
 * if (deleted) {
 *   console.log('Profile deleted successfully');
 * }
 * ```
 */
export function deleteImportProfile(db: Database, name: string): number {
  const sql = 'DELETE FROM import_profiles WHERE name = ?';
  db.run(sql, [name]);

  return db.getRowsModified();
}

/**
 * Count import profiles
 *
 * @param db - Database instance
 * @returns Number of saved profiles
 *
 * @example
 * ```typescript
 * const count = countImportProfiles(db);
 * console.log(`${count} profiles saved`);
 * ```
 */
export function countImportProfiles(db: Database): number {
  const sql = 'SELECT COUNT(*) as count FROM import_profiles';
  const result = db.exec(sql);

  if (result.length === 0 || !result[0] || result[0].values.length === 0) {
    return 0;
  }

  const firstRow = result[0].values[0];
  return firstRow && firstRow[0] !== undefined ? (firstRow[0] as number) : 0;
}

/**
 * Check if an import profile exists
 *
 * @param db - Database instance
 * @param name - Profile name
 * @returns True if profile exists, false otherwise
 *
 * @example
 * ```typescript
 * if (importProfileExists(db, 'jira-standard')) {
 *   console.log('Profile already exists');
 * }
 * ```
 */
export function importProfileExists(db: Database, name: string): boolean {
  const sql = 'SELECT 1 FROM import_profiles WHERE name = ? LIMIT 1';
  const result = db.exec(sql, [name]);

  return result.length > 0 && (result[0]?.values.length ?? 0) > 0;
}

/**
 * Parse sql.js query result into typed ImportProfile array
 *
 * @param result - Raw query result from sql.js
 * @returns Array of typed ImportProfile objects
 */
function parseImportProfilesResult(result: QueryExecResult[]): ImportProfile[] {
  if (result.length === 0 || !result[0]) {
    return [];
  }

  const { columns, values } = result[0];

  return values.map((row): ImportProfile => {
    const profile: Record<string, unknown> = {};

    columns.forEach((col, i) => {
      profile[col] = row[i];
    });

    return profile as unknown as ImportProfile;
  });
}
