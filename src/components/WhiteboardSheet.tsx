import React, { useRef, useEffect, useCallback } from 'react';
import { Stroke, DrawPoint, StrokeStartPayload, StrokeChunk } from '../types/math';
import { useMathSocket } from '../context/SocketContext';

interface WhiteboardSheetProps {
  width?: number;
  height?: number;
  gridType?: 'dots' | 'grid' | 'blank';
  penColor?: string;
  penWidth?: number;
  eraserWidth?: number;
  isEraser?: boolean;
  strokes?: Stroke[];
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
  eraserWidth = 60,
  isEraser = false,
  strokes = [],
  onPressureChange,
  interactive = true,
  className = ''
}) => {
  const {
    emitStrokeStart,
    emitStrokeChunk,
    emitStrokeEnd,
    onRemoteStrokeStart,
    onRemoteStrokeChunk,
    onRemoteStrokeEnd,
    onBoardCleared,
    onStrokeUndone
  } = useMathSocket();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeIdRef = useRef<string>('');
  const currentPointsRef = useRef<DrawPoint[]>([]);
  const pendingChunkRef = useRef<DrawPoint[]>([]);
  const lastChunkTimeRef = useRef<number>(0);

  // Buffer for incoming live remote strokes
  const remoteActiveStrokes = useRef<{ [id: string]: { points: DrawPoint[]; color: string; baseWidth: number; isEraser?: boolean } }>({});

  const gridClass =
    gridType === 'dots'
      ? 'bg-dot-grid'
      : gridType === 'grid'
      ? 'bg-math-grid'
      : '';

  // Redraw complete canvas from strokes list
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach(stroke => {
      drawFullStroke(ctx, stroke);
    });
  }, [strokes]);

  // Initial draw
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Handle board clear and undo
  useEffect(() => {
    const unbindClear = onBoardCleared(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    const unbindUndo = onStrokeUndone(() => {
      redrawCanvas();
    });

    return () => {
      unbindClear();
      unbindUndo();
    };
  }, [onBoardCleared, onStrokeUndone, redrawCanvas]);

  // Remote real-time drawing listeners for smooth 60fps mirroring in OBS
  useEffect(() => {
    const unbindStart = onRemoteStrokeStart((data: StrokeStartPayload) => {
      remoteActiveStrokes.current[data.id] = {
        points: [data.firstPoint],
        color: data.color,
        baseWidth: data.baseWidth,
        isEraser: data.isEraser
      };

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw initial dot
      ctx.save();
      if (data.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(data.firstPoint.x, data.firstPoint.y, data.baseWidth / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = data.color;
        ctx.beginPath();
        ctx.arc(
          data.firstPoint.x,
          data.firstPoint.y,
          Math.max(1, (data.baseWidth * (0.4 + (data.firstPoint.pressure || 0.5) * 1.2)) / 2),
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      ctx.restore();
    });

    const unbindChunk = onRemoteStrokeChunk((chunk: StrokeChunk) => {
      const active = remoteActiveStrokes.current[chunk.id];
      if (!active) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Append points and draw new curve segments in real time
      for (const pt of chunk.points) {
        active.points.push(pt);
        const pts = active.points;
        if (pts.length >= 2) {
          drawIncrementalSegment(ctx, pts, active.baseWidth, active.color, active.isEraser);
        }
      }
    });

    const unbindEnd = onRemoteStrokeEnd((finalStroke: Stroke) => {
      delete remoteActiveStrokes.current[finalStroke.id];
    });

    return () => {
      unbindStart();
      unbindChunk();
      unbindEnd();
    };
  }, [onRemoteStrokeStart, onRemoteStrokeChunk, onRemoteStrokeEnd]);

  // Helper: Draw smooth incremental Bezier curve segment
  const drawIncrementalSegment = (
    ctx: CanvasRenderingContext2D,
    pts: DrawPoint[],
    baseWidth: number,
    color: string,
    isEraserActive?: boolean
  ) => {
    const pt = pts[pts.length - 1];
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isEraserActive) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = baseWidth;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = baseWidth * (0.4 + (pt.pressure || 0.5) * 1.2);
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

  // Helper: Draw full stroke with Bezier smoothing (for initial loads / redraws)
  const drawFullStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
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
      const p = pts[0];
      const radius = stroke.isEraser
        ? stroke.baseWidth / 2
        : Math.max(1, (stroke.baseWidth * (0.4 + (p.pressure || 0.5) * 1.2)) / 2);
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = stroke.isEraser ? 'rgba(0,0,0,1)' : stroke.color;
      ctx.fill();
      ctx.restore();
      return;
    }

    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];

      const pressure = p1.pressure && p1.pressure > 0 ? p1.pressure : 0.5;
      const strokeWidth = stroke.isEraser
        ? stroke.baseWidth
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

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): DrawPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    let pressure = e.pressure;
    if (pressure === undefined || pressure === 0) {
      pressure = e.pointerType === 'mouse' ? 0.5 : 0.6;
    }

    return { x, y, pressure };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive) return;

    const isEraserActive = isEraser || e.buttons === 32 || (e.pointerType === 'pen' && e.buttons === 2);
    const effectiveWidth = isEraserActive ? eraserWidth : penWidth;

    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const pt = getCanvasPoint(e);
    const strokeId = `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    currentStrokeIdRef.current = strokeId;
    currentPointsRef.current = [pt];
    pendingChunkRef.current = [];
    lastChunkTimeRef.current = performance.now();

    if (onPressureChange) onPressureChange(pt.pressure);

    // 1. Send live start signal to OBS & other clients immediately
    emitStrokeStart({
      id: strokeId,
      firstPoint: pt,
      color: penColor,
      baseWidth: effectiveWidth,
      isEraser: isEraserActive
    });

    // 2. Draw initial dot locally
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        if (isEraserActive) {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.fillStyle = 'rgba(0,0,0,1)';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, effectiveWidth / 2, 0, Math.PI * 2);
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
    const effectiveWidth = isEraserActive ? eraserWidth : penWidth;
    const pt = getCanvasPoint(e);
    const pts = currentPointsRef.current;
    pts.push(pt);
    pendingChunkRef.current.push(pt);

    if (onPressureChange) onPressureChange(pt.pressure);

    // Stream chunk in real time every ~16ms (60 FPS) or when buffer reaches 2 points
    const now = performance.now();
    if (now - lastChunkTimeRef.current >= 14 || pendingChunkRef.current.length >= 2) {
      emitStrokeChunk({
        id: currentStrokeIdRef.current,
        points: [...pendingChunkRef.current]
      });
      pendingChunkRef.current = [];
      lastChunkTimeRef.current = now;
    }

    // Draw locally with Bezier curve
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawIncrementalSegment(ctx, pts, effectiveWidth, penColor, isEraserActive);
  };

  const finishDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive || !isDrawingRef.current) return;
    isDrawingRef.current = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    const pts = currentPointsRef.current;
    const isEraserActive = isEraser || e.buttons === 32 || (e.pointerType === 'pen' && e.buttons === 2);
    const effectiveWidth = isEraserActive ? eraserWidth : penWidth;

    // Send any remaining points in chunk buffer
    if (pendingChunkRef.current.length > 0) {
      emitStrokeChunk({
        id: currentStrokeIdRef.current,
        points: [...pendingChunkRef.current]
      });
      pendingChunkRef.current = [];
    }

    // Finalize stroke and save to persistent server history
    if (pts.length > 0) {
      const finalStroke: Stroke = {
        id: currentStrokeIdRef.current,
        points: [...pts],
        color: penColor,
        baseWidth: effectiveWidth,
        isEraser: isEraserActive
      };
      emitStrokeEnd(finalStroke);
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
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`w-full h-full block touch-none ${
          isEraser ? 'cursor-cell' : 'cursor-crosshair'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrawing}
        onPointerCancel={finishDrawing}
      />
    </div>
  );
};
