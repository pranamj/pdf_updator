// app/components/PDFViewer.jsx
'use client';

import { useEffect, useRef, useState } from 'react';

export default function PDFViewer({ pdfData, editedElements, onElementSelect }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [selectedElement, setSelectedElement] = useState(null);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);

  useEffect(() => {
    if (pdfData && canvasRef.current) {
      renderPDF();
    }
  }, [pdfData, editedElements, scale, showBoundingBoxes]);

  const renderPDF = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!pdfData.pages.length) return;
    
    const page = pdfData.pages[0];
    canvas.width = page.width * scale;
    canvas.height = page.height * scale;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw white background with subtle shadow
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw page border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(20 * scale, 20 * scale, 
                  (page.width - 40) * scale, (page.height - 40) * scale);

    // Render text elements
    pdfData.textElements.forEach((element, index) => {
      const editedElement = editedElements.find(e => e.id === element.id);
      const text = editedElement ? editedElement.newText : element.content;
      const isSelected = selectedElement?.id === element.id;
      
      const x = element.bbox.x * scale;
      const y = element.bbox.y * scale;
      const width = element.bbox.width * scale;
      const height = element.bbox.height * scale;
      
      // Draw bounding box (if enabled)
      if (showBoundingBoxes) {
        let strokeColor = '#d1d5db';
        let fillColor = 'rgba(255, 255, 255, 0.8)';
        
        if (isSelected) {
          strokeColor = '#3b82f6';
          fillColor = 'rgba(59, 130, 246, 0.1)';
        } else if (editedElement) {
          if (editedElement.truncated) {
            strokeColor = '#ef4444';
            fillColor = 'rgba(239, 68, 68, 0.05)';
          } else {
            strokeColor = '#10b981';
            fillColor = 'rgba(16, 185, 129, 0.05)';
          }
        }
        
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(x, y, width, height);
        
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, width, height);
      }
      
      // Set text style
      const fontStyle = element.fontWeight === 'bold' ? 'bold ' : '';
      ctx.font = `${fontStyle}${element.fontSize * scale}px ${element.fontFamily || 'Arial'}`;
      ctx.fillStyle = editedElement ? '#1f2937' : '#374151';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      // Draw text (handle multiline)
      if (element.multiline && text.includes('\n')) {
        const lines = text.split('\n');
        lines.forEach((line, lineIndex) => {
          if (line.trim()) {
            ctx.fillText(
              line, 
              x + 2 * scale, 
              y + 2 * scale + (lineIndex * element.fontSize * 1.3 * scale)
            );
          }
        });
      } else {
        ctx.fillText(text, x + 2 * scale, y + 2 * scale);
      }
      
      // Draw element type label (if bounding boxes are shown)
      if (showBoundingBoxes) {
        ctx.font = `${Math.max(8, 10 * scale)}px Arial`;
        ctx.fillStyle = '#6b7280';
        ctx.fillText(element.type.toUpperCase(), x, Math.max(12 * scale, y - 5 * scale));
      }
      
      // Draw status indicators
      if (editedElement) {
        const indicatorY = y - 15 * scale;
        
        if (editedElement.truncated) {
          ctx.fillStyle = '#ef4444';
          ctx.font = `bold ${Math.max(8, 8 * scale)}px Arial`;
          ctx.fillText('TRUNCATED', x + width - 60 * scale, indicatorY);
        } else {
          ctx.fillStyle = '#10b981';
          ctx.font = `bold ${Math.max(8, 8 * scale)}px Arial`;
          ctx.fillText('EDITED', x + width - 45 * scale, indicatorY);
        }
      }
    });
  };

  const handleCanvasClick = (event) => {
    if (!pdfData) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;
    
    // Find clicked element
    const clickedElement = pdfData.textElements.find(element => 
      x >= element.bbox.x && x <= element.bbox.x + element.bbox.width &&
      y >= element.bbox.y && y <= element.bbox.y + element.bbox.height
    );
    
    setSelectedElement(clickedElement || null);
    onElementSelect?.(clickedElement || null);
  };

  const handleZoom = (direction) => {
    setScale(prev => {
      const newScale = direction === 'in' ? prev * 1.25 : prev / 1.25;
      return Math.max(0.25, Math.min(4, newScale));
    });
  };

  const resetZoom = () => {
    setScale(1);
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">PDF Preview</h3>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showBoundingBoxes}
              onChange={(e) => setShowBoundingBoxes(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-gray-600">Show bounds</span>
          </label>
          
          <div className="flex items-center space-x-1 border-l pl-3">
            <button
              onClick={() => handleZoom('out')}
              disabled={scale <= 0.25}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded text-sm font-medium"
            >
              −
            </button>
            <button
              onClick={resetZoom}
              className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 min-w-16"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={() => handleZoom('in')}
              disabled={scale >= 4}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded text-sm font-medium"
            >
              +
            </button>
          </div>
        </div>
      </div>
      
      {/* Canvas Container */}
      <div ref={containerRef} className="overflow-auto h-96 p-4 bg-gray-100">
        {pdfData ? (
          <div className="flex justify-center">
            <div className="bg-white shadow-lg" style={{ display: 'inline-block' }}>
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="cursor-pointer"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-lg">Upload a PDF to get started</p>
              <p className="text-sm mt-2">Your document will appear here with interactive elements</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Selected Element Info */}
      {selectedElement && (
        <div className="border-t bg-blue-50 p-3">
          <div className="text-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-blue-800">
                Selected: {selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)}
              </span>
              <button
                onClick={() => {
                  setSelectedElement(null);
                  onElementSelect?.(null);
                }}
                className="text-blue-600 hover:text-blue-800 text-xs"
              >
                ✕ Clear
              </button>
            </div>
            <div className="text-blue-600">
              Size: {selectedElement.bbox.width}×{selectedElement.bbox.height}px
              {selectedElement.maxChars && ` | Max ~${selectedElement.maxChars} chars`}
            </div>
            <div className="text-blue-500 text-xs max-w-full">
              <span className="font-medium">Content:</span>{' '}
              <span className="italic">
                "{selectedElement.content.length > 100 
                  ? selectedElement.content.substring(0, 100) + '...' 
                  : selectedElement.content}"
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {pdfData && (
        <div className="border-t bg-gray-50 px-4 py-2 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>
              {pdfData.textElements.length} text elements | 
              {editedElements.length} edited |
              {editedElements.filter(e => e.truncated).length} truncated
            </span>
            <span>
              Page 1 of {pdfData.pages.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}