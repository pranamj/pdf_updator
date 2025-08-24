// app/api/extract-pdf/route.js
import { NextRequest, NextResponse } from 'next/server';
import { PDFLayoutExtractor } from '../../lib/pdfUtils';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
 try {
   const formData = await request.formData();
   const file = formData.get('pdf');
   
   if (!file) {
     return NextResponse.json({ error: 'No PDF file uploaded' }, { status: 400 });
   }

   // Validate file type
   if (!file.name?.toLowerCase().endsWith('.pdf')) {
     return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
   }

   // Validate file size (10MB limit)
   if (file.size > 10 * 1024 * 1024) {
     return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
   }

   // Convert file to buffer
   const bytes = await file.arrayBuffer();
   const buffer = Buffer.from(bytes);
   
   const extractor = new PDFLayoutExtractor();
   const extractedData = await extractor.extractTextWithLayout(buffer);

   console.log(extractedData);
   
   // Add extraction metadata
   extractedData.metadata.fileName = file.name;
   extractedData.metadata.fileSize = buffer.length;
   
   return NextResponse.json(extractedData);
 } catch (error) {
   console.error('PDF extraction error:', error);
   return NextResponse.json({ 
     error: 'Failed to extract PDF content',
     details: error.message 
   }, { status: 500 });
 }
}