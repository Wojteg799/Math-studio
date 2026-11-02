import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { MathStudioState, Stroke, TaskItem, StudioBanner } from '../types/math';

interface SocketContextType {
  state: MathStudioState;
  isConnected: boolean;
  sendStroke: (stroke: Stroke) => void;
  clearBoard: () => void;
  undoStroke: () => void;
  nextTask: () => void;
  prevTask: () => void;
  selectTask: (index: number) => void;
  setTaskImage: (imageUrl: string | null, taskIndex?: number) => void;
  setTaskText: (text: string, taskIndex?: number) => void;
  setPenColor: (color: string) => void;
  setPenWidth: (width: number) => void;
  setGridType: (gridType: 'dots' | 'grid' | 'blank') => void;
  triggerBanner: (banner: StudioBanner | null) => void;
  addTask: (task: TaskItem) => void;
  deleteTask: (index: number) => void;
  onStrokeAdded: (callback: (stroke: Stroke) => void) => () => void;
  onBoardCleared: (callback: () => void) => () => void;
  onStrokeUndone: (callback: () => void) => () => void;
}

const defaultState: MathStudioState = {
  currentTaskIndex: 0,
  tasks: [],
  drawingColor: '#ffffff',
  drawingWidth: 3.5,
  gridType: 'dots',
  activeBanner: null,
  strokes: []
};

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<MathStudioState>(defaultState);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const strokeAddedCallbacks = useRef<Set<(stroke: Stroke) => void>>(new Set());
  const boardClearedCallbacks = useRef<Set<() => void>>(new Set());
  const strokeUndoneCallbacks = useRef<Set<() => void>>(new Set());

  useEffect(() => {
    const serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `http://${window.location.hostname}:3001`
      : `${window.location.protocol}//${window.location.hostname}:3001`;

    const socket = io(serverUrl, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('INITIAL_STATE', (serverState: MathStudioState) => {
      setState(serverState);
    });

    socket.on('STATE_UPDATE', (partialState: Partial<MathStudioState>) => {
      setState(prev => ({ ...prev, ...partialState }));
    });

    socket.on('STROKE_ADDED', (stroke: Stroke) => {
      setState(prev => ({
        ...prev,
        strokes: [...prev.strokes, stroke]
      }));
      strokeAddedCallbacks.current.forEach(cb => cb(stroke));
    });

    socket.on('BOARD_CLEARED', () => {
      setState(prev => ({ ...prev, strokes: [] }));
      boardClearedCallbacks.current.forEach(cb => cb());
    });

    socket.on('STROKE_UNDONE', () => {
      setState(prev => ({
        ...prev,
        strokes: prev.strokes.slice(0, -1)
      }));
      strokeUndoneCallbacks.current.forEach(cb => cb());
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendStroke = useCallback((stroke: Stroke) => {
    setState(prev => ({
      ...prev,
      strokes: [...prev.strokes, stroke]
    }));
    socketRef.current?.emit('DRAW_STROKE', stroke);
  }, []);

  const clearBoard = useCallback(() => {
    setState(prev => ({ ...prev, strokes: [] }));
    socketRef.current?.emit('CLEAR_BOARD');
  }, []);

  const undoStroke = useCallback(() => {
    setState(prev => ({ ...prev, strokes: prev.strokes.slice(0, -1) }));
    socketRef.current?.emit('UNDO_STROKE');
  }, []);

  const nextTask = useCallback(() => {
    socketRef.current?.emit('TASK_NEXT');
  }, []);

  const prevTask = useCallback(() => {
    socketRef.current?.emit('TASK_PREV');
  }, []);

  const selectTask = useCallback((index: number) => {
    socketRef.current?.emit('TASK_SELECT', index);
  }, []);

  const setTaskImage = useCallback((imageUrl: string | null, taskIndex?: number) => {
    socketRef.current?.emit('SET_TASK_IMAGE', { taskIndex, imageUrl });
  }, []);

  const setTaskText = useCallback((text: string, taskIndex?: number) => {
    socketRef.current?.emit('SET_TASK_TEXT', { taskIndex, text });
  }, []);

  const setPenColor = useCallback((color: string) => {
    setState(prev => ({ ...prev, drawingColor: color }));
    socketRef.current?.emit('CHANGE_PEN_COLOR', color);
  }, []);

  const setPenWidth = useCallback((width: number) => {
    setState(prev => ({ ...prev, drawingWidth: width }));
    socketRef.current?.emit('CHANGE_PEN_WIDTH', width);
  }, []);

  const setGridType = useCallback((gridType: 'dots' | 'grid' | 'blank') => {
    setState(prev => ({ ...prev, gridType: gridType }));
    socketRef.current?.emit('CHANGE_GRID_TYPE', gridType);
  }, []);

  const triggerBanner = useCallback((banner: StudioBanner | null) => {
    socketRef.current?.emit('TRIGGER_BANNER', banner);
  }, []);

  const addTask = useCallback((task: TaskItem) => {
    socketRef.current?.emit('ADD_TASK', task);
  }, []);

  const deleteTask = useCallback((index: number) => {
    socketRef.current?.emit('DELETE_TASK', index);
  }, []);

  const onStrokeAdded = useCallback((callback: (stroke: Stroke) => void) => {
    strokeAddedCallbacks.current.add(callback);
    return () => {
      strokeAddedCallbacks.current.delete(callback);
    };
  }, []);

  const onBoardCleared = useCallback((callback: () => void) => {
    boardClearedCallbacks.current.add(callback);
    return () => {
      boardClearedCallbacks.current.delete(callback);
    };
  }, []);

  const onStrokeUndone = useCallback((callback: () => void) => {
    strokeUndoneCallbacks.current.add(callback);
    return () => {
      strokeUndoneCallbacks.current.delete(callback);
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        state,
        isConnected,
        sendStroke,
        clearBoard,
        undoStroke,
        nextTask,
        prevTask,
        selectTask,
        setTaskImage,
        setTaskText,
        setPenColor,
        setPenWidth,
        setGridType,
        triggerBanner,
        addTask,
        deleteTask,
        onStrokeAdded,
        onBoardCleared,
        onStrokeUndone
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useMathSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useMathSocket must be used within a SocketProvider');
  }
  return context;
};
