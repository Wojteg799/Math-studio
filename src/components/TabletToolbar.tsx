import React from 'react';
import { Undo2, Trash2, Eraser, PenTool, Grid3X3, Hash, CircleOff } from 'lucide-react';
import { PEN_COLORS } from '../types/math';

interface TabletToolbarProps {
  penColor: string;
  penWidth: number;
  isEraser: boolean;
  gridType: 'dots' | 'grid' | 'blank';
  currentPressure?: number;
  onSelectColor: (color: string) => void;
  onSelectWidth: (width: number) => void;
  onToggleEraser: (eraser: boolean) => void;
  onUndo: () => void;
  onClear: () => void;
  onChangeGrid: (grid: 'dots' | 'grid' | 'blank') => void;
  className?: string;
}

export const TabletToolbar: React.FC<TabletToolbarProps> = ({
  penColor,
  penWidth,
  isEraser,
  gridType,
  currentPressure = 0,
  onSelectColor,
  onSelectWidth,
  onToggleEraser,
  onUndo,
  onClear,
  onChangeGrid,
  className = ''
}) => {
  return (
    <div
      className={`glass-panel rounded-2xl p-2.5 px-4 flex items-center gap-4 border border-white/12 shadow-2xl backdrop-blur-xl ${className}`}
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

      {/* Color Palette (disabled if eraser) */}
      <div className="flex items-center gap-1.5 pl-1 border-l border-white/10">
        {PEN_COLORS.map(c => {
          const isSelected = !isEraser && penColor.toLowerCase() === c.hex.toLowerCase();
          return (
            <button
              key={c.hex}
              onClick={() => {
                onToggleEraser(false);
                onSelectColor(c.hex);
              }}
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

      {/* Pen Width Presets */}
      <div className="flex items-center gap-1 pl-2 border-l border-white/10">
        {[2, 3.5, 5, 8].map(w => (
          <button
            key={w}
            onClick={() => onSelectWidth(w)}
            title={`Grubość: ${w}px`}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono transition-all cursor-pointer ${
              penWidth === w
                ? 'bg-white/20 text-white border border-white/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <span
              className="rounded-full bg-current"
              style={{ width: Math.max(3, w * 1.2), height: Math.max(3, w * 1.2) }}
            />
          </button>
        ))}
      </div>

      {/* Grid selector */}
      <div className="flex items-center gap-1 pl-2 border-l border-white/10">
        <button
          onClick={() => onChangeGrid('dots')}
          title="Tło: Siatka punktowa"
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            gridType === 'dots' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onChangeGrid('grid')}
          title="Tło: Kratka matematyczna"
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            gridType === 'grid' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Hash className="w-4 h-4" />
        </button>
        <button
          onClick={() => onChangeGrid('blank')}
          title="Tło: Czysty grafit"
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            gridType === 'blank' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
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
          title="Wyczyść arkusz [Klawisz E]"
          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Huion Stylus Pressure Bar */}
      <div className="flex items-center gap-2 pl-3 border-l border-white/10 text-[11px] font-mono text-slate-400">
        <span>Nacisk Huion:</span>
        <div className="w-20 h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10 relative">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 transition-all duration-75"
            style={{ width: `${Math.min(100, Math.round(currentPressure * 100))}%` }}
          />
        </div>
        <span className="w-8 tabular-nums font-bold text-slate-200">
          {(currentPressure * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
};

