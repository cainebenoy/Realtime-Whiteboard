import React, { useState } from 'react';
import './Toolbar.css';

const Toolbar = ({ 
  brushSize, 
  setBrushSize, 
  brushColor, 
  setBrushColor, 
  isEraser,
  setIsEraser,
  onClear, 
  onUndo 
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#A52A2A', '#FFC0CB',
    '#808080', '#C0C0C0', '#8B4513', '#228B22', '#4169E1', '#FF1493'
  ];

  const brushSizes = [2, 5, 10, 15, 25, 35, 50];

  return (
    <div className="toolbar">
      <div className="toolbar-brand">
        <h1 className="app-title">✏️ Realtime Whiteboard</h1>
        <div className="connection-status">
          <div className="status-indicator online"></div>
          <span>Connected</span>
        </div>
      </div>
      
      <div className="toolbar-controls">
        <div className="toolbar-section">
          <label className="section-label">Drawing Tools</label>
          <div className="tool-group">
            <button 
              className={`tool-btn ${!isEraser ? 'active' : ''}`}
              onClick={() => setIsEraser(false)}
              title="Brush Tool"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34c-.39-.39-1.02-.39-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.02 0-1.41z"/>
              </svg>
              Brush
            </button>
            <button 
              className={`tool-btn ${isEraser ? 'active' : ''}`}
              onClick={() => setIsEraser(true)}
              title="Eraser Tool"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0M4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l3.53-3.53-6.36-6.36-3.54 3.53z"/>
              </svg>
              Eraser
            </button>
          </div>
        </div>

        <div className="toolbar-section">
          <label className="section-label">Size: {brushSize}px</label>
          <div className="size-controls">
            <div className="size-presets">
              {brushSizes.map((size) => (
                <button
                  key={size}
                  className={`size-btn ${brushSize === size ? 'active' : ''}`}
                  onClick={() => setBrushSize(size)}
                  title={`${size}px`}
                >
                  <div 
                    className="size-preview" 
                    style={{ 
                      width: `${Math.min(size / 2 + 4, 16)}px`, 
                      height: `${Math.min(size / 2 + 4, 16)}px`,
                      backgroundColor: isEraser ? '#ff6b6b' : brushColor
                    }}
                  ></div>
                </button>
              ))}
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="size-slider"
            />
          </div>
        </div>
        
        <div className="toolbar-section">
          <label className="section-label">Colors</label>
          <div className="color-section">
            <div className="current-color" onClick={() => setShowColorPicker(!showColorPicker)}>
              <div 
                className="color-preview" 
                style={{ backgroundColor: brushColor }}
                title="Current Color"
              ></div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5H7z"/>
              </svg>
            </div>
            
            {showColorPicker && (
              <div className="color-picker-dropdown">
                <div className="color-grid">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={`color-option ${brushColor === color && !isEraser ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setBrushColor(color);
                        setIsEraser(false);
                        setShowColorPicker(false);
                      }}
                      title={color}
                      disabled={isEraser}
                    />
                  ))}
                </div>
                <div className="custom-color">
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => {
                      setBrushColor(e.target.value);
                      setIsEraser(false);
                    }}
                    className="color-input"
                    disabled={isEraser}
                  />
                  <label>Custom</label>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="toolbar-section">
          <label className="section-label">Actions</label>
          <div className="action-group">
            <button 
              className="action-btn undo-btn" 
              onClick={onUndo}
              title="Undo (Ctrl+Z)"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7z"/>
              </svg>
              Undo
            </button>
            <button 
              className="action-btn clear-btn" 
              onClick={onClear}
              title="Clear Canvas"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
