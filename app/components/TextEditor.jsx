// app/components/TextEditor.jsx
'use client';

import { useState } from 'react';

export default function TextEditor({ onEdit, disabled, editStatus, selectedElement }) {
  const [instruction, setInstruction] = useState('');
  const [activeTab, setActiveTab] = useState('edit');

  const suggestions = [
    {
      category: 'Professional Tone',
      items: [
        'Make the language more professional and formal',
        'Use more casual and friendly language',
        'Add more technical terminology',
        'Simplify for general audience'
      ]
    },
    {
      category: 'Content Enhancement',
      items: [
        'Make the text more concise and to the point',
        'Add more detailed explanations',
        'Improve readability and flow',
        'Update with current information'
      ]
    },
    {
      category: 'Business Documents',
      items: [
        'Update payment terms to Net 15 days',
        'Change company information and branding',
        'Add late payment penalties clause',
        'Update tax rates and calculations',
        'Modernize legal language',
        'Add contact information and support details'
      ]
    }
  ];

  const presets = [
    {
      name: 'Professional Invoice',
      description: 'Modernize invoice with professional language and clear terms',
      instruction: 'Make this invoice more professional, update payment terms to be clearer, and ensure all business information is formal and complete'
    },
    {
      name: 'Friendly Communication',
      description: 'Make the document more approachable and customer-friendly',
      instruction: 'Rewrite this document to be more friendly and approachable while maintaining professionalism'
    },
    {
      name: 'Legal Compliance',
      description: 'Update legal language and ensure compliance',
      instruction: 'Update legal language to be current and compliant, ensure all terms are clear and enforceable'
    },
    {
      name: 'Marketing Focus',
      description: 'Add marketing elements and promotional language',
      instruction: 'Add marketing elements, make the language more engaging and promotional while maintaining accuracy'
    },
    {
      name: 'Technical Documentation',
      description: 'Convert to clear technical documentation style',
      instruction: 'Convert this to clear, precise technical documentation with proper terminology and structure'
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (instruction.trim()) {
      onEdit(instruction.trim());
    }
  };

  const handleSuggestionClick = (suggestionText) => {
    setInstruction(suggestionText);
  };

  const handlePresetClick = (preset) => {
    setInstruction(preset.instruction);
  };

  const isFormDisabled = disabled || editStatus === 'loading';

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Tab Navigation */}
      <div className="border-b bg-gray-50">
        <nav className="flex space-x-6 px-4">
          {['edit', 'suggestions', 'presets'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4">
        {activeTab === 'edit' && (
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Editing Instructions
                </label>
                <textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="Describe what you want to change... For example: 'Make the invoice more professional, update company address to 456 New Street, and change payment terms to Net 30 days with 2% late fee'"
                  className="w-full p-3 border border-gray-300 rounded-lg h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={isFormDisabled}
                />
                <div className="text-xs text-gray-500 mt-2">
                  Be specific about your requirements. The AI will preserve layout while making your requested changes.
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isFormDisabled || !instruction.trim()}
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors flex items-center justify-center"
              >
                {editStatus === 'loading' ? (
                  <>
                    <div className="loading-spinner mr-3"></div>
                    Processing with AI...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🤖</span>
                    Edit PDF Content
                  </>
                )}
              </button>
            </form>

            {/* Selected Element Info */}
            {selectedElement && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">
                  🎯 Selected Element: {selectedElement.type}
                </h4>
                <div className="text-sm text-blue-600 space-y-1">
                  <p><strong>Constraints:</strong> Max ~{selectedElement.maxChars || 'auto'} characters</p>
                  <p><strong>Size:</strong> {selectedElement.bbox.width}×{selectedElement.bbox.height}px</p>
                  <p><strong>Font:</strong> {selectedElement.fontSize}px {selectedElement.fontFamily}</p>
                  {selectedElement.multiline && <p><strong>Type:</strong> Multi-line text</p>}
                </div>
                <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-700">
                  <strong>Current:</strong> "{selectedElement.content.substring(0, 80)}
                  {selectedElement.content.length > 80 ? '...' : ''}"
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="space-y-6">
            {suggestions.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                  <span className="mr-2"></span>
                  <span className="mr-2">
                   {categoryIndex === 0 && '🎯'}
                   {categoryIndex === 1 && '✨'}
                   {categoryIndex === 2 && '💼'}
                 </span>
                 {category.category}
               </h4>
               <div className="grid gap-2">
                 {category.items.map((suggestion, index) => (
                   <button
                     key={index}
                     onClick={() => handleSuggestionClick(suggestion)}
                     disabled={isFormDisabled}
                     className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors group"
                   >
                     <div className="text-sm font-medium text-gray-800 group-hover:text-gray-900">
                       {suggestion}
                     </div>
                   </button>
                 ))}
               </div>
             </div>
           ))}
         </div>
       )}

       {activeTab === 'presets' && (
         <div className="space-y-4">
           <div className="text-sm text-gray-600 mb-4">
             Quick presets for common document editing scenarios:
           </div>
           <div className="space-y-3">
             {presets.map((preset, index) => (
               <div
                 key={index}
                 className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
               >
                 <div className="flex items-start justify-between">
                   <div className="flex-1">
                     <h4 className="font-medium text-gray-800 flex items-center">
                       <span className="mr-2">
                         {index === 0 && '📋'}
                         {index === 1 && '😊'}
                         {index === 2 && '⚖️'}
                         {index === 3 && '📈'}
                         {index === 4 && '📚'}
                       </span>
                       {preset.name}
                     </h4>
                     <p className="text-sm text-gray-600 mt-1 mb-2">{preset.description}</p>
                     <p className="text-xs text-gray-500 italic">"{preset.instruction}"</p>
                   </div>
                   <button
                     onClick={() => handlePresetClick(preset)}
                     disabled={isFormDisabled}
                     className="ml-3 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                   >
                     Use Preset
                   </button>
                 </div>
               </div>
             ))}
           </div>
         </div>
       )}
     </div>

     {/* Layout Protection Notice */}
     <div className="border-t bg-gradient-to-r from-yellow-50 to-orange-50 p-4">
       <div className="flex items-start">
         <div className="text-yellow-600 mr-3 text-lg">🛡️</div>
         <div>
           <p className="text-sm text-yellow-800 font-medium">Layout Protection System Active</p>
           <p className="text-xs text-yellow-700 mt-1 leading-relaxed">
             • Text automatically truncated if too long for available space<br/>
             • Overlapping prevention ensures clean document layout<br/>
             • Original formatting and positioning preserved<br/>
             • Visual indicators show edited and truncated content
           </p>
         </div>
       </div>
     </div>
   </div>
 );
}