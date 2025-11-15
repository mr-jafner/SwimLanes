import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line, Text, Rect } from 'react-konva';
import type Konva from 'konva';
import type { Item } from '@/types/database.types';
import type { LaneGroup, DateRange, TimeAxisTick, TimelineConfig } from '@/types/timeline.types';
import { calculateItemPosition } from '@/services/timeline.service';

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

interface ZoomState {
  scale: number;
  x: number;
  y: number;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_SPEED = 0.1;

/**
 * TimelineCanvas - Interactive canvas for timeline visualization
 *
 * Features:
 * - Full viewport sizing with resize handling
 * - Click-and-drag panning
 * - Mouse wheel zoom centered on cursor
 * - Item rendering (Phase 2: colored bars with time axis)
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

  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 800, height: 600 });
  const [zoom, setZoom] = useState<ZoomState>({ scale: 1, x: 0, y: 0 });

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

  // Handle mouse wheel zoom
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Calculate zoom direction and new scale
    const zoomDirection = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldScale + zoomDirection * ZOOM_SPEED));

    // Calculate new position to zoom towards cursor
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setZoom({
      scale: newScale,
      x: newPos.x,
      y: newPos.y,
    });
  };

  // Handle drag end to update zoom state
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = e.target as Konva.Stage;
    setZoom({
      scale: stage.scaleX(),
      x: stage.x(),
      y: stage.y(),
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

  // Render timeline items as colored bars
  const renderItems = () => {
    if (!dateRange || !config) return null;

    const renderedItems: React.ReactNode[] = [];

    laneGroups.forEach((laneGroup) => {
      laneGroup.items.forEach((item) => {
        const itemPos = calculateItemPosition(item, dateRange, laneGroup.index, config);
        if (!itemPos) return;

        renderedItems.push(
          <Rect
            key={`item-${item.id}-${item.branch_id}`}
            x={itemPos.x}
            y={itemPos.y}
            width={itemPos.width}
            height={itemPos.height}
            fill={itemPos.color}
            cornerRadius={4}
            opacity={0.8}
          />
        );
      });
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
        draggable
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        scaleX={zoom.scale}
        scaleY={zoom.scale}
        x={zoom.x}
        y={zoom.y}
      >
        <Layer>
          {/* Time axis */}
          {renderTimeAxis()}

          {/* Horizontal axis line */}
          {config && (
            <Line
              points={[
                config.margin.left,
                config.margin.top,
                canvasSize.width - config.margin.right,
                config.margin.top,
              ]}
              stroke="#333"
              strokeWidth={2}
            />
          )}

          {/* Timeline items */}
          {renderItems()}

          {/* Debug info - zoom and pan state */}
          <Text
            x={10}
            y={10}
            text={`Zoom: ${zoom.scale.toFixed(2)}x | Pan: (${Math.round(zoom.x)}, ${Math.round(zoom.y)}) | Items: ${items.length}`}
            fontSize={14}
            fill="#333"
            padding={5}
          />
        </Layer>
      </Stage>

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
          🖱️ <strong>Drag</strong> to pan
        </div>
        <div>
          🔍 <strong>Scroll</strong> to zoom
        </div>
      </div>
    </div>
  );
}
