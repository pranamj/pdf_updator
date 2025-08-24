// app/lib/geminiClient.js
export class GeminiClient {
    constructor(apiKey) {
      this.apiKey = apiKey;
      this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    }
  
    async editPDFContent(textElements, editInstruction) {
      const prompt = this.createLayoutAwarePrompt(textElements, editInstruction);
      
      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': this.apiKey
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 4096,
            }
          })
        });
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }
  
        const data = await response.json();
        return this.parseResponse(data);
      } catch (error) {
        console.error('Gemini API error:', error);
        throw error;
      }
    }
  
    createLayoutAwarePrompt(textElements, instruction) {
      const elementsWithConstraints = textElements.map(element => {
        const constraints = this.calculateConstraints(element);
        return {
          id: element.id,
          originalText: element.content,
          type: element.type,
          maxChars: element.maxChars || constraints.maxChars,
          bbox: `${Math.round(element.bbox.width)}x${Math.round(element.bbox.height)}px`,
          fontSize: element.fontSize,
          multiline: element.multiline || false,
          priority: element.priority || 'normal'
        };
      });
  
      return `You are a professional PDF content editor with strict layout preservation requirements.
  
  CRITICAL LAYOUT RULES:
  1. NEVER exceed character limits - text MUST fit in original space
  2. Maintain document professionalism and accuracy
  3. Preserve numerical values, dates, and important data when possible
  4. Use appropriate abbreviations if content is too long
  5. Keep the same document structure and hierarchy
  6. Return ONLY valid JSON without any markdown formatting
  
  EDITING INSTRUCTION: ${instruction}
  
  DOCUMENT ELEMENTS WITH CONSTRAINTS:
  ${JSON.stringify(elementsWithConstraints, null, 2)}
  
  You must return ONLY this JSON structure:
  {
    "editedElements": [
      {
        "id": "element_id",
        "newText": "edited text within character limits",
        "changesMade": "brief description of changes made",
        "fitsConstraints": true,
        "confidence": 0.95
      }
    ],
    "summary": "Brief summary of all changes made to the document",
    "preservedElements": ["list", "of", "unchanged", "element", "ids"]
  }
  
  RESPOND WITH JSON ONLY - NO MARKDOWN, NO EXPLANATIONS:`;
    }
  
    calculateConstraints(element) {
      const avgCharWidth = element.fontSize * 0.6;
      const lineHeight = element.fontSize * 1.4;
      
      const maxCharsPerLine = Math.floor(element.bbox.width / avgCharWidth);
      const maxLines = element.multiline ? Math.floor(element.bbox.height / lineHeight) : 1;
      
      return {
        maxChars: maxCharsPerLine * maxLines,
        maxCharsPerLine,
        maxLines
      };
    }
  
    parseResponse(geminiResponse) {
      try {
        let text = geminiResponse.candidates[0].content.parts[0].text;
        
        // Clean up response
        text = text.replace(/```json\n?|\n?```/g, '').trim();
        text = text.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          text = jsonMatch[0];
        }
        
        const parsed = JSON.parse(text);
        
        if (!parsed.editedElements || !Array.isArray(parsed.editedElements)) {
          throw new Error('Invalid response structure - missing editedElements array');
        }
        
        return parsed;
      } catch (error) {
        console.error('Error parsing Gemini response:', error);
        console.log('Raw response text:', geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text);
        return { 
          editedElements: [],
          summary: "Failed to parse AI response - please try again",
          error: error.message,
          preservedElements: []
        };
      }
    }
  }