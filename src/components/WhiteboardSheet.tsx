import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stroke, DrawPoint } from '../types/math';

interface WhiteboardSheetProps {
  width?: number;
  height?: number;
  gridType?: 'dots' | 'grid' | 'blank';
  penColor?: string;
  penWidth?: number;
  isEraser?: boolean;
  strokes?: Stroke[];
  onDrawStroke?: (stroke: Stroke) => void;
  onPressureChange?: (pressure: number) => void;
  interactive?: boolean;
  className?: string;
}

export const WhiteboardSheet: React.FC<WhiteboardSheetProps> = ({
  width = 1400,
  height = 1048,
  gridType = 'dots',
  penColor = '#ffffff',
  penWidth = 3.5,
  isEraser = false,
  strokes = [],
  onDrawStroke,
  onPressureChange,
  interactive = true,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<DrawPoint[]>([]);
  const [isPointerInside, setIsPointerInside] = useState(false);

  // Background styling
  const gridClass =
    gridType === 'dots'
      ? 'bg-dot-grid'
      : gridType === 'grid'
      ? 'bg-math-grid'
      : '';

  // Redraw full stroke list onto canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear whole canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render all saved strokes
    strokes.forEach(stroke => {
      drawSingleStroke(ctx, stroke);
    });
  }, [strokes]);

  // Initial draw and redraw on strokes change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Function to draw a complete stroke with smoothing
  const drawSingleStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    const pts = stroke.points;
    if (pts.length === 0) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
    }

    if (pts.length === 1) {
      // Single dot
      const p = pts[0];
      const radius = Math.max(1, (stroke.baseWidth * (0.4 + (p.pressure || 0.5) * 1.2)) / 2);
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = stroke.isEraser ? 'rgba(0,0,0,1)' : stroke.color;
      ctx.fill();
      ctx.restore();
      return;
    }

    // Draw connected segments with variable width and bezier curve smoothing
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];

      const pressure = p1.pressure && p1.pressure > 0 ? p1.pressure : 0.5;
      const strokeWidth = stroke.isEraser
        ? stroke.baseWidth * 3.5
        : stroke.baseWidth * (0.4 + pressure * 1.2);

      ctx.beginPath();
      ctx.lineWidth = strokeWidth;

      if (i === 1) {
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
      } else {
        const pPrev = pts[i - 2];
        const midX = (pPrev.x + p0.x) / 2;
        const midY = (pPrev.y + p0.y) / 2;
        const nextMidX = (p0.x + p1.x) / 2;
        const nextMidY = (p0.y + p1.y) / 2;

        ctx.moveTo(midX, midY);
        ctx.quadraticCurveTo(p0.x, p0.y, nextMidX, nextMidY);
      }

      ctx.stroke();
    }

    ctx.restore();
  };

  // Convert client coordinate to canvas coordinate
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): DrawPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Huion and modern styluses report pressure 0.0 - 1.0
    let pressure = e.pressure;
    if (pressure === undefined || pressure === 0) {
      pressure = e.pointerType === 'mouse' ? 0.5 : 0.6;
    }

    return { x, y, pressure };
  };

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive) return;

    // Detect stylus eraser button or mode
    const isEraserActive = isEraser || e.buttons === 32 || (e.pointerType === 'pen' && e.buttons === 2);

    // Capture pointer
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const pt = getCanvasPoint(e);
    currentPointsRef.current = [pt];

    if (onPressureChange) onPressureChange(pt.pressure);

    // Draw instant point
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        if (isEraserActive) {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.fillStyle = 'rgba(0,0,0,1)';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, penWidth * 1.8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = penColor;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, Math.max(1, (penWidth * (0.4 + pt.pressure * 1.2)) / 2), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive || !isDrawingRef.current) return;

    const isEraserActive = isEraser || e.buttons === 32 || (e.pointerType === 'pen' && e.buttons === 2);
    const pt = getCanvasPoint(e);
    const pts = currentPointsRef.current;
    pts.push(pt);

    if (onPressureChange) onPressureChange(pt.pressure);

    // Incremental draw
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isEraserActive) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = penWidth * 3.5;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth * (0.4 + pt.pressure * 1.2);
    }

    if (pts.length > 2) {
      const pPrev = pts[pts.length - 3];
      const p0 = pts[pts.length - 2];
      const p1 = pts[pts.length - 1];

      const midPrevX = (pPrev.x + p0.x) / 2;
      const midPrevY = (pPrev.y + p0.y) / 2;
      const midNextX = (p0.x + p1.x) / 2;
      const midNextY = (p0.y + p1.y) / 2;

      ctx.beginPath();
      ctx.moveTo(midPrevX, midPrevY);
      ctx.quadraticCurveTo(p0.x, p0.y, midNextX, midNextY);
      ctx.stroke();
    } else if (pts.length === 2) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.stroke();
    }

    ctx.restore();
  };

  const finishDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive || !isDrawingRef.current) return;
    isDrawingRef.current = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if not captured
    }

    const pts = currentPointsRef.current;
    if (pts.length > 0 && onDrawStroke) {
      const isEraserActive = isEraser || e.buttons === 32 || (e.pointerType === 'pen' && e.buttons === 2);
      const newStroke: Stroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        points: [...pts],
        color: penColor,
        baseWidth: penWidth,
        isEraser: isEraserActive
      };
      onDrawStroke(newStroke);
    }

    currentPointsRef.current = [];
    if (onPressureChange) onPressureChange(0);
  };

  return (
    <div
      style={{
        width,
        height
      }}
      className={`glass-sheet rounded-[20px] overflow-hidden relative shadow-studio-card border border-white/12 select-none touch-none ${gridClass} ${className}`}
      onPointerEnter={() => setIsPointerInside(true)}
      onPointerLeave={() => setIsPointerInside(false)}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full block cursor-crosshair touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrawing}
        onPointerCancel={finishDrawing}
      />

      {/* Clean surface without watermark or labels */}
    </div>
  );
};

