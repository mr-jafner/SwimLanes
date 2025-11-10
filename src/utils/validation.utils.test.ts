/**
 * Tests for validation utility functions
 */

import { describe, it, expect } from 'vitest';
import type { ColumnMapping, ParsedRow } from '@/types/import.types';
import {
  normalizeType,
  isValidType,
  parseTags,
  serializeTags,
  hashRow,
  validateRow,
  validateColumnMapping,
  sanitizeString,
  isEmptyRow,
} from './validation.utils';

describe('validation.utils', () => {
  describe('normalizeType', () => {
    it('should normalize task types', () => {
      expect(normalizeType('Task')).toBe('task');
      expect(normalizeType('TASK')).toBe('task');
      expect(normalizeType('Story')).toBe('task');
      expect(normalizeType('User Story')).toBe('task');
      expect(normalizeType('Bug')).toBe('task');
    });

    it('should normalize milestone types', () => {
      expect(normalizeType('Milestone')).toBe('milestone');
      expect(normalizeType('MILESTONE')).toBe('milestone');
      expect(normalizeType('Marker')).toBe('milestone');
      expect(normalizeType('Checkpoint')).toBe('milestone');
    });

    it('should normalize release types', () => {
      expect(normalizeType('Release')).toBe('release');
      expect(normalizeType('Epic')).toBe('release');
      expect(normalizeType('Deployment')).toBe('release');
    });

    it('should normalize meeting types', () => {
      expect(normalizeType('Meeting')).toBe('meeting');
      expect(normalizeType('Event')).toBe('meeting');
      expect(normalizeType('Review')).toBe('meeting');
    });

    it('should return null for invalid types', () => {
      expect(normalizeType('invalid')).toBe(null);
      expect(normalizeType('')).toBe(null);
      expect(normalizeType(null)).toBe(null);
      expect(normalizeType(undefined)).toBe(null);
    });

    it('should handle whitespace', () => {
      expect(normalizeType('  Task  ')).toBe('task');
      expect(normalizeType('  User Story  ')).toBe('task');
    });
  });

  describe('isValidType', () => {
    it('should validate correct types', () => {
      expect(isValidType('task')).toBe(true);
      expect(isValidType('milestone')).toBe(true);
      expect(isValidType('release')).toBe(true);
      expect(isValidType('meeting')).toBe(true);
    });

    it('should reject invalid types', () => {
      expect(isValidType('Task')).toBe(false); // Must be lowercase
      expect(isValidType('invalid')).toBe(false);
      expect(isValidType(null)).toBe(false);
      expect(isValidType('')).toBe(false);
    });
  });

  describe('parseTags', () => {
    it('should parse comma-delimited tags', () => {
      expect(parseTags('frontend, backend, api')).toEqual(['frontend', 'backend', 'api']);
      expect(parseTags('tag1,tag2,tag3')).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should parse semicolon-delimited tags', () => {
      expect(parseTags('dev;test;prod', ';')).toEqual(['dev', 'test', 'prod']);
    });

    it('should parse pipe-delimited tags', () => {
      expect(parseTags('tag1|tag2|tag3', '|')).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should auto-detect delimiter', () => {
      expect(parseTags('a;b;c')).toEqual(['a', 'b', 'c']); // Auto-detects semicolon
      expect(parseTags('a|b|c')).toEqual(['a', 'b', 'c']); // Auto-detects pipe
      expect(parseTags('a,b,c')).toEqual(['a', 'b', 'c']); // Defaults to comma
    });

    it('should trim whitespace from tags', () => {
      expect(parseTags('  tag1  ,  tag2  ,  tag3  ')).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should filter empty tags', () => {
      expect(parseTags('tag1,,tag2')).toEqual(['tag1', 'tag2']);
      expect(parseTags('tag1,  ,tag2')).toEqual(['tag1', 'tag2']);
    });

    it('should handle null and empty strings', () => {
      expect(parseTags(null)).toEqual([]);
      expect(parseTags('')).toEqual([]);
      expect(parseTags('   ')).toEqual([]);
    });
  });

  describe('serializeTags', () => {
    it('should serialize tags to comma-delimited string', () => {
      expect(serializeTags(['frontend', 'backend', 'api'])).toBe('frontend, backend, api');
      expect(serializeTags(['tag1'])).toBe('tag1');
    });

    it('should return null for empty arrays', () => {
      expect(serializeTags([])).toBe(null);
      expect(serializeTags(null)).toBe(null);
      expect(serializeTags(undefined)).toBe(null);
    });
  });

  describe('hashRow', () => {
    it('should generate consistent hashes', () => {
      const row1: ParsedRow = { title: 'Test', type: 'task' };
      const row2: ParsedRow = { title: 'Test', type: 'task' };
      expect(hashRow(row1)).toBe(hashRow(row2));
    });

    it('should generate different hashes for different data', () => {
      const row1: ParsedRow = { title: 'Test 1', type: 'task' };
      const row2: ParsedRow = { title: 'Test 2', type: 'task' };
      expect(hashRow(row1)).not.toBe(hashRow(row2));
    });

    it('should handle complex objects', () => {
      const row: ParsedRow = {
        title: 'Complex task',
        type: 'task',
        owner: 'Alice',
        tags: 'frontend,backend',
      };
      const hash = hashRow(row);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });
  });

  describe('validateRow', () => {
    const validMapping: ColumnMapping = {
      title: 'Title',
      type: 'Type',
      start_date: 'Start',
      end_date: 'End',
      owner: 'Owner',
      lane: 'Lane',
      project: 'Project',
      tags: 'Tags',
      id: 'ID',
      idStrategy: 'generate',
      tagsDelimiter: ',',
    };

    it('should validate valid rows', () => {
      const row: ParsedRow = {
        Title: 'Test task',
        Type: 'Task',
        Start: '2025-01-15',
        End: '2025-01-20',
      };
      const result = validateRow(row, validMapping);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject rows missing title', () => {
      const row: ParsedRow = {
        Title: '',
        Type: 'Task',
      };
      const result = validateRow(row, validMapping);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title is required');
    });

    it('should reject rows missing type', () => {
      const row: ParsedRow = {
        Title: 'Test task',
        Type: '',
      };
      const result = validateRow(row, validMapping);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Type is required');
    });

    it('should reject rows with invalid type', () => {
      const row: ParsedRow = {
        Title: 'Test task',
        Type: 'InvalidType',
      };
      const result = validateRow(row, validMapping);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid type'))).toBe(true);
    });

    it('should reject rows with invalid date range', () => {
      const row: ParsedRow = {
        Title: 'Test task',
        Type: 'Task',
        Start: '2025-01-20',
        End: '2025-01-15', // End before start
      };
      const result = validateRow(row, validMapping);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('End date'))).toBe(true);
    });

    it('should require ID when using column strategy', () => {
      const mapping: ColumnMapping = {
        ...validMapping,
        idStrategy: 'column',
      };
      const row: ParsedRow = {
        Title: 'Test task',
        Type: 'Task',
        ID: '', // Empty ID
      };
      const result = validateRow(row, mapping);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('ID'))).toBe(true);
    });
  });

  describe('validateColumnMapping', () => {
    it('should validate complete mappings', () => {
      const mapping: ColumnMapping = {
        title: 'Title',
        type: 'Type',
        start_date: '',
        end_date: '',
        owner: '',
        lane: '',
        project: '',
        tags: '',
        id: '',
        idStrategy: 'generate',
        tagsDelimiter: ',',
      };
      const result = validateColumnMapping(mapping);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject mappings without title', () => {
      const mapping: Partial<ColumnMapping> = {
        type: 'Type',
        idStrategy: 'generate',
      };
      const result = validateColumnMapping(mapping);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title column mapping is required');
    });

    it('should reject mappings without type', () => {
      const mapping: Partial<ColumnMapping> = {
        title: 'Title',
        idStrategy: 'generate',
      };
      const result = validateColumnMapping(mapping);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Type column mapping is required');
    });

    it('should require ID column for column strategy', () => {
      const mapping: Partial<ColumnMapping> = {
        title: 'Title',
        type: 'Type',
        idStrategy: 'column',
      };
      const result = validateColumnMapping(mapping);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('ID column'))).toBe(true);
    });
  });

  describe('sanitizeString', () => {
    it('should sanitize strings', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
      expect(sanitizeString('test')).toBe('test');
    });

    it('should return null for empty strings', () => {
      expect(sanitizeString('')).toBe(null);
      expect(sanitizeString('   ')).toBe(null);
    });

    it('should return null for null and undefined', () => {
      expect(sanitizeString(null)).toBe(null);
      expect(sanitizeString(undefined)).toBe(null);
    });

    it('should convert non-strings to strings', () => {
      expect(sanitizeString(123)).toBe('123');
      expect(sanitizeString(true)).toBe('true');
    });
  });

  describe('isEmptyRow', () => {
    it('should detect empty rows', () => {
      expect(isEmptyRow({})).toBe(true);
      expect(isEmptyRow({ col1: '', col2: '' })).toBe(true);
      expect(isEmptyRow({ col1: '   ', col2: '  ' })).toBe(true);
      expect(isEmptyRow({ col1: '', col2: '' })).toBe(true);
    });

    it('should detect non-empty rows', () => {
      expect(isEmptyRow({ col1: 'value' })).toBe(false);
      expect(isEmptyRow({ col1: '', col2: 'value' })).toBe(false);
    });
  });
});
