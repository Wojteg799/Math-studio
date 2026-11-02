export interface DrawPoint {
  x: number;
  y: number;
  pressure: number;
}

export interface Stroke {
  id: string;
  points: DrawPoint[];
  color: string;
  baseWidth: number;
  isEraser?: boolean;
}

export interface StrokeStartPayload {
  id: string;
  firstPoint: DrawPoint;
  color: string;
  baseWidth: number;
  isEraser?: boolean;
}

export interface StrokeChunk {
  id: string;
  points: DrawPoint[];
}

export interface TaskItem {
  id: string;
  number?: string;
  title?: string;
  statementLatex?: string;
  imageUrl?: string | null;
}

export interface StudioBanner {
  id: string;
  message: string;
  subtext?: string;
  type: 'info' | 'gold' | 'success' | 'alert';
}

export interface MathStudioState {
  currentTaskIndex: number;
  tasks: TaskItem[];
  drawingColor: string;
  drawingWidth: number;
  gridType: 'dots' | 'grid' | 'blank';
  activeBanner: StudioBanner | null;
  strokes: Stroke[];
}

export const PEN_COLORS = [
  { name: 'Biały', hex: '#ffffff', key: '1' },
  { name: 'Neon Żółty', hex: '#fbbf24', key: '2' },
  { name: 'Neon Cyan', hex: '#38bdf8', key: '3' },
  { name: 'Szmaragd', hex: '#34d399', key: '4' },
  { name: 'Różowy / Uwaga', hex: '#f43f5e', key: '5' },
];
