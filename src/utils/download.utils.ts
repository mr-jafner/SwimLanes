/**
 * Browser download utilities.
 */

/**
 * Builds a safe, descriptive filename for an exported artifact.
 *
 * @param label - Branch label or name to include in the filename
 * @param date - Generation date (defaults to now)
 * @param extension - File extension without the dot (defaults to 'html')
 * @returns A slugified filename, e.g. `swimlanes-main-plan-2026-06-25.html`
 *
 * @example
 * buildArtifactFilename('Main Plan') // 'swimlanes-main-plan-2026-06-25.html'
 */
export function buildArtifactFilename(
  label: string,
  date: Date = new Date(),
  extension = 'html'
): string {
  const slug =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'timeline';

  const iso = date.toISOString().split('T')[0];
  return `swimlanes-${slug}-${iso}.${extension}`;
}

/**
 * Triggers a browser download of a text payload as a file.
 *
 * Uses an object URL + temporary anchor; the URL is revoked afterwards to avoid
 * leaks. No-op outside a browser environment (no `document`).
 *
 * @param filename - Suggested filename for the download
 * @param content - File contents
 * @param mimeType - MIME type (defaults to 'text/html')
 */
export function downloadTextFile(filename: string, content: string, mimeType = 'text/html'): void {
  if (typeof document === 'undefined') return;

  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
}
