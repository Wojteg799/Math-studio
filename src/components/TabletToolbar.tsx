import React from 'react';
import { Undo2, Trash2, Eraser, PenTool, Grid3X3, Hash, CircleOff } from 'lucide-react';
import { PEN_COLORS } from '../types/math';

interface TabletToolbarProps {
  penColor: string;
  penWidth: number;
  eraserWidth?: number;
  isEraser: boolean;
  gridType: 'dots' | 'grid' | 'blank';
  currentPressure?: number;
  onSelectColor: (color: string) => void;
  onSelectWidth: (width: number) => void;
  onSelectEraserWidth?: (width: number) => void;
  onToggleEraser: (eraser: boolean) => void;
  onUndo: () => void;
  onClear: () => void;
  onChangeGrid: (grid: 'dots' | 'grid' | 'blank') => void;
  className?: string;
}

const PEN_PRESETS = [2, 4, 7, 14, 24, 36];
const ERASER_PRESETS = [20, 45, 80, 140, 240];

export const TabletToolbar: React.FC<TabletToolbarProps> = ({
  penColor,
  penWidth,
  eraserWidth = 60,
  isEraser,
  gridType,
  currentPressure = 0,
  onSelectColor,
  onSelectWidth,
  onSelectEraserWidth,
  onToggleEraser,
  onUndo,
  onClear,
  onChangeGrid,
  className = ''
}) => {
  const currentSize = isEraser ? eraserWidth : penWidth;
  const presets = isEraser ? ERASER_PRESETS : PEN_PRESETS;
  const minSlider = isEraser ? 15 : 1.5;
  const maxSlider = isEraser ? 260 : 40;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isEraser && onSelectEraserWidth) {
      onSelectEraserWidth(val);
    } else {
      onSelectWidth(val);
    }
  };

  const handlePresetClick = (w: number) => {
    if (isEraser && onSelectEraserWidth) {
      onSelectEraserWidth(w);
    } else {
      onSelectWidth(w);
    }
  };

  return (
    <div
      className={`glass-panel rounded-2xl p-2.5 px-4 flex items-center gap-3.5 border border-white/12 shadow-2xl backdrop-blur-xl ${className}`}
    >
      {/* Mode: Pen vs Eraser */}
      <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10">
        <button
          onClick={() => onToggleEraser(false)}
          title="Tryb pióra [1-5]"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            !isEraser
              ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>Pióro</span>
        </button>

        <button
          onClick={() => onToggleEraser(true)}
          title="Tryb gumki [E]"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            isEraser
              ? 'bg-rose-500 text-white shadow-md font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Eraser className="w-3.5 h-3.5" />
          <span>Gumka</span>
        </button>
      </div>

      {/* Colors (visible only when in Pen mode) */}
      {!isEraser && (
        <div className="flex items-center gap-1.5 pl-1 border-l border-white/10">
          {PEN_COLORS.map(c => {
            const isSelected = penColor.toLowerCase() === c.hex.toLowerCase();
            return (
              <button
                key={c.hex}
                onClick={() => onSelectColor(c.hex)}
                title={`${c.name} [Klawisz ${c.key}]`}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
                  isSelected
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-[#070b16] scale-110 shadow-lg'
                    : 'hover:scale-105 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.hex }}
              >
                <span className="sr-only">{c.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Dynamic Size Section: Presets + Slider + Preview Dot */}
      <div className="flex items-center gap-2 pl-2 border-l border-white/10">
        <span className="text-[11px] font-mono text-slate-400 w-12 text-right">
          {Math.round(currentSize)}px
        </span>

        {/* Quick Presets */}
        <div className="flex items-center gap-1">
          {presets.map(w => {
            const isSelected = Math.round(currentSize) === w;
            return (
              <button
                key={w}
                onClick={() => handlePresetClick(w)}
                title={`${isEraser ? 'Gumka' : 'Pióro'}: ${w}px`}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer ${
                  isSelected
                    ? isEraser
                      ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50'
                      : 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-white/5'
                }`}
              >
                {w}
              </button>
            );
          })}
        </div>

        {/* Range Slider for free size control */}
        <div className="flex items-center gap-1.5 px-1">
          <input
            type="range"
            min={minSlider}
            max={maxSlider}
            step="1"
            value={currentSize}
            onChange={handleSliderChange}
            className="w-20 h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            title={`Płynna regulacja rozmiaru (${minSlider}-${maxSlider}px)`}
          />

          {/* Visual size preview bubble */}
          <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
            <span
              className={`rounded-full transition-all ${
                isEraser ? 'bg-rose-400' : 'bg-white'
              }`}
              style={{
                width: Math.min(26, Math.max(3, isEraser ? currentSize / 7 : currentSize * 0.9)),
                height: Math.min(26, Math.max(3, isEraser ? currentSize / 7 : currentSize * 0.9))
              }}
            />
          </div>
        </div>
      </div>

      {/* Grid selector */}
      <div className="flex items-center gap-1 pl-2 border-l border-white/10">
        <button
          onClick={() => onChangeGrid('dots')}
          title="Tło: Siatka punktowa"
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            gridType === 'dots'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onChangeGrid('grid')}
          title="Tło: Kratka matematyczna"
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            gridType === 'grid'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Hash className="w-4 h-4" />
        </button>
        <button
          onClick={() => onChangeGrid('blank')}
          title="Tło: Czysty grafit"
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            gridType === 'blank'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CircleOff className="w-4 h-4" />
        </button>
      </div>

      {/* Undo & Clear */}
      <div className="flex items-center gap-1 pl-2 border-l border-white/10">
        <button
          onClick={onUndo}
          title="Cofnij [Ctrl+Z]"
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onClear}
          title="Wyczyść arkusz [Shift+E]"
          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Huion Stylus Pressure Bar */}
      <div className="flex items-center gap-2 pl-2 border-l border-white/10 text-[11px] font-mono text-slate-400">
        <div className="w-16 h-2 bg-black/60 rounded-full overflow-hidden border border-white/10 relative">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 transition-all duration-75"
            style={{ width: `${Math.min(100, Math.round(currentPressure * 100))}%` }}
          />
        </div>
        <span className="w-7 tabular-nums text-slate-300 text-[10px]">
          {(currentPressure * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
};
