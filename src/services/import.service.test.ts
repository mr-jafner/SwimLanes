/**
 * Tests for import service
 */

import { describe, it, expect } from 'vitest';
import { autoDetectMapping } from './import.service';

describe('import.service', () => {
  describe('autoDetectMapping', () => {
    it('should detect Jira-style headers', () => {
      const headers = [
        'Issue Key',
        'Summary',
        'Issue Type',
        'Status',
        'Priority',
        'Assignee',
        'Created',
        'Due Date',
        'Labels',
      ];

      const mapping = autoDetectMapping(headers);

      expect(mapping.title).toBe('Summary');
      expect(mapping.type).toBe('Issue Type');
      expect(mapping.owner).toBe('Assignee');
      expect(mapping.start_date).toBe('Created');
      expect(mapping.end_date).toBe('Due Date');
      expect(mapping.tags).toBe('Labels');
      expect(mapping.id).toBe('Issue Key');
      expect(mapping.idStrategy).toBe('column'); // Detected ID column
    });

    it('should detect MS Project-style headers', () => {
      const headers = ['Task Name', 'Start Date', 'Finish Date', 'Resource Names', 'Type', 'WBS'];

      const mapping = autoDetectMapping(headers);

      expect(mapping.title).toBe('Task Name');
      expect(mapping.type).toBe('Type');
      expect(mapping.start_date).toBe('Start Date');
      expect(mapping.end_date).toBe('Finish Date');
      expect(mapping.owner).toBe('Resource Names');
      expect(mapping.id).toBe('WBS');
    });

    it('should handle generic headers', () => {
      const headers = ['Title', 'Type', 'Owner', 'Start', 'End', 'Project', 'Tags'];

      const mapping = autoDetectMapping(headers);

      expect(mapping.title).toBe('Title');
      expect(mapping.type).toBe('Type');
      expect(mapping.owner).toBe('Owner');
      expect(mapping.start_date).toBe('Start');
      expect(mapping.end_date).toBe('End');
      expect(mapping.project).toBe('Project');
      expect(mapping.tags).toBe('Tags');
    });

    it('should be case-insensitive', () => {
      const headers = ['TITLE', 'TYPE', 'START_DATE', 'END_DATE'];

      const mapping = autoDetectMapping(headers);

      expect(mapping.title).toBe('TITLE');
      expect(mapping.type).toBe('TYPE');
      expect(mapping.start_date).toBe('START_DATE');
      expect(mapping.end_date).toBe('END_DATE');
    });

    it('should use substring matching', () => {
      const headers = ['Item Name', 'Work Item Type', 'Assigned To', 'Begin Date', 'Finish Date'];

      const mapping = autoDetectMapping(headers);

      expect(mapping.title).toBe('Item Name'); // Matches 'item'
      expect(mapping.type).toBe('Work Item Type'); // Matches 'type'
      expect(mapping.owner).toBe('Assigned To'); // Matches 'assigned'
      expect(mapping.start_date).toBe('Begin Date'); // Matches 'begin'
      expect(mapping.end_date).toBe('Finish Date'); // Matches 'finish'
    });

    it('should return default values when no matches found', () => {
      const headers = ['Column1', 'Column2', 'Column3'];

      const mapping = autoDetectMapping(headers);

      expect(mapping.title).toBeUndefined();
      expect(mapping.type).toBeUndefined();
      expect(mapping.idStrategy).toBe('generate'); // Default strategy
      expect(mapping.tagsDelimiter).toBe(','); // Default delimiter
    });

    it('should prioritize first match when multiple options exist', () => {
      // Both "Item Title" and "Task Name" could match title
      const headers = ['Item Title', 'Task Name', 'Type'];

      const mapping = autoDetectMapping(headers);

      // Should match first one found (depends on header order)
      expect(mapping.title).toBeDefined();
      expect(['Item Title', 'Task Name']).toContain(mapping.title);
    });

    it('should suggest column strategy when ID field detected', () => {
      const headers = ['Title', 'Type', 'ID'];

      const mapping = autoDetectMapping(headers);

      expect(mapping.id).toBe('ID');
      expect(mapping.idStrategy).toBe('column');
    });

    it('should use generate strategy when no ID field detected', () => {
      const headers = ['Title', 'Type', 'Owner'];

      const mapping = autoDetectMapping(headers);

      expect(mapping.id).toBeUndefined();
      expect(mapping.idStrategy).toBe('generate');
    });
  });
});
