import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBranchStore } from '@/stores/branch.store';

/**
 * Header - Application header with branding and controls
 *
 * Features:
 * - App title with gradient styling
 * - Current branch indicator
 * - Theme toggle (dark/light mode)
 */
export function Header() {
  const { theme, setTheme } = useTheme();
  const { currentBranch } = useBranchStore();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          SwimLanes
        </h1>
        <span className="text-sm text-muted-foreground">Timeline Management</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Current Branch Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-sm">
          <span className="text-muted-foreground">Branch:</span>
          <span className="font-medium">{currentBranch || 'main'}</span>
        </div>

        {/* Theme Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="gap-2"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-4 w-4" />
              <span className="hidden sm:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4" />
              <span className="hidden sm:inline">Dark</span>
            </>
          )}
        </Button>
      </div>
    </header>
  );
}
