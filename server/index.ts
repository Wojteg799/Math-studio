import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import os from 'os';
import { INITIAL_MATH_TASKS } from './mathTasks.js';
import { MathStudioState, Stroke, TaskItem, StudioBanner, StrokeStartPayload, StrokeChunk } from '../src/types/math.js';

function getLocalIpAddresses(): string[] {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  maxHttpBufferSize: 25 * 1024 * 1024, // 25 MB for high-resolution images
  perMessageDeflate: false, // Ultra-low latency for 60fps stylus drawing
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

// Single Source of Truth
const state: MathStudioState = {
  currentTaskIndex: 0,
  tasks: [...INITIAL_MATH_TASKS],
  drawingColor: '#ffffff',
  drawingWidth: 3.5,
  gridType: 'dots',
  activeBanner: null,
  strokes: []
};

let bannerTimeout: NodeJS.Timeout | null = null;

function broadcastState(partial?: Partial<MathStudioState>) {
  if (partial) {
    Object.assign(state, partial);
    io.emit('STATE_UPDATE', partial);
  } else {
    io.emit('STATE_UPDATE', state);
  }
}

io.on('connection', (socket: Socket) => {
  console.log(`[Socket.io] Klient połączony: ${socket.id}`);
  
  // Send current state to newly connected client
  socket.emit('INITIAL_STATE', state);

  // Real-time live stroke streaming
  socket.on('STROKE_START', (data: StrokeStartPayload) => {
    socket.broadcast.emit('REMOTE_STROKE_START', data);
  });

  socket.on('STROKE_CHUNK', (data: StrokeChunk) => {
    socket.broadcast.emit('REMOTE_STROKE_CHUNK', data);
  });

  socket.on('STROKE_END', (finalStroke: Stroke) => {
    state.strokes.push(finalStroke);
    socket.broadcast.emit('REMOTE_STROKE_END', finalStroke);
  });

  socket.on('DRAW_STROKE', (stroke: Stroke) => {
    state.strokes.push(stroke);
    socket.broadcast.emit('STROKE_ADDED', stroke);
  });

  socket.on('CLEAR_BOARD', () => {
    state.strokes = [];
    io.emit('BOARD_CLEARED');
  });

  socket.on('UNDO_STROKE', () => {
    if (state.strokes.length > 0) {
      state.strokes.pop();
      io.emit('STROKE_UNDONE');
    }
  });

  // Task Navigation
  socket.on('TASK_NEXT', () => {
    if (state.tasks.length === 0) return;
    state.currentTaskIndex = (state.currentTaskIndex + 1) % state.tasks.length;
    broadcastState({
      currentTaskIndex: state.currentTaskIndex
    });
  });

  socket.on('TASK_PREV', () => {
    if (state.tasks.length === 0) return;
    state.currentTaskIndex = (state.currentTaskIndex - 1 + state.tasks.length) % state.tasks.length;
    broadcastState({
      currentTaskIndex: state.currentTaskIndex
    });
  });

  socket.on('TASK_SELECT', (index: number) => {
    if (index >= 0 && index < state.tasks.length) {
      state.currentTaskIndex = index;
      broadcastState({
        currentTaskIndex: state.currentTaskIndex
      });
    }
  });

  // Task Content Updates (Image or Text from Director)
  socket.on('SET_TASK_IMAGE', ({ taskIndex, imageUrl }: { taskIndex?: number; imageUrl: string | null }) => {
    const idx = typeof taskIndex === 'number' ? taskIndex : state.currentTaskIndex;
    if (state.tasks[idx]) {
      state.tasks[idx].imageUrl = imageUrl;
      broadcastState({ tasks: [...state.tasks] });
    }
  });

  socket.on('SET_TASK_TEXT', ({ taskIndex, text }: { taskIndex?: number; text: string }) => {
    const idx = typeof taskIndex === 'number' ? taskIndex : state.currentTaskIndex;
    if (state.tasks[idx]) {
      state.tasks[idx].statementLatex = text;
      broadcastState({ tasks: [...state.tasks] });
    }
  });

  // Pen & Grid Settings
  socket.on('CHANGE_PEN_COLOR', (color: string) => {
    state.drawingColor = color;
    broadcastState({ drawingColor: color });
  });

  socket.on('CHANGE_PEN_WIDTH', (width: number) => {
    state.drawingWidth = width;
    broadcastState({ drawingWidth: width });
  });

  socket.on('CHANGE_GRID_TYPE', (gridType: 'dots' | 'grid' | 'blank') => {
    state.gridType = gridType;
    broadcastState({ gridType: gridType });
  });

  // Banners & Notifications
  socket.on('TRIGGER_BANNER', (banner: StudioBanner | null) => {
    if (bannerTimeout) clearTimeout(bannerTimeout);
    state.activeBanner = banner;
    broadcastState({ activeBanner: banner });

    if (banner) {
      bannerTimeout = setTimeout(() => {
        state.activeBanner = null;
        broadcastState({ activeBanner: null });
      }, 7000);
    }
  });

  // Task Management
  socket.on('ADD_TASK', (newTask: TaskItem) => {
    state.tasks.push(newTask);
    state.currentTaskIndex = state.tasks.length - 1;
    broadcastState({
      tasks: [...state.tasks],
      currentTaskIndex: state.currentTaskIndex
    });
  });

  socket.on('DELETE_TASK', (index: number) => {
    if (state.tasks.length > 1 && index >= 0 && index < state.tasks.length) {
      state.tasks.splice(index, 1);
      if (state.currentTaskIndex >= state.tasks.length) {
        state.currentTaskIndex = state.tasks.length - 1;
      }
      broadcastState({
        tasks: [...state.tasks],
        currentTaskIndex: state.currentTaskIndex
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Klient rozłączony: ${socket.id}`);
  });
});

app.get('/api/network', (_req, res) => {
  res.json({ ips: getLocalIpAddresses(), serverPort: PORT, clientPort: 3000 });
});

app.get('/api/state', (_req, res) => {
  res.json(state);
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIpAddresses();
  const primaryIp = ips[0] || 'localhost';
  console.log(`=======================================================`);
  console.log(`🚀 SERWER MATH STUDIO URUCHOMIONY NA PORCIE ${PORT}`);
  console.log(`📡 WebSocket Socket.io gotowy do komunikacji`);
  console.log(`💻 Na tym komputerze:  http://localhost:3000/`);
  console.log(`📱 Na telefonie/tablecie w Wi-Fi:`);
  console.log(`   👉 Panel Reżysera:  http://${primaryIp}:3000/director`);
  console.log(`   👉 Arkusz Rysika:   http://${primaryIp}:3000/presenter`);
  console.log(`   👉 Nakładka OBS:    http://${primaryIp}:3000/overlay`);
  console.log(`=======================================================`);
});
