// app/lib/layoutEngine.js
export class LayoutEngine {
    constructor() {
      this.canvas = null;
      this.ctx = null;
    }
  
    initCanvas() {
      if (typeof window !== 'undefined' && !this.ctx) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
      }
    }
  
    validateTextFit(text, element) {
      this.initCanvas();
      if (!this.ctx) return { fitsWidth: true, fitsHeight: true, confidence: 1.0 };
      
      this.ctx.font = `${element.fontWeight === 'bold' ? 'bold ' : ''}${element.fontSize}px ${element.fontFamily || 'Arial'}`;
      
      if (element.multiline && text.includes('\n')) {
        return this.validateMultilineText(text, element);
      } else {
        return this.validateSingleLineText(text, element);
      }
    }
  
    validateSingleLineText(text, element) {
      const textMetrics = this.ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = element.fontSize;
      const padding = 4;
      
      const availableWidth = element.bbox.width - padding;
      const availableHeight = element.bbox.height;
      
      return {
        fitsWidth: textWidth <= availableWidth,
        fitsHeight: textHeight <= availableHeight,
        actualWidth: textWidth,
        actualHeight: textHeight,
        utilization: textWidth / availableWidth,
        exceedsBy: {
          width: Math.max(0, textWidth - availableWidth),
          height: Math.max(0, textHeight - availableHeight)
        },
        confidence: textWidth <= availableWidth ? 1.0 : 0.0
      };
    }
  
    validateMultilineText(text, element) {
      const lines = text.split('\n');
      const lineHeight = element.fontSize * 1.3;
      const padding = 4;
      const availableWidth = element.bbox.width - padding;
      const availableHeight = element.bbox.height;
      
      let maxWidth = 0;
      let totalHeight = 0;
      
      lines.forEach((line, index) => {
        if (line.trim()) {
          const lineWidth = this.ctx.measureText(line).width;
          maxWidth = Math.max(maxWidth, lineWidth);
          totalHeight += lineHeight;
        } else if (index < lines.length - 1) {
          totalHeight += lineHeight * 0.5; // Half height for empty lines
        }
      });
      
      return {
        fitsWidth: maxWidth <= availableWidth,
        fitsHeight: totalHeight <= availableHeight,
        actualWidth: maxWidth,
        actualHeight: totalHeight,
        lineCount: lines.length,
        utilization: Math.max(maxWidth / availableWidth, totalHeight / availableHeight),
        exceedsBy: {
          width: Math.max(0, maxWidth - availableWidth),
          height: Math.max(0, totalHeight - availableHeight)
        },
        confidence: (maxWidth <= availableWidth && totalHeight <= availableHeight) ? 1.0 : 0.0
      };
    }
  
    truncateToFit(text, element) {
      this.initCanvas();
      if (!this.ctx) return text;
      
      this.ctx.font = `${element.fontWeight === 'bold' ? 'bold ' : ''}${element.fontSize}px ${element.fontFamily || 'Arial'}`;
      
      if (element.multiline && text.includes('\n')) {
        return this.truncateMultilineText(text, element);
      } else {
        return this.truncateSingleLineText(text, element);
      }
    }
  
    truncateSingleLineText(text, element) {
      const maxWidth = element.bbox.width - 4;
      const ellipsis = '...';
      let truncated = text;
      
      // Quick check if truncation is needed
      if (this.ctx.measureText(text).width <= maxWidth) {
        return text;
      }
      
      // Binary search for optimal length
      let left = 0;
      let right = text.length;
      let bestFit = '';
      
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const candidate = text.substring(0, mid);
        const testText = candidate + ellipsis;
        
        if (this.ctx.measureText(testText).width <= maxWidth) {
          bestFit = candidate;
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }
      
      return bestFit.length > 0 ? bestFit + ellipsis : text.substring(0, 1);
    }
  
    truncateMultilineText(text, element) {
      const lines = text.split('\n');
      const lineHeight = element.fontSize * 1.3;
      const maxLines = Math.floor(element.bbox.height / lineHeight);
      const maxWidth = element.bbox.width - 4;
      
      let processedLines = [];
      let currentHeight = 0;
      
      for (let i = 0; i < lines.length && processedLines.length < maxLines; i++) {
        let line = lines[i];
        
        // Check if line fits width
        if (this.ctx.measureText(line).width > maxWidth) {
          line = this.truncateSingleLineText(line, {
            ...element,
            bbox: { ...element.bbox, height: element.fontSize * 1.5 }
          }).replace('...', '');
        }
        
        processedLines.push(line);
        currentHeight += lineHeight;
      }
      
      // If we had to cut lines, indicate truncation
      if (lines.length > maxLines && processedLines.length > 0) {
        const lastIndex = processedLines.length - 1;
        const lastLine = processedLines[lastIndex];
        if (lastLine.length > 3) {
          processedLines[lastIndex] = lastLine.substring(0, lastLine.length - 3) + '...';
        }
      }
      
      return processedLines.join('\n');
    }
  
    preventOverlap(elements) {
      const sortedElements = [...elements].sort((a, b) => {
        const aElement = elements.find(e => e.id === a.id);
        const bElement = elements.find(e => e.id === b.id);
        
        if (!aElement || !bElement) return 0;
        
        return (aElement.pageIndex - bElement.pageIndex) || 
               (aElement.bbox.y - bElement.bbox.y) || 
               (aElement.bbox.x - bElement.bbox.x);
      });
  
      const adjustedElements = [];
      
      for (let i = 0; i < sortedElements.length; i++) {
        const current = { ...sortedElements[i] };
        let hasOverlap = false;
        
        // Check for overlaps with previous elements on same page
        for (let j = 0; j < adjustedElements.length; j++) {
          const previous = adjustedElements[j];
          
          if (this.elementsOverlap(current, previous)) {
            hasOverlap = true;
            const adjustedWidth = Math.max(50, previous.bbox?.x - current.bbox?.x - 10);
            
            if (adjustedWidth > 0 && adjustedWidth < current.bbox?.width) {
              // Truncate text to fit in reduced space
              const originalElement = elements.find(e => e.id === current.id);
              if (originalElement) {
                current.newText = this.truncateToFit(current.newText || current.content, {
                  ...originalElement,
                  bbox: { ...originalElement.bbox, width: adjustedWidth }
                });
                current.truncatedForOverlap = true;
              }
            }
            break;
          }
        }
        
        current.hasOverlap = hasOverlap;
        adjustedElements.push(current);
      }
      
      return adjustedElements;
    }
  
    elementsOverlap(elem1, elem2) {
      if (!elem1.bbox || !elem2.bbox) return false;
      
      return !(
        elem1.bbox.x + elem1.bbox.width < elem2.bbox.x ||
        elem2.bbox.x + elem2.bbox.width < elem1.bbox.x ||
        elem1.bbox.y + elem1.bbox.height < elem2.bbox.y ||
        elem2.bbox.y + elem2.bbox.height < elem1.bbox.y
      );
    }
  }