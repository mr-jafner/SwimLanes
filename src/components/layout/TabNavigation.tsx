import { useEffect, useState } from 'react';
import { FileUp, LineChart, GitBranch, History, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore, type AppTab } from '@/stores/app.store';
import { useTimelineStore } from '@/stores/timeline.store';
import { useBranchStore } from '@/stores/branch.store';
import { useDebounce } from '@/hooks/useDebounce';
import type { ZoomLevel, LaneGroupBy } from '@/types/timeline.types';
import { cn } from '@/lib/utils';

interface TabConfig {
  id: AppTab;
  label: string;
  icon: React.ElementType;
}

const tabs: TabConfig[] = [
  { id: 'import', label: 'Import', icon: FileUp },
  { id: 'timeline', label: 'Timeline', icon: LineChart },
  { id: 'branches', label: 'Branches', icon: GitBranch },
  { id: 'history', label: 'History', icon: History },
];

/**
 * TabNavigation - Tab-based navigation for main app views
 *
 * Features:
 * - Click-based tab switching
 * - Active tab highlighting
 * - Icons for each tab
 * - Timeline controls: zoom, branch selector, filters (when timeline tab active)
 * - Collapsible filter section
 */
export function TabNavigation() {
  const { activeTab, setActiveTab } = useAppStore();
  const {
    zoomLevel,
    setZoomLevel,
    laneGroupBy,
    setLaneGroupBy,
    filterType,
    setFilterType,
    filterProject,
    setFilterProject,
    filterStartDate,
    setFilterStartDate,
    filterEndDate,
    setFilterEndDate,
  } = useTimelineStore();
  const { viewBranch, setViewBranch, branches, refreshBranches } = useBranchStore();

  // Local state for filter panel visibility and project input
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [projectInput, setProjectInput] = useState(filterProject);

  // Debounce project filter input
  const debouncedProject = useDebounce(projectInput, 300);

  // Update store when debounced value changes
  useEffect(() => {
    setFilterProject(debouncedProject);
  }, [debouncedProject, setFilterProject]);

  // Refresh branches on mount
  useEffect(() => {
    refreshBranches();
  }, [refreshBranches]);

  // Count active filters for badge
  const activeFilterCount =
    (filterType ? 1 : 0) +
    (filterProject ? 1 : 0) +
    (filterStartDate ? 1 : 0) +
    (filterEndDate ? 1 : 0);

  const zoomLevels: { value: ZoomLevel; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year' },
  ];

  const groupByOptions: { value: LaneGroupBy; label: string }[] = [
    { value: 'lane', label: 'Lane' },
    { value: 'project', label: 'Project' },
    { value: 'owner', label: 'Owner' },
    { value: 'type', label: 'Type' },
  ];

  const typeOptions: { value: string; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'task', label: 'Task' },
    { value: 'milestone', label: 'Milestone' },
    { value: 'release', label: 'Release' },
    { value: 'meeting', label: 'Meeting' },
  ];

  return (
    <nav className="border-b border-border bg-card">
      {/* Row 1: Tabs + Timeline Controls */}
      <div className="flex items-center justify-between gap-4 px-6 py-2">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <Button
                key={tab.id}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'gap-2',
                  isActive && 'bg-primary text-primary-foreground',
                  !isActive && 'hover:bg-accent hover:text-accent-foreground'
                )}
                aria-label={`${tab.label} tab`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Timeline Controls - show only when timeline tab is active */}
        {activeTab === 'timeline' && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Zoom:</span>
            <Select value={zoomLevel} onValueChange={(value) => setZoomLevel(value as ZoomLevel)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {zoomLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-sm font-medium text-muted-foreground">Branch:</span>
            <Select value={viewBranch} onValueChange={(value) => setViewBranch(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.branch_id} value={branch.branch_id}>
                    {branch.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="gap-1"
            >
              {filtersExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Row 2: Collapsible Filter Section */}
      {activeTab === 'timeline' && filtersExpanded && (
        <div className="flex items-center gap-2 px-6 py-2 bg-muted/50 border-t border-border">
          <span className="text-sm font-medium text-muted-foreground">Group:</span>
          <Select
            value={laneGroupBy}
            onValueChange={(value) => setLaneGroupBy(value as LaneGroupBy)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {groupByOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-sm font-medium text-muted-foreground">Type:</span>
          <Select
            value={filterType || 'all'}
            onValueChange={(value) => setFilterType(value === 'all' ? '' : value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-sm font-medium text-muted-foreground">Project:</span>
          <Input
            type="text"
            placeholder="Filter by project..."
            value={projectInput}
            onChange={(e) => setProjectInput(e.target.value)}
            className="w-48"
          />

          <span className="text-sm font-medium text-muted-foreground">Start Date:</span>
          <Input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="w-40"
          />

          <span className="text-sm font-medium text-muted-foreground">End Date:</span>
          <Input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="w-40"
          />
        </div>
      )}
    </nav>
  );
}
