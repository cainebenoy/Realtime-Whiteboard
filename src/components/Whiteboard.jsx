import React, { useRef, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import Toolbar from './Toolbar';
import './Whiteboard.css';

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const socketRef = useRef(null);
  const textareaRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState('#000000');
  const [currentTool, setCurrentTool] = useState('brush');
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [isConnected, setIsConnected] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [textInput, setTextInput] = useState({ isActive: false, x: 0, y: 0, text: '' });

  // Draw from remote user data
  const drawFromRemote = useCallback((data) => {
    const context = contextRef.current;
    if (!context) return;

    if (data.type === 'text') {
      // Handle text drawing
      const currentFont = context.font;
      const currentFillStyle = context.fillStyle;
      const currentTextAlign = context.textAlign;
      const currentTextBaseline = context.textBaseline;

      context.font = `${data.size}px 'Roboto', Arial, sans-serif`;
      context.fillStyle = data.color;
      context.textAlign = 'left';
      context.textBaseline = 'top';
      
      // Handle multi-line text
      const lines = data.text.split('\n');
      const lineHeight = data.size * 1.2; // 20% line spacing
      
      lines.forEach((line, index) => {
        if (line.trim()) { // Only draw non-empty lines
          context.fillText(line, data.x, data.y + (index * lineHeight));
        }
      });

      // Restore original text style
      context.font = currentFont;
      context.fillStyle = currentFillStyle;
      context.textAlign = currentTextAlign;
      context.textBaseline = currentTextBaseline;
      return;
    }

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
    // Connect to the appropriate endpoint based on environment
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin // Same domain in production
      : 'http://localhost:3001';
    
    const socketPath = process.env.NODE_ENV === 'production' 
      ? '/api/socket' // Vercel serverless function path
      : '/socket.io'; // Standard Socket.IO path for development
    
    socketRef.current = io(serverUrl, {
      path: socketPath,
      timeout: 5000,
      forceNew: true,
      transports: ['websocket', 'polling'] // Ensure compatibility
    });
    
    socketRef.current.on('connect', () => {
      console.log('Connected to server at:', serverUrl, 'with path:', socketPath);
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
      if (currentTool === 'eraser') {
        contextRef.current.globalCompositeOperation = 'destination-out';
        contextRef.current.lineWidth = brushSize;
      } else {
        contextRef.current.globalCompositeOperation = 'source-over';
        contextRef.current.strokeStyle = brushColor;
        contextRef.current.lineWidth = brushSize;
      }
    }
  }, [brushColor, brushSize, currentTool]);

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
    
    // Handle text tool
    if (currentTool === 'text') {
      setTextInput({ 
        isActive: true, 
        x: e.clientX, // Use screen coordinates for input positioning
        y: e.clientY, 
        canvasX: pos.x, // Store canvas coordinates for text drawing
        canvasY: pos.y,
        text: '' 
      });
      return;
    }
    
    setIsDrawing(true);
    setLastPos(pos);
    
    const context = contextRef.current;
    
    // Set appropriate drawing mode
    if (currentTool === 'eraser') {
      context.globalCompositeOperation = 'destination-out';
      context.lineWidth = brushSize;
    } else {
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = brushColor;
      context.lineWidth = brushSize;
    }
    
    context.beginPath();
    context.moveTo(pos.x, pos.y);
  }, [getMousePos, currentTool, brushSize, brushColor]);

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
        isEraser: currentTool === 'eraser'
      });
    }

    setLastPos(pos);
  }, [isDrawing, lastPos, brushColor, brushSize, currentTool, getMousePos]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      contextRef.current.closePath();
    }
  }, [isDrawing]);

  // Handle text input submission
  const handleTextSubmit = useCallback(() => {
    if (textInput.text.trim() === '') {
      setTextInput({ isActive: false, x: 0, y: 0, canvasX: 0, canvasY: 0, text: '' });
      return;
    }

    const context = contextRef.current;
    if (!context) return;

    // Use stored canvas coordinates
    const canvasX = textInput.canvasX;
    const canvasY = textInput.canvasY;

    // Handle multi-line text
    const lines = textInput.text.split('\n');
    const lineHeight = brushSize * 1.2; // 20% line spacing

    // Draw text locally
    context.font = `${brushSize}px 'Roboto', Arial, sans-serif`;
    context.fillStyle = brushColor;
    context.textAlign = 'left';
    context.textBaseline = 'top';
    
    lines.forEach((line, index) => {
      if (line.trim()) { // Only draw non-empty lines
        context.fillText(line, canvasX, canvasY + (index * lineHeight));
      }
    });

    // Emit to other users
    if (socketRef.current) {
      socketRef.current.emit('drawing', {
        type: 'text',
        text: textInput.text,
        x: canvasX,
        y: canvasY,
        color: brushColor,
        size: brushSize
      });
    }

    // Clear text input
    setTextInput({ isActive: false, x: 0, y: 0, canvasX: 0, canvasY: 0, text: '' });
  }, [textInput, brushColor, brushSize]);

  // Handle text input cancellation
  const handleTextCancel = useCallback(() => {
    setTextInput({ isActive: false, x: 0, y: 0, text: '' });
  }, []);

  // Handle text input change
  const handleTextChange = useCallback((e) => {
    setTextInput(prev => ({ ...prev, text: e.target.value }));
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(textarea.scrollHeight, brushSize * 1.5) + 'px';
  }, [brushSize]);

  // Handle text input key press
  const handleTextKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default form submission
      handleTextSubmit();
    } else if (e.key === 'Enter' && e.shiftKey) {
      // Allow Shift+Enter for new lines - don't prevent default
      return;
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleTextCancel();
    }
  }, [handleTextSubmit, handleTextCancel]);

  // Auto-focus text input when it becomes active
  useEffect(() => {
    if (textInput.isActive && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current.focus();
        // Auto-size the textarea
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = Math.max(textareaRef.current.scrollHeight, brushSize * 1.5) + 'px';
      }, 10);
    }
  }, [textInput.isActive, brushSize]);

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
        currentTool={currentTool}
        setCurrentTool={setCurrentTool}
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
        style={{ 
          cursor: currentTool === 'eraser' 
            ? 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iNSIgeT0iNSIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4K) 10 10, auto' 
            : currentTool === 'text' 
            ? 'text' 
            : 'crosshair' 
        }}
      />
      
      {/* Text Input */}
      {textInput.isActive && (
        <div
          className="text-input-container"
          style={{
            position: 'absolute',
            left: `${textInput.x}px`,
            top: `${textInput.y}px`,
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          <textarea
            ref={textareaRef}
            className="text-input"
            value={textInput.text}
            onChange={handleTextChange}
            onKeyDown={handleTextKeyPress}
            onBlur={handleTextSubmit}
            style={{
              fontSize: `${brushSize}px`,
              color: brushColor,
              border: '2px solid #3b82f6',
              backgroundColor: 'white',
              padding: '4px 8px',
              minWidth: '150px',
              minHeight: `${brushSize * 1.5}px`,
              resize: 'both',
              pointerEvents: 'auto',
              fontFamily: "'Roboto', Arial, sans-serif",
              lineHeight: '1.2',
              overflow: 'hidden'
            }}
            placeholder="Type text... (Shift+Enter for new line, Enter to submit, Esc to cancel)"
            rows={1}
          />
        </div>
      )}
    </div>
  );
};

export default Whiteboard;
