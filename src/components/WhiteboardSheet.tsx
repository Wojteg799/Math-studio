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

  // Two-layer architecture for zero-lag 60fps drawing:
  // Layer 1: mainCanvas holds all committed past strokes
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  // Layer 2: liveCanvas holds ONLY the currently drawn stroke in real-time
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);

  const isDrawingRef = useRef(false);
  const currentStrokeIdRef = useRef<string>('');
  const currentPointsRef = useRef<DrawPoint[]>([]);
  const pendingChunkRef = useRef<DrawPoint[]>([]);
  const rafBatchIdRef = useRef<number | null>(null);

  // Active remote stroke tracking for incoming OBS mirror
  const remoteActiveStrokes = useRef<{
    [id: string]: { points: DrawPoint[]; color: string; baseWidth: number; isEraser?: boolean };
  }>({});

  const gridClass =
    gridType === 'dots'
      ? 'bg-dot-grid'
      : gridType === 'grid'
      ? 'bg-math-grid'
      : '';

  // Redraw main canvas ONLY when strokes list changes (Initial load, Undo, Clear)
  const redrawMainCanvas = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach(stroke => {
      drawStrokeToContext(ctx, stroke);
    });
  }, [strokes]);

  // Initial draw and when undo/clear occurs
  useEffect(() => {
    redrawMainCanvas();
  }, [redrawMainCanvas]);

  useEffect(() => {
    const unbindClear = onBoardCleared(() => {
      const main = mainCanvasRef.current;
      const live = liveCanvasRef.current;
      if (main) {
        const ctx = main.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, main.width, main.height);
      }
      if (live) {
        const ctx = live.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, live.width, live.height);
      }
    });

    const unbindUndo = onStrokeUndone(() => {
      redrawMainCanvas();
    });

    return () => {
      unbindClear();
      unbindUndo();
    };
  }, [onBoardCleared, onStrokeUndone, redrawMainCanvas]);

  // Remote real-time drawing listeners for OBS
  useEffect(() => {
    const unbindStart = onRemoteStrokeStart((data: StrokeStartPayload) => {
      remoteActiveStrokes.current[data.id] = {
        points: [data.firstPoint],
        color: data.color,
        baseWidth: data.baseWidth,
        isEraser: data.isEraser
      };

      const canvas = liveCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw initial point on live layer
      if (data.isEraser) {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(data.firstPoint.x, data.firstPoint.y, data.baseWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.save();
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
        ctx.restore();
      }
    });

    const unbindChunk = onRemoteStrokeChunk((chunk: StrokeChunk) => {
      const active = remoteActiveStrokes.current[chunk.id];
      if (!active) return;

      const canvas = liveCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw segments incrementally in real-time
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

      // Merge finished stroke directly into main canvas without clearing
      const mainCanvas = mainCanvasRef.current;
      const liveCanvas = liveCanvasRef.current;
      if (mainCanvas && liveCanvas) {
        const mainCtx = mainCanvas.getContext('2d');
        const liveCtx = liveCanvas.getContext('2d');
        if (mainCtx && liveCtx) {
          if (finalStroke.isEraser) {
            // Replay eraser stroke on main
            drawStrokeToContext(mainCtx, finalStroke);
          } else {
            // Composite live layer to main
            mainCtx.drawImage(liveCanvas, 0, 0);
          }
          liveCtx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
        }
      }
    });

    return () => {
      unbindStart();
      unbindChunk();
      unbindEnd();
    };
  }, [onRemoteStrokeStart, onRemoteStrokeChunk, onRemoteStrokeEnd]);

  // Draw smooth Bezier curve segment
  const drawIncrementalSegment = (
    ctx: CanvasRenderingContext2D,
    pts: DrawPoint[],
    baseWidth: number,
    color: string,
    isEraserActive?: boolean
  ) => {
    const pt = pts[pts.length - 1];

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

    ctx.beginPath();
    if (pts.length > 2) {
      const pPrev = pts[pts.length - 3];
      const p0 = pts[pts.length - 2];
      const p1 = pts[pts.length - 1];

      const midPrevX = (pPrev.x + p0.x) / 2;
      const midPrevY = (pPrev.y + p0.y) / 2;
      const midNextX = (p0.x + p1.x) / 2;
      const midNextY = (p0.y + p1.y) / 2;

      ctx.moveTo(midPrevX, midPrevY);
      ctx.quadraticCurveTo(p0.x, p0.y, midNextX, midNextY);
    } else if (pts.length === 2) {
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
    }
    ctx.stroke();
  };

  // Full stroke rendering for historical replay
  const drawStrokeToContext = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
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
    const canvas = liveCanvasRef.current;
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

  // Dedicated RAF chunk dispatcher to synchronize smoothly with 60 FPS display rate
  const scheduleChunkFlush = () => {
    if (rafBatchIdRef.current !== null) return;

    rafBatchIdRef.current = requestAnimationFrame(() => {
      rafBatchIdRef.current = null;
      if (pendingChunkRef.current.length > 0 && isDrawingRef.current) {
        emitStrokeChunk({
          id: currentStrokeIdRef.current,
          points: [...pendingChunkRef.current]
        });
        pendingChunkRef.current = [];
      }
    });
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

    if (onPressureChange) onPressureChange(pt.pressure);

    // Live stream start
    emitStrokeStart({
      id: strokeId,
      firstPoint: pt,
      color: penColor,
      baseWidth: effectiveWidth,
      isEraser: isEraserActive
    });

    // Draw initial dot on live canvas
    const canvas = liveCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        if (isEraserActive) {
          ctx.globalCompositeOperation = 'destination-out';
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

    // Use Coalesced Events from hardware digitizer (Huion 266 RPS) for silky-smooth curves
    // with native browser support
    const nativeEvent = e.nativeEvent as PointerEvent;
    const coalesced = typeof nativeEvent.getCoalescedEvents === 'function'
      ? nativeEvent.getCoalescedEvents()
      : null;

    const canvas = liveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (coalesced && coalesced.length > 0) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      for (const ce of coalesced) {
        const cpt: DrawPoint = {
          x: (ce.clientX - rect.left) * scaleX,
          y: (ce.clientY - rect.top) * scaleY,
          pressure: ce.pressure && ce.pressure > 0 ? ce.pressure : 0.5
        };
        currentPointsRef.current.push(cpt);
        pendingChunkRef.current.push(cpt);
        drawIncrementalSegment(ctx, currentPointsRef.current, effectiveWidth, penColor, isEraserActive);
      }
      if (onPressureChange && coalesced.length > 0) {
        onPressureChange(coalesced[coalesced.length - 1].pressure || 0.5);
      }
    } else {
      const pt = getCanvasPoint(e);
      currentPointsRef.current.push(pt);
      pendingChunkRef.current.push(pt);
      if (onPressureChange) onPressureChange(pt.pressure);
      drawIncrementalSegment(ctx, currentPointsRef.current, effectiveWidth, penColor, isEraserActive);
    }

    scheduleChunkFlush();
  };

  const finishDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive || !isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (rafBatchIdRef.current !== null) {
      cancelAnimationFrame(rafBatchIdRef.current);
      rafBatchIdRef.current = null;
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    const pts = currentPointsRef.current;
    const isEraserActive = isEraser || e.buttons === 32 || (e.pointerType === 'pen' && e.buttons === 2);
    const effectiveWidth = isEraserActive ? eraserWidth : penWidth;

    // Flush any pending points
    if (pendingChunkRef.current.length > 0) {
      emitStrokeChunk({
        id: currentStrokeIdRef.current,
        points: [...pendingChunkRef.current]
      });
      pendingChunkRef.current = [];
    }

    // Merge live layer to main canvas
    const mainCanvas = mainCanvasRef.current;
    const liveCanvas = liveCanvasRef.current;
    if (mainCanvas && liveCanvas) {
      const mainCtx = mainCanvas.getContext('2d');
      const liveCtx = liveCanvas.getContext('2d');
      if (mainCtx && liveCtx) {
        if (isEraserActive && pts.length > 0) {
          const finalStroke: Stroke = {
            id: currentStrokeIdRef.current,
            points: [...pts],
            color: penColor,
            baseWidth: effectiveWidth,
            isEraser: isEraserActive
          };
          drawStrokeToContext(mainCtx, finalStroke);
        } else {
          mainCtx.drawImage(liveCanvas, 0, 0);
        }
        liveCtx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
      }
    }

    // Finalize stroke and emit to server
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
      {/* Layer 1: Permanent Committed Strokes (Never redraws during drawing!) */}
      <canvas
        ref={mainCanvasRef}
        width={width}
        height={height}
        className="w-full h-full block absolute inset-0 pointer-events-none"
      />

      {/* Layer 2: Live Active Stroke (Fast, ultra-smooth, zero friction) */}
      <canvas
        ref={liveCanvasRef}
        width={width}
        height={height}
        className={`w-full h-full block absolute inset-0 touch-none ${
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
