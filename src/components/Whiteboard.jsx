import React, { useRef, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import Toolbar from './Toolbar';
import './Whiteboard.css';

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const socketRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState('#000000');
  const [isEraser, setIsEraser] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [isConnected, setIsConnected] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Draw from remote user data
  const drawFromRemote = useCallback((data) => {
    const context = contextRef.current;
    if (!context) return;

    // Save current drawing style
    const currentColor = context.strokeStyle;
    const currentSize = context.lineWidth;
    const currentCompositeOperation = context.globalCompositeOperation;

    // Apply remote user's drawing style
    if (data.isEraser) {
      context.globalCompositeOperation = 'destination-out';
      context.lineWidth = data.size;
    } else {
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = data.color;
      context.lineWidth = data.size;
    }
    
    context.lineCap = 'round';
    context.lineJoin = 'round';

    // Draw the line segment
    context.beginPath();
    context.moveTo(data.lastX, data.lastY);
    context.lineTo(data.currentX, data.currentY);
    context.stroke();

    // Restore original drawing style
    context.strokeStyle = currentColor;
    context.lineWidth = currentSize;
    context.globalCompositeOperation = currentCompositeOperation;
  }, []);

  // Socket.IO connection and event listeners
  useEffect(() => {
    // Try to connect to local server for development, fallback to demo mode
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-deployed-server.herokuapp.com' // You can deploy the server later
      : 'http://localhost:3001';
    
    socketRef.current = io(serverUrl, {
      timeout: 5000,
      forceNew: true
    });
    
    socketRef.current.on('connect', () => {
      console.log('Connected to server at:', serverUrl);
      setIsConnected(true);
      setIsDemoMode(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.warn('Connection error - running in demo mode:', error.message);
      setIsConnected(false);
      setIsDemoMode(true);
      // In demo mode, we'll just allow local drawing without real-time sync
    });

    // Listen for drawing events from other users
    socketRef.current.on('drawing', (data) => {
      try {
        drawFromRemote(data);
      } catch (error) {
        console.error('Error drawing remote data:', error);
      }
    });

    // Listen for drawing history when first connecting
    socketRef.current.on('drawing-history', (history) => {
      console.log(`Received drawing history with ${history.length} events`);
      try {
        history.forEach((drawingData) => {
          drawFromRemote(drawingData);
        });
      } catch (error) {
        console.error('Error replaying drawing history:', error);
      }
    });

    // Listen for complete redraw (for undo functionality)
    socketRef.current.on('complete-redraw', (history) => {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      if (canvas && context) {
        try {
          context.clearRect(0, 0, canvas.width, canvas.height);
          history.forEach((drawingData) => {
            drawFromRemote(drawingData);
          });
        } catch (error) {
          console.error('Error during complete redraw:', error);
        }
      }
    });

    // Listen for clear canvas events
    socketRef.current.on('clear-canvas', () => {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      if (canvas && context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [drawFromRemote]);

  // Canvas initialization (only on mount and window resize)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to match the actual display size
    const resizeCanvas = () => {
      // Store current canvas content before resize
      const tempCanvas = document.createElement('canvas');
      const tempContext = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempContext.drawImage(canvas, 0, 0);

      // Resize main canvas
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      const context = canvas.getContext('2d');
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = brushColor;
      context.lineWidth = brushSize;
      contextRef.current = context;

      // Restore canvas content after resize
      context.drawImage(tempCanvas, 0, 0);
    };

    // Only initialize once on mount
    if (!contextRef.current) {
      resizeCanvas();
    }

    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []); // Remove dependencies to prevent clearing on state changes

  // Update brush settings
  useEffect(() => {
    if (contextRef.current) {
      if (isEraser) {
        contextRef.current.globalCompositeOperation = 'destination-out';
        contextRef.current.lineWidth = brushSize;
      } else {
        contextRef.current.globalCompositeOperation = 'source-over';
        contextRef.current.strokeStyle = brushColor;
        contextRef.current.lineWidth = brushSize;
      }
    }
  }, [brushColor, brushSize, isEraser]);

  // Get mouse position
  const getMousePos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }, []);

  // Start drawing
  const startDrawing = useCallback((e) => {
    const pos = getMousePos(e);
    setIsDrawing(true);
    setLastPos(pos);
    
    const context = contextRef.current;
    
    // Set appropriate drawing mode
    if (isEraser) {
      context.globalCompositeOperation = 'destination-out';
      context.lineWidth = brushSize;
    } else {
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = brushColor;
      context.lineWidth = brushSize;
    }
    
    context.beginPath();
    context.moveTo(pos.x, pos.y);
  }, [getMousePos, isEraser, brushSize, brushColor]);

  // Draw
  const draw = useCallback((e) => {
    if (!isDrawing) return;

    const pos = getMousePos(e);
    const context = contextRef.current;

    // Draw locally for smooth experience
    context.lineTo(pos.x, pos.y);
    context.stroke();

    // Emit to other users
    if (socketRef.current) {
      socketRef.current.emit('drawing', {
        lastX: lastPos.x,
        lastY: lastPos.y,
        currentX: pos.x,
        currentY: pos.y,
        color: brushColor,
        size: brushSize,
        isEraser: isEraser
      });
    }

    setLastPos(pos);
  }, [isDrawing, lastPos, brushColor, brushSize, isEraser, getMousePos]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      contextRef.current.closePath();
    }
  }, [isDrawing]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (socketRef.current) {
        socketRef.current.emit('clear-canvas');
      }
    }
  }, []);

  // Undo last stroke
  const handleUndo = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('undo');
    }
  }, []);

  return (
    <div className="whiteboard-container">
      {isDemoMode && (
        <div className="demo-banner">
          <div className="demo-content">
            <span className="demo-icon">ℹ️</span>
            <span className="demo-text">
              <strong>Demo Mode:</strong> Real-time collaboration requires running the backend server locally. 
              <a href="https://github.com/cainebenoy/Realtime-Whiteboard#installation" target="_blank" rel="noopener noreferrer"> 
                See installation guide
              </a>
            </span>
          </div>
        </div>
      )}
      <Toolbar 
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        brushColor={brushColor}
        setBrushColor={setBrushColor}
        isEraser={isEraser}
        setIsEraser={setIsEraser}
        onClear={clearCanvas}
        onUndo={handleUndo}
        isConnected={isConnected}
        isDemoMode={isDemoMode}
      />
      <canvas
        ref={canvasRef}
        className="whiteboard-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{ cursor: isEraser ? 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iNSIgeT0iNSIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4K) 10 10, auto' : 'crosshair' }}
      />
    </div>
  );
};

export default Whiteboard;
