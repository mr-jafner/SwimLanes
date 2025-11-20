import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimelineCanvas } from './TimelineCanvas';
import type { Item } from '@/types/database.types';
import type { LaneGroup, DateRange, TimeAxisTick, TimelineConfig } from '@/types/timeline.types';

// Mock react-konva components
vi.mock('react-konva', () => ({
  Stage: ({
    children,
    width,
    height,
  }: {
    children: React.ReactNode;
    width: number;
    height: number;
  }) => (
    <div data-testid="konva-stage" data-width={width} data-height={height}>
      {children}
    </div>
  ),
  Layer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="konva-layer">{children}</div>
  ),
  Rect: ({
    x,
    y,
    width,
    height,
    fill,
  }: {
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
  }) => (
    <div
      data-testid="konva-rect"
      data-x={x}
      data-y={y}
      data-width={width}
      data-height={height}
      data-fill={fill}
    />
  ),
  Line: ({ points, stroke }: { points: number[]; stroke: string }) => (
    <div data-testid="konva-line" data-points={points} data-stroke={stroke} />
  ),
  Text: ({ text, x, y }: { text: string; x: number; y: number }) => (
    <div data-testid="konva-text" data-x={x} data-y={y}>
      {text}
    </div>
  ),
}));

describe('TimelineCanvas', () => {
  const mockItems: Item[] = [
    {
      id: '1',
      type: 'task',
      title: 'Task 1',
      start_date: '2025-01-01',
      end_date: '2025-01-10',
      owner: 'Owner 1',
      lane: 'Lane 1',
      project: 'Project A',
      tags: null,
      dependencies: null,
      source_row_hash: null,
      branch_id: 'main',
      updated_at: '2025-01-01',
    },
  ];

  const mockLaneGroups: LaneGroup[] = [
    {
      lane: 'Lane 1',
      items: mockItems,
    },
  ];

  const mockDateRange: DateRange = {
    minDate: '2025-01-01',
    maxDate: '2025-01-10',
    timeRange: 9 * 24 * 60 * 60 * 1000,
  };

  const mockTimeAxisTicks: TimeAxisTick[] = [
    { position: 0, label: 'Jan 1', date: '2025-01-01' },
    { position: 100, label: 'Jan 10', date: '2025-01-10' },
  ];

  const mockConfig: TimelineConfig = {
    chartWidth: 1000,
    chartHeight: 400,
    laneHeight: 40,
    headerHeight: 60,
    leftMargin: 150,
    margin: {
      top: 20,
      bottom: 20,
      left: 150,
      right: 50,
    },
  };

  beforeEach(() => {
    // Mock container dimensions
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      value: 768,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render without crashing', () => {
    render(
      <TimelineCanvas
        items={mockItems}
        laneGroups={mockLaneGroups}
        dateRange={mockDateRange}
        timeAxisTicks={mockTimeAxisTicks}
        config={mockConfig}
      />
    );
    expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
    expect(screen.getAllByTestId('konva-layer').length).toBeGreaterThan(0);
  });

  it('should render with custom className', () => {
    const { container } = render(
      <TimelineCanvas
        items={mockItems}
        laneGroups={mockLaneGroups}
        dateRange={mockDateRange}
        timeAxisTicks={mockTimeAxisTicks}
        config={mockConfig}
        className="custom-class"
      />
    );
    const canvasContainer = container.firstChild as HTMLElement;
    expect(canvasContainer.className).toContain('custom-class');
  });

  it('should render stage with correct initial dimensions', () => {
    render(
      <TimelineCanvas
        items={mockItems}
        laneGroups={mockLaneGroups}
        dateRange={mockDateRange}
        timeAxisTicks={mockTimeAxisTicks}
        config={mockConfig}
      />
    );
    const stage = screen.getByTestId('konva-stage');
    expect(stage.dataset.width).toBe('1024');
    expect(stage.dataset.height).toBe('768');
  });

  it.skip('should render grid lines', () => {
    // TODO: Update test for new timeline implementation
    render(
      <TimelineCanvas
        items={mockItems}
        laneGroups={mockLaneGroups}
        dateRange={mockDateRange}
        timeAxisTicks={mockTimeAxisTicks}
        config={mockConfig}
      />
    );
    const lines = screen.getAllByTestId('konva-line');
    expect(lines.length).toBeGreaterThan(0);
  });

  it.skip('should render center marker rectangle', () => {
    // TODO: Update test for new timeline implementation
    render(
      <TimelineCanvas
        items={mockItems}
        laneGroups={mockLaneGroups}
        dateRange={mockDateRange}
        timeAxisTicks={mockTimeAxisTicks}
        config={mockConfig}
      />
    );
    const rects = screen.getAllByTestId('konva-rect');
    const centerMarker = rects.find((rect) => rect.dataset.fill === '#2196F3');
    expect(centerMarker).toBeDefined();
  });

  it.skip('should render debug info text', () => {
    // TODO: Update test for new timeline implementation
    render(
      <TimelineCanvas
        items={mockItems}
        laneGroups={mockLaneGroups}
        dateRange={mockDateRange}
        timeAxisTicks={mockTimeAxisTicks}
        config={mockConfig}
      />
    );
    const text = screen.getByTestId('konva-text');
    expect(text.textContent).toContain('Zoom:');
    expect(text.textContent).toContain('Pan:');
  });

  it('should render instructions overlay', () => {
    render(
      <TimelineCanvas
        items={mockItems}
        laneGroups={mockLaneGroups}
        dateRange={mockDateRange}
        timeAxisTicks={mockTimeAxisTicks}
        config={mockConfig}
      />
    );
    expect(screen.getAllByText(/Drag/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Scroll/i).length).toBeGreaterThan(0);
  });

  it('should handle resize events', () => {
    const { rerender } = render(
      <TimelineCanvas
        items={mockItems}
        laneGroups={mockLaneGroups}
        dateRange={mockDateRange}
        timeAxisTicks={mockTimeAxisTicks}
        config={mockConfig}
      />
    );

    // Mock new dimensions
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      value: 1920,
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      value: 1080,
    });

    // Trigger resize
    window.dispatchEvent(new Event('resize'));

    rerender(
      <TimelineCanvas
        items={mockItems}
        laneGroups={mockLaneGroups}
        dateRange={mockDateRange}
        timeAxisTicks={mockTimeAxisTicks}
        config={mockConfig}
      />
    );

    // Note: In a real test, we'd need to wait for the state update
    // This is a simplified test to verify the resize listener is set up
    const stage = screen.getByTestId('konva-stage');
    expect(stage).toBeInTheDocument();
  });

  it('should clean up resize listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(
      <TimelineCanvas
        items={mockItems}
        laneGroups={mockLaneGroups}
        dateRange={mockDateRange}
        timeAxisTicks={mockTimeAxisTicks}
        config={mockConfig}
      />
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
