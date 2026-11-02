import React, { useState, useEffect } from 'react';
import { useMathSocket } from '../context/SocketContext';
import { WhiteboardSheet } from '../components/WhiteboardSheet';
import { TabletToolbar } from '../components/TabletToolbar';
import { TaskCard } from '../components/TaskCard';
import { PEN_COLORS } from '../types/math';
import { ChevronRight, ChevronLeft, Eye, EyeOff, Radio } from 'lucide-react';

export const PresenterPage: React.FC = () => {
  const {
    state,
    isConnected,
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
  const [showTaskDrawer, setShowTaskDrawer] = useState(true);

  const currentTask = state.tasks[state.currentTaskIndex];

  // Hotkey support for Huion ExpressKeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        undoStroke();
        return;
      }

      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        if (e.shiftKey) {
          clearBoard();
        } else {
          setIsEraser(prev => !prev);
        }
        return;
      }

      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        const found = PEN_COLORS.find(c => c.key === e.key);
        if (found) {
          setIsEraser(false);
          setPenColor(found.hex);
        }
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        nextTask();
        return;
      }

      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        prevTask();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStroke, clearBoard, setPenColor, nextTask, prevTask]);

  return (
    <div className="w-screen h-screen bg-[#070b16] text-white flex flex-col overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="h-14 px-5 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <span className="text-xl">✍️</span>
          <div>
            <h1 className="text-sm font-bold tracking-wide flex items-center gap-2">
              <span>ARKUSZ PREZENTERA (HUION TABLET)</span>
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${isConnected
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}>
                <Radio className={`w-3 h-3 ${isConnected ? 'animate-pulse' : ''}`} />
                <span>{isConnected ? 'LIVE SYNC OBS' : 'ROZŁĄCZONO'}</span>
              </span>
            </h1>
          </div>
        </div>

        {/* Quick Task Switcher & Drawer Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-black/40 rounded-xl border border-white/10 p-0.5">
            <button
              onClick={prevTask}
              title="Poprzednie zadanie [P]"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-mono font-semibold text-amber-300">
              {currentTask?.number || `Zadanie ${state.currentTaskIndex + 1}`}
            </span>
            <button
              onClick={nextTask}
              title="Następne zadanie [N]"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowTaskDrawer(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${showTaskDrawer
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-white/5 text-slate-400 hover:text-white border-white/10'
              }`}
          >
            {showTaskDrawer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showTaskDrawer ? 'Zwiń Treść' : 'Pokaż Treść'}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Main Tablet Canvas Area */}
        <div className="flex-1 h-full p-4 flex items-center justify-center overflow-auto relative">
          <div className="relative shadow-2xl rounded-[20px] overflow-hidden">
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
              className="max-w-full max-h-[calc(100vh-140px)] aspect-[1400/1048] object-contain"
            />
          </div>

          {/* Floating Toolbar pinned at bottom */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
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
        </div>

        {/* Collapsible Reference Side Drawer for Tablet */}
        {showTaskDrawer && (
          <aside className="w-[450px] border-l border-white/10 bg-black/40 backdrop-blur-xl p-4 flex flex-col overflow-y-auto z-10 shadow-2xl">
            <TaskCard task={currentTask} className="w-full !h-auto flex-1" />
          </aside>
        )}
      </div>
    </div>
  );
};
