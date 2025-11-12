import './App.css';
import { useEffect, useRef } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/layout/Header';
import { TabNavigation } from '@/components/layout/TabNavigation';
import { PlaceholderPanel } from '@/components/layout/PlaceholderPanel';
import { TimelineCanvas } from '@/components/timeline/TimelineCanvas';
import { ImportForm } from '@/components/import/ImportForm';
import { useAppStore } from '@/stores/app.store';
import { databaseService } from '@/services/database.service';

function App() {
  const { activeTab, isInitialized, initError, setInitialized, setInitializing, setInitError } =
    useAppStore();

  const initializationStartedRef = useRef(false);

  // Initialize database on app startup
  useEffect(() => {
    const initDatabase = async () => {
      // Skip if already started initialization
      if (initializationStartedRef.current) {
        return;
      }

      initializationStartedRef.current = true;
      setInitializing(true);

      try {
        await databaseService.initialize();
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    initDatabase();
    // Empty dependency array - only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show loading state while database initializes
  if (!isInitialized && !initError) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Initializing database...</p>
        </div>
      </div>
    );
  }

  // Show error state if database failed to initialize
  if (initError) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-destructive mb-4">Database Error</h1>
          <p className="text-muted-foreground mb-4">{initError}</p>
          <button
            onClick={() => {
              setInitError(null);
              setInitializing(false);
              window.location.reload();
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Toaster />
      <Header />
      <TabNavigation />

      <main className="flex-1 overflow-auto bg-background">
        {activeTab === 'import' && (
          <div className="min-h-full">
            <ImportForm />
          </div>
        )}
        {activeTab === 'timeline' && (
          <div className="h-full">
            <TimelineCanvas />
          </div>
        )}
        {activeTab === 'branches' && (
          <PlaceholderPanel
            title="Branch Management"
            description="Create, compare, and merge timeline branches for scenario planning."
          />
        )}
        {activeTab === 'history' && (
          <PlaceholderPanel
            title="Version History"
            description="View and explore historical versions of your timeline data."
          />
        )}
        {activeTab === 'export' && (
          <PlaceholderPanel
            title="Export Data"
            description="Export your timeline data to various formats."
          />
        )}
      </main>
    </div>
  );
}

export default App;
