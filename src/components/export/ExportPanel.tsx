import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBranchStore } from '@/stores/branch.store';
import { useTimelineStore } from '@/stores/timeline.store';
import { databaseService } from '@/services/database.service';
import { getItems } from '@/db/queries/items.queries';
import { generateTimelineArtifact } from '@/services/export.service';
import { buildArtifactFilename, downloadTextFile } from '@/utils/download.utils';
import type { ZoomLevel, LaneGroupBy } from '@/types/timeline.types';
import type { ExportFilters } from '@/types/export.types';

const ZOOM_OPTIONS: { value: ZoomLevel; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
];

const GROUP_BY_OPTIONS: { value: LaneGroupBy; label: string }[] = [
  { value: 'lane', label: 'Lane' },
  { value: 'project', label: 'Project' },
  { value: 'owner', label: 'Owner' },
  { value: 'type', label: 'Type' },
];

/**
 * ExportPanel - Generates a standalone, self-contained HTML timeline artifact
 * for a selected branch and triggers a browser download.
 *
 * Defaults mirror the current timeline view (branch, zoom, grouping) and the
 * active timeline filters can optionally be baked in. See `export.service.ts`.
 */
export function ExportPanel() {
  const { viewBranch, branches, refreshBranches } = useBranchStore();
  const { zoomLevel, laneGroupBy, filterType, filterProject, filterStartDate, filterEndDate } =
    useTimelineStore();

  const [branchId, setBranchId] = useState(viewBranch);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([viewBranch]);
  const [zoom, setZoom] = useState<ZoomLevel>(zoomLevel);
  const [groupBy, setGroupBy] = useState<LaneGroupBy>(laneGroupBy);
  const [applyFilters, setApplyFilters] = useState(true);
  const [title, setTitle] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Ensure branch list is loaded for the selectors
  useEffect(() => {
    refreshBranches().catch(() => {
      /* surfaced on export attempt */
    });
  }, [refreshBranches]);

  const hasActiveFilters = Boolean(filterType || filterProject || filterStartDate || filterEndDate);

  /** The initial scenario is always included. */
  const includedBranchIds = selectedBranchIds.includes(branchId)
    ? selectedBranchIds
    : [branchId, ...selectedBranchIds];

  const toggleBranch = (id: string, checked: boolean) => {
    setSelectedBranchIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      // Never drop the initial scenario.
      next.add(branchId);
      return Array.from(next);
    });
  };

  const handleExport = () => {
    setIsExporting(true);
    try {
      if (!databaseService.isReady()) {
        throw new Error('Database is not ready yet');
      }

      const db = databaseService.getDatabase();

      const filters: ExportFilters = applyFilters
        ? {
            type: filterType || undefined,
            project: filterProject || undefined,
            startDate: filterStartDate || undefined,
            endDate: filterEndDate || undefined,
          }
        : {};

      // Bake the initial scenario first, then any other selected scenarios.
      const orderedIds = [branchId, ...includedBranchIds.filter((id) => id !== branchId)];
      const branchInputs = orderedIds.map((id) => {
        const branch = branches.find((b) => b.branch_id === id);
        return {
          branchId: id,
          label: branch?.label || id,
          items: getItems(db, id),
        };
      });

      const activeBranch = branches.find((b) => b.branch_id === branchId);
      const activeLabel = activeBranch?.label || branchId;
      const activeCount = branchInputs.find((b) => b.branchId === branchId)?.items.length ?? 0;

      const generatedAt = new Date();
      const html = generateTimelineArtifact(branchInputs, {
        activeBranchId: branchId,
        zoomLevel: zoom,
        laneGroupBy: groupBy,
        filters,
        title: title.trim() || undefined,
        generatedAt,
      });

      downloadTextFile(buildArtifactFilename(activeLabel, generatedAt), html);
      const scenarioNote =
        branchInputs.length > 1 ? ` + ${branchInputs.length - 1} scenario(s)` : '';
      toast.success(`Exported "${activeLabel}" (${activeCount} items)${scenarioNote}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export timeline';
      console.error('Export failed:', error);
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Export Timeline → HTML</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate a single, self-contained HTML file with the timeline and data baked in. It
            opens in any browser offline — no app or server required. Include multiple branches to
            bake in scenarios the reader can toggle between.
          </p>
        </div>

        <div className="space-y-4">
          {/* Initial scenario */}
          <div className="space-y-1.5">
            <Label htmlFor="export-branch">Initial scenario (branch)</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger id="export-branch" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.branch_id} value={branch.branch_id}>
                    {branch.label || branch.branch_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional scenarios to bake in */}
          {branches.length > 1 && (
            <div className="space-y-1.5">
              <Label>Include scenarios</Label>
              <div className="rounded-md border border-border p-3 space-y-2">
                {branches.map((branch) => {
                  const isActive = branch.branch_id === branchId;
                  const checked = isActive || includedBranchIds.includes(branch.branch_id);
                  return (
                    <div key={branch.branch_id} className="flex items-center gap-2">
                      <input
                        id={`scenario-${branch.branch_id}`}
                        type="checkbox"
                        className="h-4 w-4 rounded border-border accent-primary"
                        checked={checked}
                        disabled={isActive}
                        onChange={(e) => toggleBranch(branch.branch_id, e.target.checked)}
                      />
                      <Label
                        htmlFor={`scenario-${branch.branch_id}`}
                        className="cursor-pointer font-normal"
                      >
                        {branch.label || branch.branch_id}
                        {isActive && <span className="ml-1 text-muted-foreground">(initial)</span>}
                      </Label>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Readers can switch between included scenarios in the exported file.
              </p>
            </div>
          )}

          {/* Zoom + Group by */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="export-zoom">Zoom</Label>
              <Select value={zoom} onValueChange={(v) => setZoom(v as ZoomLevel)}>
                <SelectTrigger id="export-zoom" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ZOOM_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="export-group">Group by</Label>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as LaneGroupBy)}>
                <SelectTrigger id="export-group" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_BY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="export-title">Title (optional)</Label>
            <Input
              id="export-title"
              type="text"
              placeholder="SwimLanes Timeline — …"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Apply filters */}
          <div className="flex items-center gap-2">
            <input
              id="export-apply-filters"
              type="checkbox"
              className="h-4 w-4 rounded border-border accent-primary"
              checked={applyFilters}
              onChange={(e) => setApplyFilters(e.target.checked)}
            />
            <Label htmlFor="export-apply-filters" className="cursor-pointer font-normal">
              Apply current timeline filters
              {hasActiveFilters ? (
                <span className="ml-1 text-muted-foreground">(filters are active)</span>
              ) : (
                <span className="ml-1 text-muted-foreground">(none active)</span>
              )}
            </Label>
          </div>

          <Button onClick={handleExport} disabled={isExporting} className="gap-2">
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting…' : 'Export timeline → HTML'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
