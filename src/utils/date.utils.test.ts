/**
 * Tests for date utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeDate,
  isValidISODate,
  validateAndNormalizeDate,
  formatDateForDisplay,
  compareDates,
  isValidDateRange,
} from './date.utils';

describe('date.utils', () => {
  describe('normalizeDate', () => {
    it('should return ISO dates unchanged', () => {
      expect(normalizeDate('2025-01-15')).toBe('2025-01-15');
      expect(normalizeDate('2025-12-31')).toBe('2025-12-31');
    });

    it('should convert M/D/YYYY to ISO format', () => {
      expect(normalizeDate('1/15/2025')).toBe('2025-01-15');
      expect(normalizeDate('12/31/2025')).toBe('2025-12-31');
      expect(normalizeDate('3/5/2025')).toBe('2025-03-05');
    });

    it('should convert M-D-YYYY to ISO format', () => {
      expect(normalizeDate('1-15-2025')).toBe('2025-01-15');
      expect(normalizeDate('12-31-2025')).toBe('2025-12-31');
      expect(normalizeDate('3-5-2025')).toBe('2025-03-05');
    });

    it('should handle null and undefined', () => {
      expect(normalizeDate(null)).toBe(null);
      expect(normalizeDate(undefined)).toBe(null);
      expect(normalizeDate('')).toBe(null);
    });

    it('should return unrecognized formats unchanged', () => {
      expect(normalizeDate('January 15, 2025')).toBe('January 15, 2025');
      expect(normalizeDate('2025/01/15')).toBe('2025/01/15'); // YYYY/MM/DD not supported
      expect(normalizeDate('15-Jan-2025')).toBe('15-Jan-2025'); // DD-Mon-YYYY not supported
    });

    it('should trim whitespace', () => {
      expect(normalizeDate('  2025-01-15  ')).toBe('2025-01-15');
      expect(normalizeDate('  1/15/2025  ')).toBe('2025-01-15');
    });
  });

  describe('isValidISODate', () => {
    it('should validate correct ISO dates', () => {
      expect(isValidISODate('2025-01-15')).toBe(true);
      expect(isValidISODate('2025-12-31')).toBe(true);
      expect(isValidISODate('2024-02-29')).toBe(true); // Leap year
    });

    it('should reject invalid ISO dates', () => {
      expect(isValidISODate('2025-13-01')).toBe(false); // Invalid month
      expect(isValidISODate('2025-02-30')).toBe(false); // Invalid day
      expect(isValidISODate('2025-00-15')).toBe(false); // Invalid month
      expect(isValidISODate('2025-01-32')).toBe(false); // Invalid day
      expect(isValidISODate('2023-02-29')).toBe(false); // Not a leap year
    });

    it('should reject non-ISO formats', () => {
      expect(isValidISODate('1/15/2025')).toBe(false);
      expect(isValidISODate('15-01-2025')).toBe(false);
      expect(isValidISODate('January 15, 2025')).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(isValidISODate(null)).toBe(false);
      expect(isValidISODate(undefined)).toBe(false);
      expect(isValidISODate('')).toBe(false);
    });
  });

  describe('validateAndNormalizeDate', () => {
    it('should validate and normalize valid dates', () => {
      const result1 = validateAndNormalizeDate('1/15/2025');
      expect(result1.valid).toBe(true);
      expect(result1.normalized).toBe('2025-01-15');
      expect(result1.error).toBeUndefined();

      const result2 = validateAndNormalizeDate('2025-01-15');
      expect(result2.valid).toBe(true);
      expect(result2.normalized).toBe('2025-01-15');
    });

    it('should reject invalid dates with error messages', () => {
      const result1 = validateAndNormalizeDate('2025-13-01');
      expect(result1.valid).toBe(false);
      expect(result1.normalized).toBe(null);
      expect(result1.error).toContain('Invalid date');

      const result2 = validateAndNormalizeDate('13/32/2025');
      expect(result2.valid).toBe(false);
      expect(result2.error).toContain('Invalid date');
    });

    it('should handle empty values', () => {
      const result1 = validateAndNormalizeDate(null);
      expect(result1.valid).toBe(false);
      expect(result1.error).toContain('required');

      const result2 = validateAndNormalizeDate('');
      expect(result2.valid).toBe(false);
    });
  });

  describe('formatDateForDisplay', () => {
    it('should format short dates', () => {
      expect(formatDateForDisplay('2025-01-15', 'short')).toBe('1/15/2025');
      expect(formatDateForDisplay('2025-12-31', 'short')).toBe('12/31/2025');
    });

    it('should format long dates', () => {
      const result = formatDateForDisplay('2025-01-15', 'long');
      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2025');
    });

    it('should default to short format', () => {
      expect(formatDateForDisplay('2025-01-15')).toBe('1/15/2025');
    });

    it('should handle null and invalid dates', () => {
      expect(formatDateForDisplay(null)).toBe('');
      expect(formatDateForDisplay('')).toBe('');
      expect(formatDateForDisplay('invalid')).toBe('');
    });
  });

  describe('compareDates', () => {
    it('should compare dates correctly', () => {
      expect(compareDates('2025-01-15', '2025-01-20')).toBeLessThan(0);
      expect(compareDates('2025-01-20', '2025-01-15')).toBeGreaterThan(0);
      expect(compareDates('2025-01-15', '2025-01-15')).toBe(0);
    });

    it('should handle null values', () => {
      expect(compareDates(null, null)).toBe(0);
      expect(compareDates(null, '2025-01-15')).toBeLessThan(0);
      expect(compareDates('2025-01-15', null)).toBeGreaterThan(0);
    });
  });

  describe('isValidDateRange', () => {
    it('should validate correct date ranges', () => {
      expect(isValidDateRange('2025-01-15', '2025-01-20')).toBe(true);
      expect(isValidDateRange('2025-01-15', '2025-01-15')).toBe(true); // Same day is valid
    });

    it('should reject invalid date ranges', () => {
      expect(isValidDateRange('2025-01-20', '2025-01-15')).toBe(false);
    });

    it('should allow null dates', () => {
      expect(isValidDateRange(null, '2025-01-15')).toBe(true);
      expect(isValidDateRange('2025-01-15', null)).toBe(true);
      expect(isValidDateRange(null, null)).toBe(true);
    });
  });
});
