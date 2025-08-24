// app/api/edit-content/route.js
import { NextResponse } from 'next/server';
import { GeminiClient } from '../../lib/geminiClient';
import { LayoutEngine } from '../../lib/layoutEngine';

export async function POST(request) {
  console.log("--- New Edit Request Received ---");
  const processingStartTime = Date.now();
  try {
    const { textElements, editInstruction, apiKey } = await request.json();

    console.log("API Key (hardcoded):", apiKey ? "Present" : "Missing");
    console.log("Edit Instruction:", editInstruction);
    console.log("Text Elements Count:", textElements?.length || 0);

    if (!textElements || !editInstruction || !apiKey) {
      console.error("Validation Error: Missing required fields.");
      return NextResponse.json({ 
        error: 'Missing required fields: textElements, editInstruction, apiKey' 
      }, { status: 400 });
    }

    if (!Array.isArray(textElements) || textElements.length === 0) {
      console.error("Validation Error: textElements must be a non-empty array.");
      return NextResponse.json({ 
        error: 'textElements must be a non-empty array' 
      }, { status: 400 });
    }
    
    const geminiClient = new GeminiClient(apiKey);
    const layoutEngine = new LayoutEngine();
    
    console.log('Processing edit request with Gemini AI...');
    
    // Edit content with LLM
    const editedContent = await geminiClient.editPDFContent(textElements, editInstruction);
    console.log("Gemini AI Response:", JSON.stringify(editedContent, null, 2));
    
    if (editedContent.error) {
      console.error("AI Processing Failed:", editedContent.error);
      return NextResponse.json({ 
        error: 'AI processing failed',
        details: editedContent.error
      }, { status: 500 });
    }
    
    console.log('Validating layout constraints...');
    
    // Validate and adjust for layout constraints
    const validatedElements = editedContent.editedElements.map(element => {
      const original = textElements.find(e => e.id === element.id);
      if (!original) {
        console.warn(`Original element not found for ID: ${element.id}`);
        return element; // Return as is if original not found
      }
      
      const validation = layoutEngine.validateTextFit(element.newText, original);
      
      if (!validation.fitsWidth || !validation.fitsHeight) {
        console.log(`Truncating element ${element.id} due to layout overflow.`);
        const truncated = layoutEngine.truncateToFit(element.newText, original);
        return {
          ...element,
          newText: truncated,
          truncated: true,
          originalLength: element.newText.length,
          truncatedLength: truncated.length,
          validationDetails: validation,
          truncationReason: validation.fitsWidth ? 'height' : 'width'
        };
      }
      
      return {
        ...element,
        truncated: false,
        validationDetails: validation
      };
    });
    
    // Check for overlaps and adjust
    console.log('Checking for element overlaps...');
    const finalElements = layoutEngine.preventOverlap(validatedElements);
    console.log("Final elements count after overlap check:", finalElements.length);
    
    const response = { 
      editedElements: finalElements,
      summary: editedContent.summary,
      preservedElements: editedContent.preservedElements || [],
      metadata: {
        totalElements: finalElements.length,
        editedElements: finalElements.filter(e => e.newText !== textElements.find(orig => orig.id === e.id)?.content).length,
        truncatedElements: finalElements.filter(e => e.truncated).length,
        processedAt: new Date().toISOString(),
        processingTime: Date.now() - processingStartTime
      }
    };
    
    console.log("--- Edit Request Processed Successfully ---");
    return NextResponse.json(response);
  } catch (error) {
    console.error('--- Content Editing Error ---', error);
    return NextResponse.json({ 
      error: 'Failed to edit content',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}