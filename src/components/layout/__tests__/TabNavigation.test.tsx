import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabNavigation } from '../TabNavigation';
import { useAppStore } from '@/stores/app.store';

describe('TabNavigation', () => {
  beforeEach(() => {
    // Reset store to default state before each test
    useAppStore.setState({ activeTab: 'timeline' });
  });

  it('should render all tab buttons', () => {
    render(<TabNavigation />);

    expect(screen.getByRole('button', { name: /import tab/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /timeline tab/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /branches tab/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /history tab/i })).toBeInTheDocument();
  });

  it('should highlight the active tab', () => {
    render(<TabNavigation />);

    const timelineButton = screen.getByRole('button', { name: /timeline tab/i });
    expect(timelineButton).toHaveAttribute('aria-current', 'page');
  });

  it('should switch tabs when clicked', async () => {
    const user = userEvent.setup();
    render(<TabNavigation />);

    const importButton = screen.getByRole('button', { name: /import tab/i });
    await user.click(importButton);

    // Check store state was updated
    expect(useAppStore.getState().activeTab).toBe('import');
  });

  it('should update active state after tab switch', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<TabNavigation />);

    const branchesButton = screen.getByRole('button', { name: /branches tab/i });
    await user.click(branchesButton);

    // Re-render to reflect state change
    rerender(<TabNavigation />);

    expect(branchesButton).toHaveAttribute('aria-current', 'page');
  });

  it('should render icons for each tab', () => {
    const { container } = render(<TabNavigation />);

    // Check that SVG icons are present (lucide-react renders SVGs)
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThanOrEqual(4);
  });

  it('should have proper accessibility attributes', () => {
    render(<TabNavigation />);

    const tabs = screen.getAllByRole('button');
    tabs.forEach((tab) => {
      expect(tab).toHaveAttribute('aria-label');
    });
  });
});
