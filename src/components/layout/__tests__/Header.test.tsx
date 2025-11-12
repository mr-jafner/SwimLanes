import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../Header';

// Mock next-themes
const mockSetTheme = vi.fn();
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: mockSetTheme,
  }),
}));

// Mock branch store
vi.mock('@/stores/branch.store', () => ({
  useBranchStore: () => ({
    currentBranch: 'main',
  }),
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render app title', () => {
    render(<Header />);
    expect(screen.getByRole('heading', { name: /swimlanes/i })).toBeInTheDocument();
  });

  it('should render app subtitle', () => {
    render(<Header />);
    expect(screen.getByText(/timeline management/i)).toBeInTheDocument();
  });

  it('should display current branch', () => {
    render(<Header />);
    expect(screen.getByText(/branch:/i)).toBeInTheDocument();
    expect(screen.getByText('main')).toBeInTheDocument();
  });

  it('should render theme toggle button', () => {
    render(<Header />);
    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('should call setTheme when theme toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<Header />);

    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    await user.click(toggleButton);

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('should show sun icon in dark mode', () => {
    render(<Header />);
    // Sun icon should be present (switching to light mode)
    expect(screen.getByText(/light/i)).toBeInTheDocument();
  });
});
