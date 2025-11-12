import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { useAppStore } from './stores/app.store';

// Mock the database service to avoid WASM loading in tests
vi.mock('@/services/database.service', () => ({
  databaseService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    getDatabase: vi.fn(),
    isReady: vi.fn().mockReturnValue(true),
  },
}));

// Mock the TimelineCanvas component since Konva doesn't work in jsdom
vi.mock('@/components/timeline/TimelineCanvas', () => ({
  TimelineCanvas: () => <div data-testid="timeline-canvas">Timeline Canvas</div>,
}));

// Mock the ImportForm component
vi.mock('@/components/import/ImportForm', () => ({
  ImportForm: () => <div data-testid="import-form">Import Form</div>,
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
  }),
}));

// Mock branch store
vi.mock('@/stores/branch.store', () => ({
  useBranchStore: () => ({
    currentBranch: 'main',
  }),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initialized state with timeline tab as default
    useAppStore.setState({
      activeTab: 'timeline',
      isInitialized: true,
      isInitializing: false,
      initError: null,
    });
  });

  it('renders the header', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1, name: /swimlanes/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders tab navigation', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /import tab/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /timeline tab/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /branches tab/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /history tab/i })).toBeInTheDocument();
  });

  it('renders timeline tab by default', () => {
    render(<App />);
    expect(screen.getByTestId('timeline-canvas')).toBeInTheDocument();
  });

  it('switches to import tab when clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    const importButton = screen.getByRole('button', { name: /import tab/i });
    await user.click(importButton);

    // After clicking, the ImportForm should be rendered
    expect(screen.getByTestId('import-form')).toBeInTheDocument();
  });

  it('switches to branches tab and shows placeholder', async () => {
    const user = userEvent.setup();
    render(<App />);

    const branchesButton = screen.getByRole('button', { name: /branches tab/i });
    await user.click(branchesButton);

    expect(screen.getByText(/branch management/i)).toBeInTheDocument();
    expect(screen.getByText(/future update/i)).toBeInTheDocument();
  });

  it('switches to history tab and shows placeholder', async () => {
    const user = userEvent.setup();
    render(<App />);

    const historyButton = screen.getByRole('button', { name: /history tab/i });
    await user.click(historyButton);

    expect(screen.getByText(/version history/i)).toBeInTheDocument();
    expect(screen.getByText(/future update/i)).toBeInTheDocument();
  });

  it('has proper layout structure', () => {
    const { container } = render(<App />);
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('flex-1', 'overflow-auto');
  });

  it('shows loading state while database initializes', () => {
    useAppStore.setState({
      activeTab: 'timeline',
      isInitialized: false,
      isInitializing: true,
      initError: null,
    });

    render(<App />);

    expect(screen.getByText(/initializing database/i)).toBeInTheDocument();
    // Should show loading spinner
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('shows error state when database fails to initialize', () => {
    useAppStore.setState({
      activeTab: 'timeline',
      isInitialized: false,
      isInitializing: false,
      initError: 'Failed to load WASM module',
    });

    render(<App />);

    expect(screen.getByText(/database error/i)).toBeInTheDocument();
    expect(screen.getByText(/failed to load wasm module/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('retry button reloads page on error', () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true,
    });

    useAppStore.setState({
      activeTab: 'timeline',
      isInitialized: false,
      isInitializing: false,
      initError: 'Test error',
    });

    render(<App />);

    const retryButton = screen.getByRole('button', { name: /retry/i });
    retryButton.click();

    expect(reloadSpy).toHaveBeenCalled();
  });

  it('renders export tab placeholder', () => {
    // Set to export tab
    useAppStore.setState({
      activeTab: 'export',
      isInitialized: true,
      isInitializing: false,
      initError: null,
    });

    render(<App />);

    expect(screen.getByText(/export data/i)).toBeInTheDocument();
  });
});
