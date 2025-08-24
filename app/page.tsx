// app/page.js
'use client';

import { useState } from 'react';
import PDFViewer from './components/PDFViewer';
import TextEditor from './components/TextEditor';
import EditingStatus from './components/EditingStatus';
import FileUpload from './components/FileUpload';
import ApiKeyInput from './components/ApiKeyInput';

// Define interfaces for our data structures
interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TextElement {
  id: string;
  content: string;
  bbox: BBox;
  fontSize: number;
  fontFamily: string;
  pageIndex: number;
  type: string;
}

interface PDFPage {
  pageIndex: number;
  width: number;
  height: number;
  textElements: TextElement[];
}

interface PDFData {
  pages: PDFPage[];
  textElements: TextElement[];
  metadata: {
    pageCount: number;
    extractedAt: string;
    fileSize: number;
    fileName?: string;
  };
}

interface EditResult {
  editedElements: any[];
  summary: string;
  metadata: any;
  preservedElements: any[];
  error?: string;
}

export default function PDFEditor() {
  const [pdfData, setPdfData] = useState<PDFData | null>(null);
  const [editedElements, setEditedElements] = useState<any[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [editStatus, setEditStatus] = useState('idle'); // idle, loading, success, error
  const [editResult, setEditResult] = useState<EditResult | null>(null);
  const [selectedElement, setSelectedElement] = useState<TextElement | null>(null);
  const [uploadStatus, setUploadStatus] = useState('idle');

  const handlePDFUpload = async (file: File) => {
    setUploadStatus('loading');
    setEditStatus('idle');
    setPdfData(null);
    setEditedElements([]);
    setSelectedElement(null);
    
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }
      
      const data = await response.json();
      setPdfData(data);
      setEditResult(null);
      setUploadStatus('success');
      
      // Auto-clear upload success status after 3 seconds
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setEditResult({ 
        error: error.message,
        editedElements: [],
        summary: '',
        metadata: {},
        preservedElements: []
      });
      setTimeout(() => setUploadStatus('idle'), 5000);
    }
  };

  const handleEdit = async (instruction: string) => {
    if (!pdfData || !apiKey) return;
    
    setEditStatus('loading');
    setEditResult(null);
    
    try {
      const response = await fetch('/api/edit-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textElements: pdfData.textElements,
          editInstruction: instruction,
          apiKey: apiKey
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Edit failed with status ${response.status}`);
      }
      
      const result = await response.json();
      setEditedElements(result.editedElements);
      setEditResult(result);
      setEditStatus('success');
    } catch (error) {
      console.error('Edit error:', error);
      setEditStatus('error');
      setEditResult({ 
        error: error.message,
        editedElements: [],
        summary: '',
        metadata: {},
        preservedElements: []
      });
    }
  };

  const handleDownload = async () => {
    if (!pdfData || !editedElements.length) {
      alert('No edited content to download');
      return;
    }

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalData: pdfData,
          editedElements: editedElements
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited-${pdfData.metadata.fileName || 'document.pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      setEditStatus('error');
      setEditResult({ 
        error: 'Failed to download PDF: ' + error.message,
        editedElements: [],
        summary: '',
        metadata: {},
        preservedElements: []
      });
    }
  };

  const handleReset = () => {
    setEditStatus('idle');
    setEditResult(null);
    setUploadStatus('idle');
  };

  const handleElementSelect = (element: TextElement | null) => {
    setSelectedElement(element);
  };

  const isReadyToEdit = pdfData && apiKey && editStatus !== 'loading';

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
          AI PDF Editor
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Edit PDF content with AI while preserving original layout and formatting. 
          Perfect for invoices, contracts, and business documents.
        </p>
      </div>

      {/* Configuration Section */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
        <FileUpload onFileUpload={handlePDFUpload} isLoading={uploadStatus === 'loading'} />
      </div>

      {/* Main Content */}
      {pdfData && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            {/* PDF Viewer */}
            <div>
              <PDFViewer 
                pdfData={pdfData} 
                editedElements={editedElements}
                onElementSelect={handleElementSelect}
              />
            </div>
            
            {/* Text Editor */}
            <div>
              <TextEditor 
                onEdit={handleEdit} 
                disabled={!isReadyToEdit}
                editStatus={editStatus}
                selectedElement={selectedElement}
              />
            </div>
          </div>

          {/* Document Statistics */}
          {editedElements.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Edit Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{pdfData.textElements.length}</div>
                  <div className="text-sm text-blue-800">Total Elements</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {editResult?.metadata?.editedElements || editedElements.length}
                  </div>
                  <div className="text-sm text-green-800">Elements Edited</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {editResult?.metadata?.truncatedElements || 0}
                  </div>
                  <div className="text-sm text-orange-800">Truncated</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {editResult?.preservedElements?.length || 0}
                  </div>
                  <div className="text-sm text-purple-800">Preserved</div>
                </div>
              </div>
              
              {editResult?.summary && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Summary:</strong> {editResult.summary}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Features Section */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
          🚀 Features & Capabilities
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: '🎯',
              title: 'Layout Preservation',
              description: 'Maintains exact positioning, sizing, and formatting of all elements'
            },
            {
              icon: '✂️',
              title: 'Smart Truncation',
              description: 'Automatically truncates text that exceeds available space constraints'
            },
            {
              icon: '🚫',
              title: 'Overlap Prevention',
              description: 'Prevents text elements from overlapping and breaking document design'
            },
            {
              icon: '🤖',
              title: 'AI-Powered Editing',
              description: 'Uses Google Gemini AI to intelligently edit content based on instructions'
            },
            {
              icon: '📱',
              title: 'Interactive Interface',
              description: 'Click elements to select, zoom controls, real-time preview of changes'
            },
            {
              icon: '⬇️',
              title: 'PDF Generation',
              description: 'Download edited PDFs with preserved formatting and professional quality'
            }
          ].map((feature, index) => (
            <div key={index} className="text-center p-6 rounded-lg bg-gradient-to-br from-gray-50 to-white border border-gray-200">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="font-semibold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-gray-800 mb-3">🛡️ Layout Protection System</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <p className="mb-2"><strong>Character Limits:</strong> Calculates maximum text based on element size and font</p>
              <p className="mb-2"><strong>Boundary Enforcement:</strong> Ensures text never exceeds original element bounds</p>
            </div>
            <div>
              <p className="mb-2"><strong>Multi-line Support:</strong> Handles both single and multi-line text elements</p>
              <p className="mb-2"><strong>Visual Indicators:</strong> Shows edited, truncated, and selected elements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Toast */}
      <EditingStatus
        status={editStatus || uploadStatus}
        result={editResult}
        onDownload={handleDownload}
        onReset={handleReset}
      />
    </div>
  );
}