import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line, Text, Rect, Circle } from 'react-konva';
import type Konva from 'konva';
import type { Item } from '@/types/database.types';
import type { LaneGroup, DateRange, TimeAxisTick, TimelineConfig } from '@/types/timeline.types';
import { calculateItemPosition, assignItemRows } from '@/services/timeline.service';
import { useTimelineStore } from '@/stores/timeline.store';
import { formatDateForDisplay } from '@/utils/date.utils';

interface TimelineCanvasProps {
  /** Items to display on the timeline */
  items?: Item[];

  /** Lane groups with items */
  laneGroups?: LaneGroup[];

  /** Date range */
  dateRange?: DateRange;

  /** Time axis ticks */
  timeAxisTicks?: TimeAxisTick[];

  /** Timeline configuration */
  config?: TimelineConfig;

  /** Optional className for container */
  className?: string;
}

interface CanvasSize {
  width: number;
  height: number;
}

const SCROLL_SPEED = 20; // Pixels per wheel tick for vertical scrolling

/**
 * TimelineCanvas - Interactive canvas for timeline visualization
 *
 * Features:
 * - Full viewport sizing with resize handling
 * - Click-and-drag panning (horizontal + vertical)
 * - Mouse wheel vertical scrolling
 * - Fixed lane labels on left (no horizontal pan/zoom)
 * - Horizontal zoom via discrete zoom levels (from timeline store)
 * - Item rendering (Phase 3: colored bars, circles, with overlap handling)
 */
export function TimelineCanvas({
  items = [],
  laneGroups = [],
  dateRange,
  timeAxisTicks = [],
  config,
  className,
}: TimelineCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  // Get zoom level from timeline store
  const zoomLevel = useTimelineStore((state) => state.zoomLevel);

  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 800, height: 600 });

  // Pan and drag state - from store to persist across tab changes
  const pan = useTimelineStore((state) => state.panOffset);
  const setPan = useTimelineStore((state) => state.setPanOffset);
  const isDragging = useTimelineStore((state) => state.isDragging);
  const setIsDragging = useTimelineStore((state) => state.setIsDragging);
  const dragStart = useTimelineStore((state) => state.dragStart);
  const setDragStart = useTimelineStore((state) => state.setDragStart);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    item: Item | null;
    x: number;
    y: number;
  }>({ visible: false, item: null, x: 0, y: 0 });

  // Calculate total content height for scroll limits
  const totalContentHeight = React.useMemo(() => {
    if (!config) return 0;
    const totalLaneHeight = laneGroups.reduce((sum, group) => sum + group.height, 0);
    return config.margin.top + totalLaneHeight;
  }, [laneGroups, config]);

  // Handle window resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setCanvasSize({ width: clientWidth, height: clientHeight });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle mouse wheel for vertical scrolling
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    // Hide tooltip when scrolling
    setTooltip({ visible: false, item: null, x: 0, y: 0 });

    // Scroll vertically based on wheel delta
    const scrollDelta = e.evt.deltaY > 0 ? -SCROLL_SPEED : SCROLL_SPEED;
    const newY = pan.y + scrollDelta;

    // Calculate scroll limits (allow 25% extra viewport height at bottom for breathing room)
    const extraBottomSpace = canvasSize.height * 0.25;
    const minPanY = Math.min(0, -(totalContentHeight - canvasSize.height) - extraBottomSpace);
    const maxPanY = 0;

    // Clamp between min and max
    const clampedY = Math.max(minPanY, Math.min(maxPanY, newY));

    setPan({
      x: pan.x,
      y: clampedY,
    });
  };

  // Handle mouse down to start dragging
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleMouseDown = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Hide tooltip when starting to drag
    setTooltip({ visible: false, item: null, x: 0, y: 0 });

    setIsDragging(true);
    setDragStart({ x: pos.x - pan.x, y: pos.y - pan.y });
  };

  // Handle mouse move to update pan during drag
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleMouseMove = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDragging || !dragStart) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const newY = pos.y - dragStart.y;

    // Calculate scroll limits (allow 25% extra viewport height at bottom for breathing room)
    const extraBottomSpace = canvasSize.height * 0.25;
    const minPanY = Math.min(0, -(totalContentHeight - canvasSize.height) - extraBottomSpace);
    const maxPanY = 0;

    // Clamp between min and max
    const clampedY = Math.max(minPanY, Math.min(maxPanY, newY));

    setPan({
      x: pos.x - dragStart.x,
      y: clampedY,
    });
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // Helper function to calculate duration in days
  const calculateDuration = (startDate: string | null, endDate: string | null): number | null => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  // Handle mouse enter on item to show tooltip
  const handleItemMouseEnter = (e: Konva.KonvaEventObject<MouseEvent>, item: Item) => {
    setTooltip({
      visible: true,
      item,
      x: e.evt.clientX,
      y: e.evt.clientY,
    });
  };

  // Handle mouse move on item to update tooltip position
  const handleItemMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    setTooltip((prev) => ({
      ...prev,
      x: e.evt.clientX,
      y: e.evt.clientY,
    }));
  };

  // Handle mouse leave on item to hide tooltip
  const handleItemMouseLeave = () => {
    setTooltip({ visible: false, item: null, x: 0, y: 0 });
  };

  // Render swim lane backgrounds (alternating gray/white, extended width for panning)
  const renderLaneBackgrounds = () => {
    if (!config) return null;

    let cumulativeY = config.margin.top;
    // Make backgrounds very wide so they extend beyond viewport during panning
    const extendedWidth = canvasSize.width * 10;

    return laneGroups.map((laneGroup, index) => {
      const yPos = cumulativeY;
      const isEven = index % 2 === 0;

      const rect = (
        <Rect
          key={`lane-bg-${index}`}
          x={-extendedWidth / 2} // Start far to the left
          y={yPos}
          width={extendedWidth}
          height={laneGroup.height}
          fill={isEven ? '#e5e7eb' : '#ffffff'}
        />
      );

      cumulativeY += laneGroup.height;
      return rect;
    });
  };

  // Render lane labels on the left (fixed horizontal position with background)
  const renderLaneLabels = () => {
    if (!config) return null;

    let cumulativeY = config.margin.top;

    return laneGroups.map((laneGroup, index) => {
      const yPos = cumulativeY + laneGroup.height / 2;

      const elements = (
        <React.Fragment key={`lane-label-group-${index}`}>
          {/* Background rectangle for label */}
          <Rect
            x={0}
            y={cumulativeY}
            width={config.margin.left}
            height={laneGroup.height}
            fill="#ffffff"
            opacity={0.95}
          />
          {/* Label text */}
          <Text
            x={10}
            y={yPos}
            text={laneGroup.laneName}
            fontSize={14}
            fill="#4b5563"
            fontStyle="bold"
            verticalAlign="middle"
            width={config.margin.left - 20}
            ellipsis={true}
          />
        </React.Fragment>
      );

      cumulativeY += laneGroup.height;
      return elements;
    });
  };

  // Render time axis with ticks and labels
  const renderTimeAxis = () => {
    if (!config) return null;

    return timeAxisTicks.map((tick, index) => (
      <React.Fragment key={`tick-${index}`}>
        {/* Tick line */}
        <Line
          points={[tick.x, config.margin.top - 10, tick.x, config.margin.top]}
          stroke={tick.isMajor ? '#333' : '#999'}
          strokeWidth={tick.isMajor ? 2 : 1}
        />
        {/* Tick label */}
        <Text
          x={tick.x}
          y={config.margin.top - 35}
          text={tick.label}
          fontSize={12}
          fill="#333"
          align="center"
          offsetX={30}
        />
      </React.Fragment>
    ));
  };

  // Render timeline items as colored bars or circles
  const renderItems = () => {
    if (!dateRange || !config) return null;

    const renderedItems: React.ReactNode[] = [];
    let cumulativeY = config.margin.top;

    laneGroups.forEach((laneGroup) => {
      // Assign row indices to handle overlapping items
      const rowMap = assignItemRows(laneGroup.items);

      laneGroup.items.forEach((item) => {
        // Calculate horizontal position (X, width) based on dates
        const itemPos = calculateItemPosition(item, dateRange, 0, config); // Pass 0 for laneIndex, we'll calculate Y ourselves
        if (!itemPos) return;

        // Calculate Y position relative to this lane
        const rowIndex = rowMap.get(item.id) ?? 0;
        const yOffset = rowIndex * (config.itemHeight + config.itemPadding);
        const itemY = cumulativeY + config.itemPadding + yOffset;

        // Milestones render as circles
        if (item.type === 'milestone') {
          const centerX = itemPos.x + itemPos.width / 2;
          const centerY = itemY + itemPos.height / 2;
          const radius = itemPos.height / 2;

          renderedItems.push(
            <React.Fragment key={`item-${item.id}-${item.branch_id}`}>
              <Circle
                x={centerX}
                y={centerY}
                radius={radius}
                fill={itemPos.color}
                stroke={itemPos.color}
                strokeWidth={2}
                opacity={0.8}
                onMouseEnter={(e) => handleItemMouseEnter(e, item)}
                onMouseMove={handleItemMouseMove}
                onMouseLeave={handleItemMouseLeave}
              />
              {/* Milestone label to the right */}
              <Text
                x={centerX + radius + 8}
                y={centerY}
                text={item.title}
                fontSize={11}
                fill="#374151"
                verticalAlign="middle"
              />
            </React.Fragment>
          );
        } else {
          // Tasks, releases, meetings render as bars
          renderedItems.push(
            <React.Fragment key={`item-${item.id}-${item.branch_id}`}>
              <Rect
                x={itemPos.x}
                y={itemY}
                width={itemPos.width}
                height={itemPos.height}
                fill={itemPos.color}
                cornerRadius={4}
                opacity={0.9}
                onMouseEnter={(e) => handleItemMouseEnter(e, item)}
                onMouseMove={handleItemMouseMove}
                onMouseLeave={handleItemMouseLeave}
              />
              {/* Item label - only show if bar is wide enough */}
              {itemPos.width > 50 && (
                <Text
                  x={itemPos.x + 6}
                  y={itemY + itemPos.height / 2}
                  text={item.title}
                  fontSize={11}
                  fill="#ffffff"
                  fontStyle="bold"
                  verticalAlign="middle"
                  width={itemPos.width - 12}
                  ellipsis={true}
                />
              )}
            </React.Fragment>
          );
        }
      });

      // Move to next lane
      cumulativeY += laneGroup.height;
    });

    return renderedItems;
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <Stage
        ref={stageRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Layer 1: Background (lane backgrounds) - pans horizontally and vertically */}
        <Layer x={pan.x} y={pan.y}>
          {renderLaneBackgrounds()}
        </Layer>

        {/* Layer 2: Timeline items - pans horizontally and vertically */}
        <Layer x={pan.x} y={pan.y}>
          {renderItems()}
        </Layer>

        {/* Layer 3: Time axis - pans horizontally only (frozen at top) */}
        <Layer x={pan.x}>
          {/* Background for time axis area (extended width) */}
          {config && (
            <Rect
              x={-canvasSize.width * 5}
              y={0}
              width={canvasSize.width * 10}
              height={config.margin.top}
              fill="#ffffff"
              opacity={0.95}
            />
          )}

          {/* Time axis */}
          {renderTimeAxis()}

          {/* Horizontal axis line (extended width) */}
          {config && (
            <Line
              points={[
                -canvasSize.width * 5,
                config.margin.top,
                canvasSize.width * 5,
                config.margin.top,
              ]}
              stroke="#333"
              strokeWidth={2}
            />
          )}
        </Layer>

        {/* Layer 4: Lane labels - pans vertically only (frozen at left) */}
        <Layer y={pan.y}>{renderLaneLabels()}</Layer>

        {/* Layer 5: Debug overlay - fixed position (no pan) */}
        <Layer>
          <Text
            x={10}
            y={10}
            text={`Zoom: ${zoomLevel} | Pan: (${Math.round(pan.x)}, ${Math.round(pan.y)}) | Items: ${items.length}`}
            fontSize={14}
            fill="#333"
            padding={5}
          />
        </Layer>
      </Stage>

      {/* Tooltip overlay */}
      {tooltip.visible && tooltip.item && (
        <div
          style={{
            position: 'fixed',
            left: Math.min(tooltip.x + 15, window.innerWidth - 250),
            top: Math.min(tooltip.y + 15, window.innerHeight - 200),
            maxWidth: '250px',
            background: '#1f2937',
            color: '#ffffff',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 1000,
            pointerEvents: 'none',
          }}
        >
          {/* Title and type badge */}
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{tooltip.item.title}</div>
          <div style={{ marginBottom: '8px' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                background: '#3b82f6',
              }}
            >
              {tooltip.item.type}
            </span>
          </div>

          {/* Dates */}
          {tooltip.item.start_date && (
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>
              Start: {formatDateForDisplay(tooltip.item.start_date, 'short')}
            </div>
          )}
          {tooltip.item.end_date && tooltip.item.type !== 'milestone' && (
            <>
              <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                End: {formatDateForDisplay(tooltip.item.end_date, 'short')}
              </div>
              {calculateDuration(tooltip.item.start_date, tooltip.item.end_date) && (
                <div style={{ fontSize: '12px', marginBottom: '8px', color: '#d1d5db' }}>
                  Duration: {calculateDuration(tooltip.item.start_date, tooltip.item.end_date)} days
                </div>
              )}
            </>
          )}

          {/* Additional fields (conditionally shown) */}
          {tooltip.item.project && (
            <div style={{ fontSize: '12px', color: '#d1d5db', marginTop: '8px' }}>
              Project: {tooltip.item.project}
            </div>
          )}
          {tooltip.item.owner && (
            <div style={{ fontSize: '12px', color: '#d1d5db' }}>Owner: {tooltip.item.owner}</div>
          )}
          {tooltip.item.lane && (
            <div style={{ fontSize: '12px', color: '#d1d5db' }}>Lane: {tooltip.item.lane}</div>
          )}
          {tooltip.item.tags && (
            <div style={{ fontSize: '12px', color: '#d1d5db' }}>Tags: {tooltip.item.tags}</div>
          )}
        </div>
      )}

      {/* Instructions overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          pointerEvents: 'none',
        }}
      >
        <div style={{ marginBottom: '4px' }}>
          🖱️ <strong>Drag</strong> to pan horizontally/vertically
        </div>
        <div>
          🔍 <strong>Scroll</strong> to scroll vertically
        </div>
      </div>
    </div>
  );
}
