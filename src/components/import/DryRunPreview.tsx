/**
 * Dry-Run Preview Component
 *
 * Displays the results of a dry-run import analysis.
 * Shows counts and previews of items that will be added, updated, or skipped.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { DryRunResult, DryRunItem, SkippedRow } from '@/types/import.types';
import { formatDateForDisplay } from '@/utils/date.utils';

export interface DryRunPreviewProps {
  /** Dry-run result to display */
  result: DryRunResult;

  /** Maximum number of items to show in each table */
  maxPreviewItems?: number;
}

/**
 * DryRunPreview component
 */
export function DryRunPreview({ result, maxPreviewItems = 5 }: DryRunPreviewProps) {
  const { added, updated, skipped } = result;

  const totalChanges = added.length + updated.length;
  const hasChanges = totalChanges > 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Added */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">To Be Added</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{added.length}</span>
              <Badge variant="default" className="bg-green-600">
                New
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Updated */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              To Be Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{updated.length}</span>
              <Badge variant="default" className="bg-yellow-600">
                Changed
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Skipped */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              To Be Skipped
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{skipped.length}</span>
              <Badge variant="secondary">Skipped</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle>Import Summary</CardTitle>
          <CardDescription>
            {hasChanges
              ? `Ready to import ${totalChanges} item${totalChanges === 1 ? '' : 's'}`
              : 'No changes to import'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">New items:</span>
              <span className="font-medium">{added.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Updates:</span>
              <span className="font-medium">{updated.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Skipped:</span>
              <span className="font-medium">{skipped.length}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-medium">Total rows processed:</span>
              <span className="font-medium">{added.length + updated.length + skipped.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items to be Added */}
      {added.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Items to be Added ({added.length})</CardTitle>
            <CardDescription>
              {added.length > maxPreviewItems
                ? `Showing first ${maxPreviewItems} of ${added.length} items`
                : 'All new items'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ItemsTable items={added.slice(0, maxPreviewItems)} showExisting={false} />
          </CardContent>
        </Card>
      )}

      {/* Items to be Updated */}
      {updated.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Items to be Updated ({updated.length})</CardTitle>
            <CardDescription>
              {updated.length > maxPreviewItems
                ? `Showing first ${maxPreviewItems} of ${updated.length} items`
                : 'All items with changes'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ItemsTable items={updated.slice(0, maxPreviewItems)} showExisting={true} />
          </CardContent>
        </Card>
      )}

      {/* Skipped Rows */}
      {skipped.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Skipped Rows ({skipped.length})</CardTitle>
            <CardDescription>
              {skipped.length > maxPreviewItems
                ? `Showing first ${maxPreviewItems} of ${skipped.length} rows`
                : 'All skipped rows with reasons'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SkippedRowsTable skipped={skipped.slice(0, maxPreviewItems)} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Table showing items (added or updated)
 */
function ItemsTable({ items, showExisting }: { items: DryRunItem[]; showExisting: boolean }) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Project</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No items
              </TableCell>
            </TableRow>
          ) : (
            items.map((dryRunItem, idx) => {
              const { item, existing } = dryRunItem;
              return (
                <TableRow key={idx}>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.title}
                    {showExisting && existing && item.title !== existing.title && (
                      <div className="text-xs text-muted-foreground line-through">
                        {existing.title}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.start_date ? formatDateForDisplay(item.start_date, 'short') : '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.end_date ? formatDateForDisplay(item.end_date, 'short') : '—'}
                  </TableCell>
                  <TableCell className="text-sm">{item.owner || '—'}</TableCell>
                  <TableCell className="text-sm">{item.project || '—'}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Table showing skipped rows
 */
function SkippedRowsTable({ skipped }: { skipped: SkippedRow[] }) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Row</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Data Preview</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {skipped.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                No skipped rows
              </TableCell>
            </TableRow>
          ) : (
            skipped.map((skippedRow, idx) => {
              // Get first few fields from row for preview
              const previewFields = Object.entries(skippedRow.row)
                .slice(0, 3)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');

              return (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-sm">
                    {skippedRow.rowIndex !== undefined ? skippedRow.rowIndex + 1 : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive" className="font-normal">
                      {skippedRow.reason}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-md">
                    {previewFields || '(empty row)'}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
