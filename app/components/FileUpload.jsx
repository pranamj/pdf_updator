// app/components/FileUpload.jsx
'use client';

import { useState, useCallback } from 'react';

export default function FileUpload({ onFileUpload, isLoading }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.name.toLowerCase().endsWith('.pdf'));
    
    if (pdfFile) {
      onFileUpload(pdfFile);
    } else {
      alert('Please upload a PDF file');
    }
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload PDF Document</h2>
      
      <div
        className={`upload-area ${dragOver ? 'dragover' : ''} ${isLoading ? 'opacity-50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="loading-spinner mb-4"></div>
            <p className="text-gray-600">Processing your PDF...</p>
            <p className="text-sm text-gray-500">This may take a moment</p>
          </div>
        ) : (
          <>
            <div className="text-6xl text-gray-400 mb-4">📄</div>
            <p className="text-lg text-gray-700 mb-2">Drop your PDF here or click to browse</p>
            <p className="text-sm text-gray-500 mb-4">Supports PDF files up to 10MB</p>
            
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isLoading}
            />
            <label
              htmlFor="file-upload"
              className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
            >
              Choose PDF File
            </label>
          </>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>📋 <strong>What happens next:</strong></p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Your PDF will be analyzed to extract text elements and their positions</li>
          <li>Each text element will be mapped with exact layout constraints</li>
          <li>You can then use AI to edit the content while preserving the design</li>
        </ul>
      </div>
    </div>
  );
}