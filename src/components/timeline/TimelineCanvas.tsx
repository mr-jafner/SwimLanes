import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Line, Text } from 'react-konva';
import type Konva from 'konva';

interface TimelineCanvasProps {
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
 * - Visual grid and debug info
 */
export function TimelineCanvas({ className }: TimelineCanvasProps) {
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

  // Render grid lines for visual feedback
  const renderGrid = () => {
    const gridLines = [];
    const gridSize = 50;
    const { width, height } = canvasSize;

    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      gridLines.push(
        <Line key={`v-${x}`} points={[x, 0, x, height]} stroke="#e0e0e0" strokeWidth={1} />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      gridLines.push(
        <Line key={`h-${y}`} points={[0, y, width, y]} stroke="#e0e0e0" strokeWidth={1} />
      );
    }

    return gridLines;
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
          {/* Grid lines */}
          {renderGrid()}

          {/* Center marker */}
          <Rect
            x={canvasSize.width / 2 - 25}
            y={canvasSize.height / 2 - 25}
            width={50}
            height={50}
            fill="#2196F3"
            opacity={0.5}
          />

          {/* Debug info text */}
          <Text
            x={10}
            y={10}
            text={`Zoom: ${zoom.scale.toFixed(2)}x | Pan: (${Math.round(zoom.x)}, ${Math.round(zoom.y)})`}
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
