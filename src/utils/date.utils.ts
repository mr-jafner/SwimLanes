/**
 * Date utility functions for SwimLanes
 *
 * Handles date normalization from various formats to ISO 8601 (YYYY-MM-DD)
 * and date validation.
 */

/**
 * Supported date formats:
 * - YYYY-MM-DD (ISO 8601, already normalized)
 * - M/D/YYYY (e.g., 1/15/2025 or 12/31/2025)
 * - M-D-YYYY (e.g., 1-15-2025 or 12-31-2025)
 */
const ISO_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const SLASH_FORMAT = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
const DASH_MDY_FORMAT = /^\d{1,2}-\d{1,2}-\d{4}$/;

/**
 * Normalizes a date string to ISO 8601 format (YYYY-MM-DD)
 *
 * @param dateStr - Date string in supported format
 * @returns ISO 8601 formatted date string, or original string if format not recognized
 *
 * @example
 * normalizeDate('2025-01-15') // '2025-01-15' (already ISO)
 * normalizeDate('1/15/2025')  // '2025-01-15'
 * normalizeDate('1-15-2025')  // '2025-01-15'
 */
export function normalizeDate(dateStr: string | null | undefined): string | null {
  if (!dateStr || typeof dateStr !== 'string') {
    return null;
  }

  const trimmed = dateStr.trim();
  if (!trimmed) {
    return null;
  }

  // Already in ISO format
  if (ISO_FORMAT.test(trimmed)) {
    return trimmed;
  }

  // Handle M/D/YYYY format
  if (SLASH_FORMAT.test(trimmed)) {
    const parts = trimmed.split('/');
    const month = parts[0]!.padStart(2, '0');
    const day = parts[1]!.padStart(2, '0');
    const year = parts[2]!;
    return `${year}-${month}-${day}`;
  }

  // Handle M-D-YYYY format
  if (DASH_MDY_FORMAT.test(trimmed)) {
    const parts = trimmed.split('-');
    const month = parts[0]!.padStart(2, '0');
    const day = parts[1]!.padStart(2, '0');
    const year = parts[2]!;
    return `${year}-${month}-${day}`;
  }

  // Unrecognized format - return original
  return trimmed;
}

/**
 * Validates that a date string is a valid ISO 8601 date
 *
 * @param dateStr - Date string to validate
 * @returns True if valid ISO date, false otherwise
 *
 * @example
 * isValidISODate('2025-01-15') // true
 * isValidISODate('2025-13-01') // false (invalid month)
 * isValidISODate('invalid')    // false
 */
export function isValidISODate(dateStr: string | null | undefined): boolean {
  if (!dateStr || !ISO_FORMAT.test(dateStr)) {
    return false;
  }

  const date = new Date(dateStr);

  // Check if date is valid and matches input (catches invalid dates like 2025-02-30)
  return !isNaN(date.getTime()) && date.toISOString().startsWith(dateStr);
}

/**
 * Validates and normalizes a date string
 *
 * @param dateStr - Date string in any supported format
 * @returns Object with { valid: boolean, normalized: string | null, error?: string }
 *
 * @example
 * validateAndNormalizeDate('1/15/2025')
 * // { valid: true, normalized: '2025-01-15' }
 *
 * validateAndNormalizeDate('13/32/2025')
 * // { valid: false, normalized: null, error: 'Invalid date: 13/32/2025' }
 */
export function validateAndNormalizeDate(dateStr: string | null | undefined): {
  valid: boolean;
  normalized: string | null;
  error?: string;
} {
  const normalized = normalizeDate(dateStr);

  if (!normalized) {
    return {
      valid: false,
      normalized: null,
      error: dateStr ? `Empty or invalid date: ${dateStr}` : 'Date is required',
    };
  }

  if (!isValidISODate(normalized)) {
    return {
      valid: false,
      normalized: null,
      error: `Invalid date: ${dateStr}`,
    };
  }

  return {
    valid: true,
    normalized,
  };
}

/**
 * Formats an ISO date string for display
 *
 * @param isoDate - ISO 8601 date string (YYYY-MM-DD)
 * @param format - Output format ('short' | 'long')
 * @returns Formatted date string
 *
 * @example
 * formatDateForDisplay('2025-01-15', 'short') // '1/15/2025'
 * formatDateForDisplay('2025-01-15', 'long')  // 'January 15, 2025'
 */
export function formatDateForDisplay(
  isoDate: string | null | undefined,
  format: 'short' | 'long' = 'short'
): string {
  if (!isoDate || !isValidISODate(isoDate)) {
    return '';
  }

  const date = new Date(isoDate);

  if (format === 'long') {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Short format: M/D/YYYY
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Compares two dates
 *
 * @param date1 - First date (ISO string)
 * @param date2 - Second date (ISO string)
 * @returns -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareDates(
  date1: string | null | undefined,
  date2: string | null | undefined
): number {
  if (!date1 && !date2) return 0;
  if (!date1) return -1;
  if (!date2) return 1;

  return date1.localeCompare(date2);
}

/**
 * Checks if end_date is valid relative to start_date
 *
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string)
 * @returns True if end_date >= start_date or if either is null
 */
export function isValidDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): boolean {
  if (!startDate || !endDate) return true; // Allow null dates
  return compareDates(endDate, startDate) >= 0;
}
