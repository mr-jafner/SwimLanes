/**
 * Import service for SwimLanes
 *
 * Handles the three-stage import workflow:
 * 1. Parse CSV/JSON → Detect column mappings
 * 2. Dry-run → Preview changes (added/updated/skipped)
 * 3. Commit → Apply changes to database
 *
 * Supports three ID strategies:
 * - generate: Auto-generate UUIDs
 * - column: Use CSV column as ID
 * - match: Match by project + title composite key
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ParsedRow,
  ColumnMapping,
  AutoDetectPatterns,
  DryRunResult,
  IDStrategy,
  ImportMode,
} from '@/types/import.types';
import type { Item } from '@/types/database.types';
import { databaseService } from './database.service';
import { getItems, insertItem, updateItem } from '@/db/queries/items.queries';
import {
  getAllImportProfilesWithMappings,
  getImportProfileWithMapping,
  saveImportProfile as saveProfileQuery,
  deleteImportProfile as deleteProfileQuery,
  importProfileExists,
} from '@/db/queries/import.queries';
import {
  normalizeType,
  validateRow,
  hashRow,
  parseTags,
  serializeTags,
  sanitizeString,
  isEmptyRow,
} from '@/utils/validation.utils';
import { normalizeDate } from '@/utils/date.utils';

/**
 * Auto-detection patterns for column mapping
 *
 * Maps field names to arrays of keywords to search for in CSV headers.
 * Matching is case-insensitive and uses substring matching.
 */
const AUTO_DETECT_PATTERNS: AutoDetectPatterns = {
  title: ['title', 'name', 'task', 'item', 'summary', 'subject', 'description'],
  type: ['type', 'kind', 'category', 'issue type', 'work item type'],
  start_date: [
    'start',
    'start_date',
    'start date',
    'begin',
    'begin date',
    'created',
    'created date',
  ],
  end_date: ['end', 'end_date', 'end date', 'finish', 'finish date', 'due', 'due date', 'deadline'],
  owner: [
    'owner',
    'assignee',
    'assigned to',
    'assigned',
    'resource',
    'resource names',
    'responsible',
  ],
  lane: ['lane', 'swim lane', 'swimlane', 'track', 'status', 'state'],
  project: ['project', 'epic', 'initiative', 'program', 'portfolio'],
  tags: ['tags', 'labels', 'keywords', 'categories'],
  id: ['id', 'key', 'issue key', 'item id', 'task id', 'wbs'],
};

/**
 * Auto-detect column mappings from CSV headers
 *
 * @param headers - Array of column headers from CSV
 * @returns Partial column mapping with detected fields
 *
 * @example
 * ```typescript
 * const headers = ['Issue Key', 'Summary', 'Issue Type', 'Assignee'];
 * const mapping = autoDetectMapping(headers);
 * // { title: 'Summary', type: 'Issue Type', owner: 'Assignee', id: 'Issue Key' }
 * ```
 */
export function autoDetectMapping(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {
    idStrategy: 'generate', // Default strategy
    tagsDelimiter: ',', // Default delimiter
  };

  // Normalize headers for matching (lowercase, trim)
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

  // For each field, try to find a matching header
  for (const [field, keywords] of Object.entries(AUTO_DETECT_PATTERNS)) {
    const matchIndex = normalizedHeaders.findIndex((header) =>
      keywords.some((keyword: string) => header.includes(keyword.toLowerCase()))
    );

    if (matchIndex !== -1) {
      const actualHeader = headers[matchIndex];
      if (actualHeader) {
        mapping[field as keyof ColumnMapping] = actualHeader as never;
      }
    }
  }

  // If we found an ID column, suggest 'column' strategy
  if (mapping.id) {
    mapping.idStrategy = 'column' as IDStrategy;
  }

  return mapping;
}

/**
 * Map and transform a row to an Item
 *
 * @param row - Parsed CSV row
 * @param mapping - Column mapping configuration
 * @param branchId - Target branch ID
 * @param existingId - Optional existing ID (for updates)
 * @returns Item object or null if validation fails
 */
function mapRowToItem(
  row: ParsedRow,
  mapping: ColumnMapping,
  branchId: string,
  existingId?: string
): { item: Item; sourceRowHash: string } | null {
  // Skip empty rows
  if (isEmptyRow(row)) {
    return null;
  }

  // Validate row
  const validation = validateRow(row, mapping);
  if (!validation.valid) {
    return null;
  }

  // Extract and transform fields
  const title = sanitizeString(row[mapping.title]);
  const typeRaw = sanitizeString(row[mapping.type]);
  const type = normalizeType(typeRaw);

  if (!title || !type) {
    return null;
  }

  // Normalize dates
  const startDate = mapping.start_date ? normalizeDate(row[mapping.start_date] as string) : null;
  const endDate = mapping.end_date ? normalizeDate(row[mapping.end_date] as string) : null;

  // Other fields
  const owner = mapping.owner ? sanitizeString(row[mapping.owner]) : null;
  const lane = mapping.lane ? sanitizeString(row[mapping.lane]) : null;
  const project = mapping.project ? sanitizeString(row[mapping.project]) : null;

  // Parse tags
  const tagsRaw = mapping.tags ? sanitizeString(row[mapping.tags]) : null;
  const tagsArray = tagsRaw ? parseTags(tagsRaw, mapping.tagsDelimiter) : [];
  const tags = serializeTags(tagsArray);

  // Determine ID based on strategy
  let id: string;
  if (existingId) {
    id = existingId;
  } else if (mapping.idStrategy === 'column' && mapping.id) {
    id = sanitizeString(row[mapping.id]) ?? uuidv4();
  } else {
    id = uuidv4();
  }

  // Calculate row hash for change detection
  const sourceRowHash = hashRow(row);

  const item: Item = {
    id,
    branch_id: branchId,
    type,
    title,
    start_date: startDate,
    end_date: endDate,
    owner,
    lane,
    project,
    tags,
    source_id: null,
    source_row_hash: sourceRowHash,
    updated_at: new Date().toISOString(),
  };

  return { item, sourceRowHash };
}

/**
 * Get match key for an item based on ID strategy
 *
 * @param item - Item to get key for
 * @param strategy - ID strategy
 * @returns Match key string
 */
function getMatchKey(item: Item, strategy: IDStrategy): string {
  if (strategy === 'match') {
    return `${item.project ?? ''}:${item.title}`;
  }
  return item.id;
}

/**
 * Perform a dry-run of the import
 *
 * Analyzes the data and returns a preview of what would be added, updated, or skipped.
 * Does not modify the database.
 *
 * **Features:**
 * - Validates all rows before processing
 * - Detects conflicts (duplicate IDs/keys within import batch)
 * - Identifies items that need updating (based on source_row_hash)
 * - Skips unchanged items to avoid unnecessary writes
 * - Supports 'upsert' and 'update-only' modes
 *
 * **Conflict Detection:**
 * Detects duplicate IDs/keys within the import data itself. For example:
 * - With 'column' strategy: Two rows with the same ID value
 * - With 'match' strategy: Two rows with the same project+title combination
 * Conflicts are reported separately and won't be imported.
 *
 * @param data - Parsed CSV rows
 * @param mapping - Column mapping configuration
 * @param branchId - Target branch ID
 * @param mode - Import mode ('upsert' | 'update-only')
 * @returns Dry-run result with added/updated/skipped/conflict items
 *
 * @example
 * ```typescript
 * const result = performDryRun(csvData, mapping, 'main', 'upsert');
 * console.log(`Will add: ${result.added.length}`);
 * console.log(`Will update: ${result.updated.length}`);
 * console.log(`Will skip: ${result.skipped.length}`);
 * console.log(`Conflicts: ${result.conflicts.length}`);
 * ```
 */
export function performDryRun(
  data: ParsedRow[],
  mapping: ColumnMapping,
  branchId: string,
  mode: ImportMode = 'upsert'
): DryRunResult {
  const result: DryRunResult = {
    added: [],
    updated: [],
    skipped: [],
    conflicts: [],
  };

  const db = databaseService.getDatabase();
  if (!db) {
    throw new Error('Database not initialized');
  }

  // Get existing items from target branch
  const existingItems = getItems(db, branchId);
  const existingMap = new Map<string, Item>();

  // Build lookup map based on ID strategy
  existingItems.forEach((item) => {
    const key = getMatchKey(item, mapping.idStrategy);
    existingMap.set(key, item);
  });

  // Track items we've seen in this import batch to detect duplicates
  const importBatchMap = new Map<string, number>(); // key -> first row index

  // Process each row
  data.forEach((row, idx) => {
    // Skip empty rows
    if (isEmptyRow(row)) {
      return;
    }

    // Validate row
    const validation = validateRow(row, mapping);
    if (!validation.valid) {
      result.skipped.push({
        row,
        reason: validation.errors.join(', '),
        rowIndex: idx,
      });
      return;
    }

    // Try to map row to item
    const mapped = mapRowToItem(row, mapping, branchId);
    if (!mapped) {
      result.skipped.push({
        row,
        reason: 'Failed to map row to item',
        rowIndex: idx,
      });
      return;
    }

    const { item, sourceRowHash } = mapped;
    const matchKey = getMatchKey(item, mapping.idStrategy);

    // Check for duplicates within the import batch (conflicts)
    if (importBatchMap.has(matchKey)) {
      const firstOccurrenceIdx = importBatchMap.get(matchKey)!;
      result.conflicts.push({
        row,
        rowIndex: idx,
        reason: `Duplicate ${mapping.idStrategy === 'match' ? 'project+title' : 'ID'}: conflicts with row ${firstOccurrenceIdx + 1}`,
        matchKey,
      });
      return;
    }

    // Track this item in the import batch
    importBatchMap.set(matchKey, idx);

    const existing = existingMap.get(matchKey);

    if (existing) {
      // Item exists - check if it changed
      const hasChanged = existing.source_row_hash !== sourceRowHash;

      if (hasChanged) {
        result.updated.push({
          item,
          existing,
          rowIndex: idx,
          sourceRowHash,
        });
      } else {
        // Item exists but unchanged - skip
        result.skipped.push({
          row,
          reason: 'No changes detected',
          rowIndex: idx,
        });
      }
    } else {
      // Item doesn't exist
      if (mode === 'update-only') {
        result.skipped.push({
          row,
          reason: 'New item (update-only mode)',
          rowIndex: idx,
        });
      } else {
        result.added.push({
          item,
          rowIndex: idx,
          sourceRowHash,
        });
      }
    }
  });

  return result;
}

/**
 * Commit an import to the database
 *
 * Applies the changes from a dry-run result to the database.
 * Creates new items and updates existing items.
 *
 * @param dryRunResult - Result from performDryRun
 * @param branchId - Target branch ID
 * @returns Object with counts of added and updated items
 *
 * @example
 * ```typescript
 * const result = performDryRun(data, mapping, 'main');
 * const committed = await commitImport(result, 'main');
 * console.log(`Added ${committed.addedCount}, updated ${committed.updatedCount}`);
 * ```
 */
export async function commitImport(
  dryRunResult: DryRunResult,
  branchId: string
): Promise<{ addedCount: number; updatedCount: number }> {
  const db = databaseService.getDatabase();
  if (!db) {
    throw new Error('Database not initialized');
  }

  let addedCount = 0;
  let updatedCount = 0;

  // Insert new items
  dryRunResult.added.forEach((dryRunItem) => {
    try {
      insertItem(db, dryRunItem.item);
      addedCount++;
    } catch (error) {
      console.error(`Failed to insert item ${dryRunItem.item.id}:`, error);
    }
  });

  // Update existing items
  dryRunResult.updated.forEach((dryRunItem) => {
    try {
      const { item, existing } = dryRunItem;
      if (!existing) return;

      updateItem(db, item.id, branchId, {
        type: item.type,
        title: item.title,
        start_date: item.start_date,
        end_date: item.end_date,
        owner: item.owner,
        lane: item.lane,
        project: item.project,
        tags: item.tags,
        source_row_hash: item.source_row_hash,
      });
      updatedCount++;
    } catch (error) {
      console.error(`Failed to update item ${dryRunItem.item.id}:`, error);
    }
  });

  // Persist changes to IndexedDB
  await databaseService.saveToIndexedDB();

  return { addedCount, updatedCount };
}

/**
 * Get all saved import profiles
 *
 * @returns Array of profiles with parsed mappings
 */
export function getAllProfiles() {
  const db = databaseService.getDatabase();
  if (!db) {
    throw new Error('Database not initialized');
  }

  return getAllImportProfilesWithMappings(db);
}

/**
 * Get a single import profile by name
 *
 * @param name - Profile name
 * @returns Profile with parsed mapping, or null if not found
 */
export function getProfile(name: string) {
  const db = databaseService.getDatabase();
  if (!db) {
    throw new Error('Database not initialized');
  }

  return getImportProfileWithMapping(db, name);
}

/**
 * Save an import profile
 *
 * @param name - Profile name
 * @param mapping - Column mapping configuration
 * @returns True if saved successfully
 */
export async function saveProfile(name: string, mapping: ColumnMapping): Promise<boolean> {
  const db = databaseService.getDatabase();
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    saveProfileQuery(db, name, mapping);
    await databaseService.saveToIndexedDB();
    return true;
  } catch (error) {
    console.error('Failed to save profile:', error);
    return false;
  }
}

/**
 * Delete an import profile
 *
 * @param name - Profile name
 * @returns True if deleted successfully
 */
export async function deleteProfile(name: string): Promise<boolean> {
  const db = databaseService.getDatabase();
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const deleted = deleteProfileQuery(db, name);
    if (deleted > 0) {
      await databaseService.saveToIndexedDB();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to delete profile:', error);
    return false;
  }
}

/**
 * Check if a profile name already exists
 *
 * @param name - Profile name
 * @returns True if profile exists
 */
export function profileExists(name: string): boolean {
  const db = databaseService.getDatabase();
  if (!db) {
    throw new Error('Database not initialized');
  }

  return importProfileExists(db, name);
}

/**
 * Import service singleton
 */
export const importService = {
  autoDetectMapping,
  performDryRun,
  commitImport,
  getAllProfiles,
  getProfile,
  saveProfile,
  deleteProfile,
  profileExists,
};
