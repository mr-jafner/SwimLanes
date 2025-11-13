import { FileUp, LineChart, GitBranch, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore, type AppTab } from '@/stores/app.store';
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
 * - Responsive layout
 */
export function TabNavigation() {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <nav className="flex items-center gap-1 px-6 py-2 border-b border-border bg-card">
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
    </nav>
  );
}
