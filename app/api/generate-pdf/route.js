// app/api/generate-pdf/route.js
import { NextResponse } from 'next/server';
import { PDFLayoutExtractor } from '../../lib/pdfUtils';

export async function POST(request) {
  try {
    const { originalData, editedElements } = await request.json();
    
    if (!originalData || !editedElements) {
      return NextResponse.json({ 
        error: 'Missing required data: originalData and editedElements' 
      }, { status: 400 });
    }

    if (!originalData.pages || !Array.isArray(originalData.pages)) {
      return NextResponse.json({ 
        error: 'Invalid originalData structure - missing pages array' 
      }, { status: 400 });
    }
    
    console.log('Generating PDF with edited content...');
    
    const extractor = new PDFLayoutExtractor();
    const pdfBytes = await extractor.regeneratePDF(originalData, editedElements);
    
    const response = new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="edited-document.pdf"',
        'Content-Length': pdfBytes.length.toString(),
      },
    });
    
    return response;
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate PDF',
      details: error.message 
    }, { status: 500 });
  }
}