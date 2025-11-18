import { FileUp, LineChart, GitBranch, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore, type AppTab } from '@/stores/app.store';
import { useTimelineStore } from '@/stores/timeline.store';
import type { ZoomLevel } from '@/types/timeline.types';
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
 * - Zoom level controls (when timeline tab is active)
 * - Responsive layout
 */
export function TabNavigation() {
  const { activeTab, setActiveTab } = useAppStore();
  const { zoomLevel, setZoomLevel } = useTimelineStore();

  const zoomLevels: { value: ZoomLevel; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year' },
  ];

  return (
    <nav className="flex items-center justify-between gap-4 px-6 py-2 border-b border-border bg-card">
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

      {/* Zoom Controls - show only when timeline tab is active */}
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
        </div>
      )}
    </nav>
  );
}
