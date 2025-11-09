/**
 * Validation utilities for SwimLanes import workflow
 *
 * Handles row validation, type normalization, and data transformation.
 */

import type { ItemType, ParsedRow, ColumnMapping } from '@/types';
import { validateAndNormalizeDate, isValidDateRange } from './date.utils';

/**
 * Valid item types
 */
const VALID_TYPES: readonly ItemType[] = ['task', 'milestone', 'release', 'meeting'];

/**
 * Type synonyms mapping for normalization
 * Maps various input formats to canonical ItemType values
 */
const TYPE_SYNONYMS: Record<string, ItemType> = {
  // Task synonyms
  task: 'task',
  tasks: 'task',
  story: 'task',
  'user story': 'task',
  userstory: 'task',
  bug: 'task',
  issue: 'task',
  'sub-task': 'task',
  subtask: 'task',
  item: 'task',
  work: 'task',
  'work item': 'task',

  // Milestone synonyms
  milestone: 'milestone',
  milestones: 'milestone',
  marker: 'milestone',
  checkpoint: 'milestone',
  gate: 'milestone',

  // Release synonyms
  release: 'release',
  releases: 'release',
  deployment: 'release',
  deploy: 'release',
  launch: 'release',
  epic: 'release',
  version: 'release',

  // Meeting synonyms
  meeting: 'meeting',
  meetings: 'meeting',
  event: 'meeting',
  review: 'meeting',
  retrospective: 'meeting',
  standup: 'meeting',
  'stand-up': 'meeting',
  sync: 'meeting',
};

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Normalizes a type string to a valid ItemType
 *
 * @param typeStr - Type string from CSV
 * @returns Normalized ItemType or null if invalid
 *
 * @example
 * normalizeType('Task')        // 'task'
 * normalizeType('User Story')  // 'task'
 * normalizeType('Epic')        // 'release'
 * normalizeType('invalid')     // null
 */
export function normalizeType(typeStr: string | null | undefined): ItemType | null {
  if (!typeStr || typeof typeStr !== 'string') {
    return null;
  }

  const normalized = typeStr.toLowerCase().trim();
  return TYPE_SYNONYMS[normalized] ?? null;
}

/**
 * Validates that a type is one of the valid ItemType values
 *
 * @param type - Type to validate
 * @returns True if valid ItemType
 */
export function isValidType(type: string | null | undefined): type is ItemType {
  if (!type) return false;
  return VALID_TYPES.includes(type as ItemType);
}

/**
 * Parses a tags string into an array
 *
 * @param tagsStr - Tags string (comma, semicolon, or pipe delimited)
 * @param delimiter - Delimiter to use (auto-detected if not provided)
 * @returns Array of trimmed tag strings
 *
 * @example
 * parseTags('frontend, backend, api')  // ['frontend', 'backend', 'api']
 * parseTags('dev;test;prod', ';')      // ['dev', 'test', 'prod']
 */
export function parseTags(tagsStr: string | null | undefined, delimiter?: string): string[] {
  if (!tagsStr || typeof tagsStr !== 'string') {
    return [];
  }

  const trimmed = tagsStr.trim();
  if (!trimmed) {
    return [];
  }

  // Auto-detect delimiter if not provided
  const actualDelimiter =
    delimiter || (trimmed.includes(';') ? ';' : trimmed.includes('|') ? '|' : ',');

  return trimmed
    .split(actualDelimiter)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

/**
 * Serializes tags array back to a comma-delimited string
 *
 * @param tags - Array of tag strings
 * @returns Comma-delimited string or null if empty
 */
export function serializeTags(tags: string[] | null | undefined): string | null {
  if (!tags || tags.length === 0) {
    return null;
  }
  return tags.join(', ');
}

/**
 * Generates a hash of a row for change detection
 *
 * @param row - Parsed CSV row
 * @returns Hash string
 */
export function hashRow(row: ParsedRow): string {
  const str = JSON.stringify(row);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Validates a row for import
 *
 * Checks:
 * - Required fields (title, type)
 * - Valid type
 * - Valid dates
 * - Valid date range (end_date >= start_date)
 *
 * @param row - Parsed CSV row
 * @param mapping - Column mapping configuration
 * @returns Validation result with errors array
 */
export function validateRow(row: ParsedRow, mapping: ColumnMapping): ValidationResult {
  const errors: string[] = [];

  // Validate title (required)
  const title = row[mapping.title];
  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('Title is required');
  }

  // Validate type (required)
  const typeRaw = row[mapping.type];
  if (!typeRaw || typeof typeRaw !== 'string' || !typeRaw.trim()) {
    errors.push('Type is required');
  } else {
    const normalizedType = normalizeType(typeRaw);
    if (!normalizedType) {
      errors.push(`Invalid type: "${typeRaw}". Must be one of: ${VALID_TYPES.join(', ')}`);
    }
  }

  // Validate start_date (optional, but must be valid if present)
  if (mapping.start_date) {
    const startDateRaw = row[mapping.start_date];
    if (startDateRaw) {
      const result = validateAndNormalizeDate(startDateRaw as string);
      if (!result.valid) {
        errors.push(`Invalid start date: ${result.error}`);
      }
    }
  }

  // Validate end_date (optional, but must be valid if present)
  let normalizedStartDate: string | null = null;
  let normalizedEndDate: string | null = null;

  if (mapping.start_date) {
    const startResult = validateAndNormalizeDate(row[mapping.start_date] as string);
    if (startResult.valid) {
      normalizedStartDate = startResult.normalized;
    }
  }

  if (mapping.end_date) {
    const endDateRaw = row[mapping.end_date];
    if (endDateRaw) {
      const result = validateAndNormalizeDate(endDateRaw as string);
      if (!result.valid) {
        errors.push(`Invalid end date: ${result.error}`);
      } else {
        normalizedEndDate = result.normalized;
      }
    }
  }

  // Validate date range
  if (normalizedStartDate && normalizedEndDate) {
    if (!isValidDateRange(normalizedStartDate, normalizedEndDate)) {
      errors.push('End date must be on or after start date');
    }
  }

  // Validate ID column if using 'column' strategy
  if (mapping.idStrategy === 'column') {
    if (!mapping.id) {
      errors.push('ID column must be specified when using column ID strategy');
    } else {
      const idValue = row[mapping.id];
      if (!idValue || typeof idValue !== 'string' || !idValue.trim()) {
        errors.push('ID value is required when using column ID strategy');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates required fields in a column mapping
 *
 * @param mapping - Column mapping to validate
 * @returns Validation result with errors array
 */
export function validateColumnMapping(mapping: Partial<ColumnMapping>): ValidationResult {
  const errors: string[] = [];

  if (!mapping.title) {
    errors.push('Title column mapping is required');
  }

  if (!mapping.type) {
    errors.push('Type column mapping is required');
  }

  if (!mapping.idStrategy) {
    errors.push('ID strategy is required');
  }

  if (mapping.idStrategy === 'column' && !mapping.id) {
    errors.push('ID column must be specified when using column ID strategy');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes a string value (trim, handle null/undefined)
 *
 * @param value - Value to sanitize
 * @returns Sanitized string or null
 */
export function sanitizeString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const stringValue = typeof value === 'string' ? value : String(value);
  const trimmed = stringValue.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Checks if a row appears to be empty (all values null/empty)
 *
 * @param row - Parsed CSV row
 * @returns True if row is empty
 */
export function isEmptyRow(row: ParsedRow): boolean {
  return Object.values(row).every(
    (value) => value === null || value === undefined || String(value).trim() === ''
  );
}
