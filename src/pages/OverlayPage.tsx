import React, { useState, useEffect } from 'react';
import { useMathSocket } from '../context/SocketContext';
import { MathMatrixRain } from '../components/MathMatrixRain';
import { WhiteboardSheet } from '../components/WhiteboardSheet';
import { CameraFrame } from '../components/CameraFrame';
import { TaskCard } from '../components/TaskCard';
import { TabletToolbar } from '../components/TabletToolbar';
import { PEN_COLORS } from '../types/math';

export const OverlayPage: React.FC = () => {
  const {
    state,
    sendStroke,
    clearBoard,
    undoStroke,
    nextTask,
    prevTask,
    setPenColor,
    setPenWidth,
    setGridType
  } = useMathSocket();

  const [isEraser, setIsEraser] = useState(false);
  const [eraserWidth, setEraserWidth] = useState(60);
  const [currentPressure, setCurrentPressure] = useState(0);
  const [showToolbar, setShowToolbar] = useState(false);
  const [fitToScreen, setFitToScreen] = useState(false);
  const [scale, setScale] = useState(1);

  const currentTask = state.tasks[state.currentTaskIndex];

  // Auto-scale if fitToScreen is enabled via [F] key
  useEffect(() => {
    const handleResize = () => {
      if (fitToScreen) {
        const scaleX = window.innerWidth / 1920;
        const scaleY = window.innerHeight / 1080;
        setScale(Math.min(scaleX, scaleY));
      } else {
        setScale(1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitToScreen]);

  // Keyboard shortcuts (mapped to Huion ExpressKeys & standard keyboard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // [Ctrl+Z]: Undo
      if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        undoStroke();
        return;
      }

      // [E]: Eraser toggle / Shift+E clear
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        if (e.shiftKey) {
          clearBoard();
        } else {
          setIsEraser(prev => !prev);
        }
        return;
      }

      // [1] - [5]: Pen Colors
      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        const found = PEN_COLORS.find(c => c.key === e.key);
        if (found) {
          setIsEraser(false);
          setPenColor(found.hex);
        }
        return;
      }

      // [N]: Next task
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        nextTask();
        return;
      }

      // [P]: Prev task
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        prevTask();
        return;
      }

      // [T]: Toggle on-screen toolbar
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setShowToolbar(prev => !prev);
        return;
      }

      // [F]: Fit to screen toggle
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setFitToScreen(prev => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStroke, clearBoard, setPenColor, nextTask, prevTask]);

  return (
    <div className="relative w-screen h-screen bg-transparent overflow-hidden flex items-center justify-center">
      {/* SVG Mask Definition for 100% Transparent Camera Cutout */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <mask id="obs-camera-cutout-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080">
            {/* White: visible dark studio background & matrix rain */}
            <rect x="0" y="0" width="1920" height="1080" fill="#ffffff" />
            {/* Black: 100% transparent cutout for physical webcam underneath */}
            <rect x="1432" y="16" width="472" height="290" rx="16" ry="16" fill="#000000" />
          </mask>
        </defs>
      </svg>

      {/* 1920x1080 OBS Stage */}
      <div
        id="obs-canvas"
        style={{
          width: 1920,
          height: 1080,
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'center center'
        }}
        className="relative overflow-hidden bg-transparent flex-shrink-0"
      >
        {/* Background Layer with Camera Cutout: Studio Dark + Vivid Green Matrix Rain */}
        <div
          style={{
            mask: 'url(#obs-camera-cutout-mask)',
            WebkitMask: 'url(#obs-camera-cutout-mask)'
          }}
          className="absolute inset-0 pointer-events-none z-0"
        >
          {/* Deep dark studio background */}
          <div className="absolute inset-0 bg-[#060913]" />

          {/* Slow, vivid emerald green Matrix rain */}
          <MathMatrixRain opacity={0.45} speedMultiplier={1.0} />
        </div>

        {/* ELEMENT #1: GŁÓWNY ARKUSZ (1400 x 1048 px at left: 16px, top: 16px) */}
        <div
          style={{
            position: 'absolute',
            left: 16,
            top: 16,
            width: 1400,
            height: 1048
          }}
          className="z-10"
        >
          <WhiteboardSheet
            width={1400}
            height={1048}
            gridType={state.gridType}
            penColor={state.drawingColor}
            penWidth={state.drawingWidth}
            eraserWidth={eraserWidth}
            isEraser={isEraser}
            strokes={state.strokes}
            onPressureChange={setCurrentPressure}
            interactive={true}
          />
        </div>

        {/* ELEMENT #2: OKNO KAMERKI TWARZY (472 x 290 px at left: 1432px, top: 16px) */}
        {/* W 100% przezroczyste wycięcie, pod którym widać kamerę z warstwy niżej w OBS */}
        <div
          style={{
            position: 'absolute',
            left: 1432,
            top: 16,
            width: 472,
            height: 290
          }}
          className="z-10 pointer-events-none"
        >
          <CameraFrame />
        </div>

        {/* ELEMENT #3: KAFELEK TREŚCI ZADANIA (472 x 742 px at left: 1432px, top: 322px) */}
        <div
          style={{
            position: 'absolute',
            left: 1432,
            top: 322,
            width: 472,
            height: 742
          }}
          className="z-10"
        >
          <TaskCard task={currentTask} />
        </div>

        {/* Optional Presenter Quick Toolbar (toggleable with [T]) */}
        {showToolbar && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
            <TabletToolbar
              penColor={state.drawingColor}
              penWidth={state.drawingWidth}
              eraserWidth={eraserWidth}
              isEraser={isEraser}
              gridType={state.gridType}
              currentPressure={currentPressure}
              onSelectColor={setPenColor}
              onSelectWidth={setPenWidth}
              onSelectEraserWidth={setEraserWidth}
              onToggleEraser={setIsEraser}
              onUndo={undoStroke}
              onClear={clearBoard}
              onChangeGrid={setGridType}
            />
          </div>
        )}
      </div>
    </div>
  );
};
