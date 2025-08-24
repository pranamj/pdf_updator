// app/lib/pdfUtils.js
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

// Disable the PDF worker to prevent errors in the Node.js environment
pdfjs.GlobalWorkerOptions.workerSrc = `pdfjs-dist/build/pdf.worker.min.js`;

export class PDFLayoutExtractor {
  constructor() {}

  async extractTextWithLayout(pdfBuffer) {
    const loadingTask = pdfjs.getDocument({ data: pdfBuffer });
    const pdf = await loadingTask.promise;

    const extractedData = {
      pages: [],
      textElements: [],
      metadata: {
        pageCount: pdf.numPages,
        extractedAt: new Date().toISOString(),
        fileSize: pdfBuffer.length,
      },
    };

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.0 });
      const textContent = await page.getTextContent();

      const pageData = {
        pageIndex: i - 1,
        width: viewport.width,
        height: viewport.height,
        textElements: [],
      };

      const elements = this.processTextContent(textContent, pageData, i - 1);
      pageData.textElements = elements;
      extractedData.pages.push(pageData);
      extractedData.textElements.push(...elements);
    }

    return extractedData;
  }

  processTextContent(textContent, pageData, pageIndex) {
    const elements = [];
    let currentElement = null;

    for (const item of textContent.items) {
      if (item.str.trim().length === 0) continue;

      const x = item.transform[4];
      const y = pageData.height - item.transform[5] - item.height;
      const width = item.width;
      const height = item.height;
      const fontSize = Math.hypot(item.transform[0], item.transform[1]);

      // Simple logic to group text blocks: check if the new item is close to the previous one
      if (currentElement && Math.abs(y - (currentElement.bbox.y)) < 5 && Math.abs(x - (currentElement.bbox.x + currentElement.bbox.width)) < 10) {
        currentElement.content += item.str;
        currentElement.bbox.width += width;
      } else {
        if (currentElement) {
          elements.push(currentElement);
        }
        currentElement = {
          id: `${pageIndex}_${elements.length}`,
          content: item.str,
          bbox: { x, y, width, height },
          fontSize: Math.round(fontSize * 10) / 10,
          fontFamily: item.fontName,
          pageIndex,
          type: 'text',
        };
      }
    }
    if (currentElement) {
      elements.push(currentElement);
    }

    return elements.map(this.finalizeElement.bind(this));
  }

  finalizeElement(element) {
    const constraints = this.calculateTextConstraints(element);
    return {
      ...element,
      ...constraints,
      multiline: element.bbox.height > element.fontSize * 1.5,
    };
  }

  calculateTextConstraints(element) {
    const avgCharWidth = this.getAverageCharWidth(element.fontSize, element.fontFamily);
    const lineHeight = element.fontSize * 1.2;
    
    const maxCharsPerLine = Math.floor(element.bbox.width / avgCharWidth) || 1;
    const maxLines = Math.floor(element.bbox.height / lineHeight) || 1;
    
    return {
      maxCharsPerLine,
      maxLines,
      maxTotalChars: maxCharsPerLine * maxLines,
    };
  }

  getAverageCharWidth(fontSize, fontFamily) {
    // This is a simplified heuristic. For more accuracy, font metrics would be needed.
    const fontWidths = {
      'Times': 0.5,
      'Helvetica': 0.55,
      'Arial': 0.55,
      'Courier': 0.6,
    };
    const family = Object.keys(fontWidths).find(f => fontFamily.includes(f)) || 'Helvetica';
    return fontSize * (fontWidths[family] || 0.55);
  }

  async regeneratePDF(originalData, editedElements) {
    const pdfDoc = await PDFDocument.create();
    const fontCache = {};

    const getFont = async (fontName) => {
      if (fontCache[fontName]) return fontCache[fontName];
      
      let standardFont = StandardFonts.Helvetica;
      if (fontName.includes('Bold')) standardFont = StandardFonts.HelveticaBold;
      if (fontName.includes('Italic')) standardFont = StandardFonts.HelveticaOblique;
      if (fontName.includes('Times')) standardFont = StandardFonts.TimesRoman;
      
      fontCache[fontName] = await pdfDoc.embedFont(standardFont);
      return fontCache[fontName];
    };

    for (const pageData of originalData.pages) {
      const page = pdfDoc.addPage([pageData.width, pageData.height]);
      
      page.drawRectangle({
        x: 0, y: 0, width: pageData.width, height: pageData.height, color: rgb(1, 1, 1)
      });

      const allElements = originalData.textElements.filter(e => e.pageIndex === pageData.pageIndex);

      for (const element of allElements) {
        const edited = editedElements.find(e => e.id === element.id);
        const text = edited ? edited.newText : element.content;
        const font = await getFont(element.fontFamily);

        page.drawText(text, {
          x: element.bbox.x,
          y: pageData.height - element.bbox.y - element.fontSize,
          size: element.fontSize,
          font: font,
          color: rgb(0, 0, 0),
          lineHeight: element.fontSize * 1.2,
          maxWidth: element.bbox.width,
        });
      }
    }
    
    return await pdfDoc.save();
  }
}