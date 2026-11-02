import React, { useState, useRef, useEffect } from 'react';
import { useMathSocket } from '../context/SocketContext';
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  Trash2,
  Plus,
  Radio,
  FileText,
  Layers,
  Sparkles,
  Clipboard
} from 'lucide-react';
import { PEN_COLORS, TaskItem } from '../types/math';
import { MathFormula } from '../components/MathFormula';

export const DirectorPage: React.FC = () => {
  const {
    state,
    isConnected,
    selectTask,
    nextTask,
    prevTask,
    setTaskImage,
    setTaskText,
    setPenColor,
    setGridType,
    clearBoard,
    addTask,
    deleteTask
  } = useMathSocket();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentTask = state.tasks[state.currentTaskIndex];

  const [editingText, setEditingText] = useState('');
  const [isEditingText, setIsEditingText] = useState(false);
  const [isAddingNewTask, setIsAddingNewTask] = useState(false);
  const [newTaskNumber, setNewTaskNumber] = useState('');
  const [newTaskText, setNewTaskText] = useState('');

  // Sync editing text when task changes
  useEffect(() => {
    if (currentTask) {
      setEditingText(currentTask.statementLatex || '');
    }
  }, [state.currentTaskIndex, currentTask]);

  // Handle Ctrl+V paste image anywhere on Director page
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = event => {
              const base64 = event.target?.result as string;
              if (base64) {
                setTaskImage(base64);
              }
            };
            reader.readAsDataURL(blob);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [setTaskImage]);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const base64 = event.target?.result as string;
      if (base64) {
        setTaskImage(base64);
      }
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  const handleSaveText = () => {
    setTaskText(editingText);
    setIsEditingText(false);
  };

  const handleCreateNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: TaskItem = {
      id: 'task-' + Date.now(),
      number: newTaskNumber.trim() || `Zadanie ${state.tasks.length + 1}`,
      statementLatex: newTaskText.trim() || 'Wpisz treść zadania lub wgraj zdjęcie...',
      imageUrl: null
    };
    addTask(newTask);
    setIsAddingNewTask(false);
    setNewTaskNumber('');
    setNewTaskText('');
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col select-none">
      {/* Top Bar */}
      <header className="h-16 px-6 border-b border-white/10 bg-black/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎛️</span>
          <div>
            <h1 className="text-base font-extrabold tracking-wide flex items-center gap-2">
              <span>PANEL REŻYSERA STUDIO</span>
              <span
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                  isConnected
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}
              >
                <Radio className={`w-3 h-3 ${isConnected ? 'animate-pulse' : ''}`} />
                <span>{isConnected ? 'POŁĄCZONY Z OBS' : 'BRAK POŁĄCZENIA'}</span>
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/overlay"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/25 transition-all cursor-pointer"
          >
            <span>🎥 Otwórz Nakładkę OBS</span>
          </a>
          <a
            href="/presenter"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/25 transition-all cursor-pointer"
          >
            <span>✍️ Arkusz Tabletu</span>
          </a>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        {/* Left Column (8 cols): Task Content & Image Upload */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Task Switcher */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-black text-white">
                  {currentTask?.number || `Zadanie ${state.currentTaskIndex + 1}`}
                </h2>
                <p className="text-xs text-slate-400">
                  Zarządzaj treścią zadania wyświetlaną w pasku po prawej stronie w OBS
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={prevTask}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Poprzednie [P]</span>
                </button>
                <button
                  onClick={nextTask}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-1 cursor-pointer transition-colors shadow-glow-cyan"
                >
                  <span>Następne [N]</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Task list pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
              {state.tasks.map((t, idx) => (
                <button
                  key={t.id}
                  onClick={() => selectTask(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    state.currentTaskIndex === idx
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                      : 'bg-white/5 text-slate-400 hover:text-white border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {t.number || `Zadanie ${idx + 1}`}
                </button>
              ))}

              <button
                onClick={() => setIsAddingNewTask(true)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-dashed border-white/20 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nowe zadanie</span>
              </button>
            </div>
          </div>

          {/* Task Content: Image Upload & Text Editor */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Treść Zadania w OBS</h3>
              </div>

              <div className="flex items-center gap-2">
                {currentTask?.imageUrl && (
                  <button
                    onClick={() => setTaskImage(null)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Usuń zdjęcie (przełącz na tekst)</span>
                  </button>
                )}

                {!isEditingText && !currentTask?.imageUrl && (
                  <button
                    onClick={() => setIsEditingText(true)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Edytuj tekst / LaTeX</span>
                  </button>
                )}
              </div>
            </div>

            {/* Display: Image vs Text Preview */}
            {currentTask?.imageUrl ? (
              <div className="space-y-3">
                <div className="border border-white/15 rounded-xl p-3 bg-black/40 flex items-center justify-center max-h-[380px] overflow-auto">
                  <img
                    src={currentTask.imageUrl}
                    alt="Podgląd zadania"
                    className="max-h-[340px] max-w-full object-contain rounded-lg shadow-md"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>✓ To zdjęcie jest aktualnie wyświetlane w pasku OBS</span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-cyan-400 hover:underline cursor-pointer"
                  >
                    Zmień na inne zdjęcie...
                  </button>
                </div>
              </div>
            ) : isEditingText ? (
              <div className="space-y-3">
                <textarea
                  rows={6}
                  value={editingText}
                  onChange={e => setEditingText(e.target.value)}
                  placeholder="Wpisz treść zadania z formułami LaTeX (np. \( x^2 + 4 = 0 \))..."
                  className="w-full bg-black/60 border border-white/20 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingText(false)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs cursor-pointer"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleSaveText}
                    className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs cursor-pointer shadow-glow-cyan"
                  >
                    Zapisz i wyślij do OBS
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-black/40 rounded-xl p-5 border border-white/5 text-sm text-slate-200 leading-relaxed min-h-[140px]">
                  <MathFormula math={currentTask?.statementLatex || ''} block={true} />
                </div>
              </div>
            )}

            {/* Upload Area for Image */}
            <div className="pt-2 border-t border-white/10">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/15 hover:border-cyan-400/60 rounded-xl p-5 text-center cursor-pointer bg-white/[0.02] hover:bg-cyan-500/[0.04] transition-all group"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Kliknij, aby wgrać zdjęcie zadania (lub zrzut ekranu)
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block flex items-center justify-center gap-1">
                      <Clipboard className="w-3 h-3 text-cyan-400" />
                      Wskazówka: możesz też po prostu wcisnąć <kbd className="bg-white/10 px-1 rounded text-white">Ctrl+V</kbd> w dowolnym miejscu!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Arkusz, Grid, Tools */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card: Whiteboard & Pen Controls */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Arkusz i Pióro</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Kolor pióra:</label>
                <div className="flex items-center gap-2">
                  {PEN_COLORS.map(c => (
                    <button
                      key={c.hex}
                      onClick={() => setPenColor(c.hex)}
                      title={c.name}
                      className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${
                        state.drawingColor.toLowerCase() === c.hex.toLowerCase()
                          ? 'border-white scale-110 shadow-lg'
                          : 'border-transparent hover:scale-105 opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Tło arkusza:</label>
                <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                  <button
                    onClick={() => setGridType('dots')}
                    className={`py-1.5 rounded-lg border transition-colors cursor-pointer ${
                      state.gridType === 'dots'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}
                  >
                    Kropki
                  </button>
                  <button
                    onClick={() => setGridType('grid')}
                    className={`py-1.5 rounded-lg border transition-colors cursor-pointer ${
                      state.gridType === 'grid'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}
                  >
                    Kratka
                  </button>
                  <button
                    onClick={() => setGridType('blank')}
                    className={`py-1.5 rounded-lg border transition-colors cursor-pointer ${
                      state.gridType === 'blank'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}
                  >
                    Czysty
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={clearBoard}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Wyczyść cały arkusz [Shift+E]</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="glass-panel rounded-2xl p-5 border border-white/10 text-xs space-y-2 text-slate-400">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Skróty Tabletu Huion</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div><kbd className="bg-white/10 px-1 rounded text-white">[E]</kbd> Gumka</div>
              <div><kbd className="bg-white/10 px-1 rounded text-white">[Ctrl+Z]</kbd> Cofnij</div>
              <div><kbd className="bg-white/10 px-1 rounded text-white">[1-5]</kbd> Kolory pióra</div>
              <div><kbd className="bg-white/10 px-1 rounded text-white">[N]</kbd> Następne zadanie</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: New Task */}
      {isAddingNewTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b1122] border border-white/15 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              <span>Dodaj Zadanie</span>
            </h3>

            <form onSubmit={handleCreateNewTask} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Nazwa zadania:</label>
                <input
                  type="text"
                  placeholder="np. Zadanie 6"
                  value={newTaskNumber}
                  onChange={e => setNewTaskNumber(e.target.value)}
                  className="w-full bg-black/50 border border-white/15 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Treść zadania (LaTeX):</label>
                <textarea
                  rows={4}
                  placeholder="Wpisz treść zadania lub zostaw puste jeśli chcesz wgrać zdjęcie..."
                  value={newTaskText}
                  onChange={e => setNewTaskText(e.target.value)}
                  className="w-full bg-black/50 border border-white/15 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddingNewTask(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black cursor-pointer shadow-glow-cyan"
                >
                  Dodaj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
