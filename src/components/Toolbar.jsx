import React, { useState, useEffect, useRef } from 'react';
import './Toolbar.css';

const Toolbar = ({ 
  brushSize, 
  setBrushSize, 
  brushColor, 
  setBrushColor, 
  currentTool,
  setCurrentTool,
  onClear, 
  onUndo,
  isConnected = false,
  isDemoMode = false
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef(null);
  
  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);
  
  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#A52A2A', '#FFC0CB',
    '#808080', '#C0C0C0', '#8B4513', '#228B22', '#4169E1', '#FF1493'
  ];

  const brushSizes = [2, 5, 10, 15, 25, 35, 50];

  return (
    <header className="modern-toolbar">
      <div className="toolbar-left">
        <div className="brand-section">
          <span className="material-icons brand-icon">edit</span>
          <h1 className="brand-title">Realtime Whiteboard</h1>
        </div>
        <div className="connection-status">
          <div className={`status-indicator ${isConnected ? 'online' : isDemoMode ? 'demo' : 'offline'}`}></div>
          <span className="status-text">{isConnected ? 'Connected' : isDemoMode ? 'Demo Mode' : 'Connecting...'}</span>
        </div>
      </div>

      <div className="toolbar-center">
        <div className="toolbar-panel">
          {/* Drawing Tools */}
          <div className="tool-section">
            <span className="section-label">DRAWING TOOLS</span>
            <div className="tool-buttons">
              <button 
                className={`tool-btn ${currentTool === 'brush' ? 'active' : ''}`}
                onClick={() => setCurrentTool('brush')}
                title="Brush Tool"
              >
                <span className="material-icons">brush</span>
                <span>Brush</span>
              </button>
              <button 
                className={`tool-btn ${currentTool === 'eraser' ? 'active' : ''}`}
                onClick={() => setCurrentTool('eraser')}
                title="Eraser Tool"
              >
                <span className="material-icons">architecture</span>
                <span>Eraser</span>
              </button>
              <button 
                className={`tool-btn ${currentTool === 'text' ? 'active' : ''}`}
                onClick={() => setCurrentTool('text')}
                title="Text Tool"
              >
                <span className="material-icons">title</span>
                <span>Text</span>
              </button>
            </div>
          </div>

          {/* Size Controls */}
          <div className="size-section">
            <span className="section-label">SIZE: {brushSize}PX</span>
            <div className="size-controls">
              <div className="size-presets">
                {brushSizes.slice(0, 5).map((size) => (
                  <button
                    key={size}
                    className={`size-preset ${brushSize === size ? 'active' : ''}`}
                    onClick={() => setBrushSize(size)}
                    title={`${size}px`}
                    style={{
                      width: `${Math.min(size / 2 + 12, 32)}px`,
                      height: `${Math.min(size / 2 + 12, 32)}px`,
                      backgroundColor: brushSize === size ? '#3b82f6' : '#6b7280'
                    }}
                  />
                ))}
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="size-slider"
              />
            </div>
          </div>

          {/* Colors */}
          <div className="color-section" ref={colorPickerRef}>
            <span className="section-label">COLORS</span>
            <div className="color-controls">
              <div 
                className="current-color" 
                onClick={() => setShowColorPicker(!showColorPicker)}
                style={{ backgroundColor: brushColor }}
                title="Current Color"
              />
              <div 
                className="color-preview" 
                style={{ backgroundColor: '#3b82f6', borderColor: '#60a5fa' }}
                onClick={() => {
                  setBrushColor('#3b82f6');
                  if (currentTool === 'eraser') setCurrentTool('brush');
                }}
              />
            </div>
            
            {showColorPicker && (
              <div className="color-picker-dropdown">
                <div className="color-grid">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={`color-option ${brushColor === color && currentTool !== 'eraser' ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setBrushColor(color);
                        if (currentTool === 'eraser') setCurrentTool('brush');
                        setShowColorPicker(false);
                      }}
                      title={color}
                      disabled={currentTool === 'eraser'}
                    />
                  ))}
                </div>
                <div className="custom-color">
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => {
                      setBrushColor(e.target.value);
                      if (currentTool === 'eraser') setCurrentTool('brush');
                    }}
                    className="color-input"
                    disabled={currentTool === 'eraser'}
                  />
                  <label>Custom Color</label>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="action-section">
            <span className="section-label">ACTIONS</span>
            <div className="action-buttons">
              <button 
                className="action-btn undo-btn" 
                onClick={onUndo}
                title="Undo (Ctrl+Z)"
              >
                <span className="material-icons">undo</span>
                <span>Undo</span>
              </button>
              <button 
                className="action-btn clear-btn" 
                onClick={onClear}
                title="Clear Canvas"
              >
                <span className="material-icons">delete_forever</span>
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="toolbar-right">
        {/* Spacer for balance */}
      </div>
    </header>
  );
};

export default Toolbar;
