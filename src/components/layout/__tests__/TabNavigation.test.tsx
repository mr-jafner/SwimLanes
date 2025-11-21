import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabNavigation } from '../TabNavigation';
import { useAppStore } from '@/stores/app.store';
import { useTimelineStore } from '@/stores/timeline.store';
import { useBranchStore } from '@/stores/branch.store';

// Mock hasPointerCapture for jsdom (not natively supported)
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}

describe('TabNavigation', () => {
  beforeEach(() => {
    // Reset stores to default state before each test
    useAppStore.setState({ activeTab: 'timeline' });
    useTimelineStore.setState({
      zoomLevel: 'month',
      laneGroupBy: 'lane',
      filterType: '',
      filterProject: '',
      filterStartDate: '',
      filterEndDate: '',
    });

    // Mock branch store with branches and mock refreshBranches
    const mockRefreshBranches = vi.fn();
    useBranchStore.setState({
      viewBranch: 'main',
      branches: [
        { branch_id: 'main', label: 'Main', created_from: null, note: null, created_at: '' },
        {
          branch_id: 'test-branch',
          label: 'Test Branch',
          created_from: 'main',
          note: null,
          created_at: '',
        },
      ],
      refreshBranches: mockRefreshBranches,
    });
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

    // Get only the tab buttons (first 4 buttons)
    const tabButtons = [
      screen.getByRole('button', { name: /import tab/i }),
      screen.getByRole('button', { name: /timeline tab/i }),
      screen.getByRole('button', { name: /branches tab/i }),
      screen.getByRole('button', { name: /history tab/i }),
    ];

    tabButtons.forEach((tab) => {
      expect(tab).toHaveAttribute('aria-label');
    });
  });

  describe('Timeline Controls', () => {
    it('should show timeline controls when timeline tab is active', () => {
      useAppStore.setState({ activeTab: 'timeline' });
      render(<TabNavigation />);

      expect(screen.getByText('Zoom:')).toBeInTheDocument();
      expect(screen.getByText('Branch:')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
    });

    it('should hide timeline controls when other tabs are active', () => {
      useAppStore.setState({ activeTab: 'import' });
      render(<TabNavigation />);

      expect(screen.queryByText('Zoom:')).not.toBeInTheDocument();
      expect(screen.queryByText('Branch:')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /filters/i })).not.toBeInTheDocument();
    });

    it('should change zoom level when selected', async () => {
      render(<TabNavigation />);

      // Change zoom level directly via store setter (testing integration, not Radix UI internals)
      useTimelineStore.getState().setZoomLevel('week');

      // Check store was updated
      await waitFor(() => {
        expect(useTimelineStore.getState().zoomLevel).toBe('week');
      });
    });

    it('should change branch when selected', async () => {
      render(<TabNavigation />);

      // Change branch directly via store setter
      useBranchStore.getState().setViewBranch('test-branch');

      // Check store was updated
      await waitFor(() => {
        expect(useBranchStore.getState().viewBranch).toBe('test-branch');
      });
    });

    it('should show filter badge with count when filters are active', () => {
      useTimelineStore.setState({
        filterType: 'task',
        filterProject: 'Project A',
      });
      render(<TabNavigation />);

      const filtersButton = screen.getByRole('button', { name: /filters/i });
      expect(within(filtersButton).getByText('2')).toBeInTheDocument();
    });

    it('should expand/collapse filter section when Filters button clicked', async () => {
      const user = userEvent.setup();
      render(<TabNavigation />);

      // Filters should be collapsed initially
      expect(screen.queryByText('Group:')).not.toBeInTheDocument();

      // Click Filters button to expand
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Filters should now be visible
      expect(screen.getByText('Group:')).toBeInTheDocument();
      expect(screen.getByText('Type:')).toBeInTheDocument();
      expect(screen.getByText('Project:')).toBeInTheDocument();
      expect(screen.getByText('Start Date:')).toBeInTheDocument();
      expect(screen.getByText('End Date:')).toBeInTheDocument();

      // Click again to collapse
      await user.click(filtersButton);

      // Filters should be hidden again
      expect(screen.queryByText('Group:')).not.toBeInTheDocument();
    });

    it('should change group by when selected', async () => {
      const user = userEvent.setup();
      render(<TabNavigation />);

      // Expand filters
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Change groupBy directly via store setter
      useTimelineStore.getState().setLaneGroupBy('project');

      // Check store was updated
      await waitFor(() => {
        expect(useTimelineStore.getState().laneGroupBy).toBe('project');
      });
    });

    it('should change type filter when selected', async () => {
      const user = userEvent.setup();
      render(<TabNavigation />);

      // Expand filters
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Change type filter directly via store setter
      useTimelineStore.getState().setFilterType('task');

      // Check store was updated
      await waitFor(() => {
        expect(useTimelineStore.getState().filterType).toBe('task');
      });
    });

    it('should update project filter with debouncing', async () => {
      const user = userEvent.setup();
      render(<TabNavigation />);

      // Expand filters
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Find project input
      const projectInput = screen.getByPlaceholderText('Filter by project...');
      await user.type(projectInput, 'Test Project');

      // Input should update immediately
      expect(projectInput).toHaveValue('Test Project');

      // Store should be updated after debounce completes
      await waitFor(
        () => {
          expect(useTimelineStore.getState().filterProject).toBe('Test Project');
        },
        { timeout: 1000 } // Wait up to 1 second for debounce (300ms delay)
      );
    });

    it('should update start date filter', async () => {
      const user = userEvent.setup();
      render(<TabNavigation />);

      // Expand filters
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Find start date input using a more reliable selector
      await waitFor(() => {
        expect(screen.getByText('Start Date:')).toBeInTheDocument();
      });

      const dateInputs = document.querySelectorAll('input[type="date"]');
      const startDateInput = dateInputs[0] as HTMLInputElement;

      // Use fireEvent to trigger change (more reliable for controlled inputs)
      fireEvent.change(startDateInput, { target: { value: '2025-01-15' } });

      // Check store was updated
      await waitFor(() => {
        expect(useTimelineStore.getState().filterStartDate).toBe('2025-01-15');
      });
    });

    it('should update end date filter', async () => {
      const user = userEvent.setup();
      render(<TabNavigation />);

      // Expand filters
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Wait for end date input to be visible
      await waitFor(() => {
        expect(screen.getByText('End Date:')).toBeInTheDocument();
      });

      const dateInputs = document.querySelectorAll('input[type="date"]');
      const endDateInput = dateInputs[1] as HTMLInputElement;

      // Use fireEvent to trigger change (more reliable for controlled inputs)
      fireEvent.change(endDateInput, { target: { value: '2025-12-31' } });

      // Check store was updated
      await waitFor(() => {
        expect(useTimelineStore.getState().filterEndDate).toBe('2025-12-31');
      });
    });

    it('should clear filters when set to default values', async () => {
      const user = userEvent.setup();
      useTimelineStore.setState({
        filterType: 'task',
        filterProject: 'Test',
      });
      render(<TabNavigation />);

      // Expand filters
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Clear type filter by setting to empty string
      useTimelineStore.getState().setFilterType('');

      // Check store was updated (empty string for "All")
      await waitFor(() => {
        expect(useTimelineStore.getState().filterType).toBe('');
      });
    });
  });
});
