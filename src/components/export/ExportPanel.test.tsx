import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportPanel } from './ExportPanel';
import { useBranchStore } from '@/stores/branch.store';
import { useTimelineStore } from '@/stores/timeline.store';
import { getItems } from '@/db/queries/items.queries';
import { downloadTextFile } from '@/utils/download.utils';
import { toast } from 'sonner';
import type { Item } from '@/types/database.types';

// Radix Select needs these in jsdom
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

const mockItems: Item[] = [
  {
    id: 'a',
    branch_id: 'main',
    type: 'task',
    title: 'Design',
    start_date: '2025-01-01',
    end_date: '2025-01-31',
    owner: 'Alice',
    lane: 'UX',
    project: 'Auth',
    tags: null,
    dependencies: null,
    source_id: null,
    source_row_hash: null,
    updated_at: '2025-01-01T00:00:00Z',
  },
];

vi.mock('@/services/database.service', () => ({
  databaseService: {
    isReady: () => true,
    getDatabase: () => ({}),
  },
}));

vi.mock('@/db/queries/items.queries', () => ({
  getItems: vi.fn(() => mockItems),
}));

vi.mock('@/utils/download.utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/download.utils')>();
  return { ...actual, downloadTextFile: vi.fn() };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('ExportPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBranchStore.setState({
      viewBranch: 'main',
      branches: [
        { branch_id: 'main', label: 'Main', created_from: null, note: null, created_at: '' },
      ],
      refreshBranches: vi.fn().mockResolvedValue(undefined),
    });
    useTimelineStore.setState({
      zoomLevel: 'month',
      laneGroupBy: 'lane',
      filterType: '',
      filterProject: '',
      filterStartDate: '',
      filterEndDate: '',
    });
  });

  it('renders the export heading and action', () => {
    render(<ExportPanel />);
    expect(screen.getByText('Export Timeline → HTML')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export timeline/i })).toBeInTheDocument();
  });

  it('exports the selected branch and triggers a download with a generated HTML artifact', async () => {
    const user = userEvent.setup();
    render(<ExportPanel />);

    await user.click(screen.getByRole('button', { name: /export timeline/i }));

    await waitFor(() => {
      expect(getItems).toHaveBeenCalledWith(expect.anything(), 'main');
      expect(downloadTextFile).toHaveBeenCalledOnce();
    });

    const [filename, html] = (downloadTextFile as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, string];
    expect(filename).toMatch(/^swimlanes-main-\d{4}-\d{2}-\d{2}\.html$/);
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<svg');
    expect(toast.success).toHaveBeenCalled();
  });

  it('shows an error toast and does not download when item fetch fails', async () => {
    (getItems as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error('boom');
    });
    const user = userEvent.setup();
    render(<ExportPanel />);

    await user.click(screen.getByRole('button', { name: /export timeline/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('boom');
    });
    expect(downloadTextFile).not.toHaveBeenCalled();
  });
});
