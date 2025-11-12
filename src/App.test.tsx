import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the TimelineCanvas component since Konva doesn't work in jsdom
vi.mock('@/components/timeline/TimelineCanvas', () => ({
  TimelineCanvas: () => <div data-testid="timeline-canvas">Timeline Canvas</div>,
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main heading', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1, name: /swimlanes/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders the header subtitle', () => {
    render(<App />);
    expect(screen.getByText(/timeline management/i)).toBeInTheDocument();
  });

  it('renders header action buttons', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /branches/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  it('renders the timeline canvas', () => {
    render(<App />);
    expect(screen.getByTestId('timeline-canvas')).toBeInTheDocument();
  });

  it('renders the footer', () => {
    render(<App />);
    expect(screen.getByText(/built with react 19/i)).toBeInTheDocument();
  });

  it('has proper layout structure', () => {
    const { container } = render(<App />);
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('flex-1', 'overflow-hidden');
  });

  it('renders in dark mode', () => {
    const { container } = render(<App />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('dark');
  });
});
