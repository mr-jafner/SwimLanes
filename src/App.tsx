import './App.css';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { TimelineCanvas } from '@/components/timeline/TimelineCanvas';

function App() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground dark">
      <Toaster />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            SwimLanes
          </h1>
          <span className="text-sm text-muted-foreground">Timeline Management</span>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            Import Data
          </Button>
          <Button variant="outline" size="sm">
            Branches
          </Button>
          <Button variant="outline" size="sm">
            Settings
          </Button>
        </div>
      </header>

      {/* Main Timeline Canvas */}
      <main className="flex-1 overflow-hidden">
        <TimelineCanvas />
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-center px-6 py-2 border-t border-border bg-card text-xs text-muted-foreground">
        Built with React 19, TypeScript, Tailwind CSS v4, and react-konva
      </footer>
    </div>
  );
}

export default App;
