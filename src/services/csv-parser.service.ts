/**
 * CSV Parser Service for SwimLanes
 *
 * Provides robust CSV parsing with RFC 4180 compliance using PapaParse.
 * Handles edge cases including:
 * - UTF-8 BOM (Byte Order Mark)
 * - Various line endings (CRLF, LF)
 * - Quoted values with embedded commas, quotes, and line breaks
 * - Unicode characters and emoji
 * - Empty lines and trailing commas
 * - Malformed data with detailed error reporting
 *
 * @module services/csv-parser.service
 */

import Papa from 'papaparse';
import type { CSVParseOptions, ParsedRow } from '@/types/import.types';

/**
 * Parse error information
 */
export interface ParseError {
  /** Error type (e.g., 'Quotes', 'FieldMismatch', 'Delimiter') */
  type: string;

  /** Error code (e.g., 'UndetectableDelimiter', 'MissingQuotes') */
  code: string;

  /** Human-readable error message */
  message: string;

  /** Row number where error occurred (0-indexed, -1 for header errors) */
  row: number;
}

/**
 * Parse metadata
 */
export interface ParseMeta {
  /** Delimiter character used (auto-detected or specified) */
  delimiter: string;

  /** Line break character(s) used in the file */
  linebreak: string;

  /** Whether parsing was aborted */
  aborted: boolean;

  /** Whether file was truncated */
  truncated: boolean;

  /** Array of field names (column headers) */
  fields: string[];
}

/**
 * Complete parse result
 */
export interface ParseResult {
  /** Array of parsed rows as key-value objects */
  data: ParsedRow[];

  /** Array of errors encountered during parsing */
  errors: ParseError[];

  /** Metadata about the parsing operation */
  meta: ParseMeta;
}

/**
 * CSV Parser Service
 *
 * Usage:
 * ```typescript
 * const parser = new CSVParserService();
 * const result = parser.parseCSV(csvText, { trim: true });
 *
 * if (result.errors.length > 0) {
 *   console.warn('Parsing errors:', result.errors);
 * }
 *
 * console.log(`Parsed ${result.data.length} rows`);
 * ```
 */
export class CSVParserService {
  /**
   * Parse CSV text into an array of objects.
   *
   * This method:
   * 1. Removes UTF-8 BOM if present
   * 2. Normalizes line endings
   * 3. Parses CSV using PapaParse with RFC 4180 compliance
   * 4. Returns typed result with data, errors, and metadata
   *
   * @param text - Raw CSV text to parse
   * @param options - Optional parsing configuration
   * @returns Parse result with data array, errors, and metadata
   *
   * @example
   * ```typescript
   * const parser = new CSVParserService();
   *
   * // Basic usage with headers
   * const result = parser.parseCSV('name,age\nAlice,30\nBob,25');
   * // result.data = [{ name: 'Alice', age: '30' }, { name: 'Bob', age: '25' }]
   *
   * // Custom delimiter
   * const tsvResult = parser.parseCSV('name\tage\nAlice\t30', { delimiter: '\t' });
   *
   * // No headers
   * const noHeaderResult = parser.parseCSV('Alice,30\nBob,25', { headers: false });
   * // result.data = [{ '0': 'Alice', '1': '30' }, { '0': 'Bob', '1': '25' }]
   * ```
   */
  public parseCSV(text: string, options?: CSVParseOptions): ParseResult {
    // Handle null/undefined input
    if (text === null || text === undefined) {
      return {
        data: [],
        errors: [
          {
            type: 'Invalid',
            code: 'NullInput',
            message: 'Input text is null or undefined',
            row: -1,
          },
        ],
        meta: {
          delimiter: ',',
          linebreak: '\n',
          aborted: false,
          truncated: false,
          fields: [],
        },
      };
    }

    // Handle empty string
    if (text.trim() === '') {
      return {
        data: [],
        errors: [],
        meta: {
          delimiter: ',',
          linebreak: '\n',
          aborted: false,
          truncated: false,
          fields: [],
        },
      };
    }

    // Preprocess text
    let processedText = this.removeBOM(text);
    processedText = this.normalizeLineEndings(processedText);

    // Parse with PapaParse
    const parseResult = Papa.parse<ParsedRow>(processedText, {
      header: options?.headers ?? true,
      skipEmptyLines: options?.skipEmptyRows ?? true,
      delimiter: options?.delimiter ?? '', // Auto-detect if empty string
      quoteChar: '"',
      escapeChar: '"',
      transformHeader: (header: string) => ((options?.trim ?? true) ? header.trim() : header),
      transform: (value: string) => ((options?.trim ?? true) ? value.trim() : value),
      comments: false,
      dynamicTyping: false, // Keep everything as strings
      preview: 0, // Parse entire file
      fastMode: false, // Use full RFC 4180 parsing
    });

    // Convert PapaParse errors to our format
    const errors: ParseError[] = parseResult.errors.map((error) => ({
      type: error.type,
      code: error.code,
      message: error.message,
      row: error.row ?? -1,
    }));

    // Build metadata
    const meta: ParseMeta = {
      delimiter: parseResult.meta.delimiter,
      linebreak: parseResult.meta.linebreak,
      aborted: parseResult.meta.aborted,
      truncated: parseResult.meta.truncated,
      fields: parseResult.meta.fields ?? [],
    };

    return {
      data: parseResult.data,
      errors,
      meta,
    };
  }

  /**
   * Remove UTF-8 BOM (Byte Order Mark) from the beginning of text.
   *
   * Some CSV files exported from Excel or other tools include a UTF-8 BOM
   * (\uFEFF) at the start, which can cause parsing issues if not removed.
   *
   * @param text - Text to process
   * @returns Text with BOM removed if present
   *
   * @example
   * ```typescript
   * const parser = new CSVParserService();
   * const cleaned = parser['removeBOM']('\uFEFFname,age\nAlice,30');
   * // cleaned = 'name,age\nAlice,30'
   * ```
   */
  private removeBOM(text: string): string {
    if (text.charCodeAt(0) === 0xfeff) {
      return text.slice(1);
    }
    return text;
  }

  /**
   * Normalize line endings to LF (\n).
   *
   * Converts CRLF (\r\n) and CR (\r) line endings to LF for consistent parsing.
   *
   * @param text - Text to process
   * @returns Text with normalized line endings
   *
   * @example
   * ```typescript
   * const parser = new CSVParserService();
   * const normalized = parser['normalizeLineEndings']('name,age\r\nAlice,30\r\n');
   * // normalized = 'name,age\nAlice,30\n'
   * ```
   */
  private normalizeLineEndings(text: string): string {
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }
}

/**
 * Singleton instance of CSV parser service
 */
export const csvParserService = new CSVParserService();
