"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load a file into the full PDF.js viewer
  const loadIntoViewer = (url: string) => {
    setPdfUrl(url);
  };

  const onUpload = (f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setOriginalUrl(url);
    loadIntoViewer(url);
  };

  const applyEdit = async () => {
    if (!file || !prompt) {
      alert("Upload a PDF and enter a prompt first.");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    form.append("prompt", prompt);

    const res = await fetch("/api/edit-pdf", { method: "POST", body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert("Edit failed: " + (err?.error || res.statusText));
      return;
    }

    const blob = await res.blob();
    const editedUrl = URL.createObjectURL(blob);
    loadIntoViewer(editedUrl);
  };

  const downloadCurrent = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = "edited.pdf";
    a.click();
  };

  const resetToOriginal = () => {
    if (originalUrl) loadIntoViewer(originalUrl);
  };

  // Build viewer src when pdfUrl changes
  const viewerSrc = pdfUrl
    ? `/pdfjs/viewer.html?file=${encodeURIComponent(pdfUrl)}`
    : `/pdfjs/viewer.html`;

  // Handle iframe load and error events
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      console.log('PDF viewer loaded successfully');
    };

    const handleError = (error: Error) => {
      console.error('Error loading PDF viewer:', error);
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError as any);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError as any);
    };
  }, [viewerSrc]);

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="p-4 border-b flex items-center gap-3">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
          }}
        />
        <button
          className="px-3 py-2 rounded bg-gray-200"
          onClick={resetToOriginal}
          disabled={!originalUrl}
          title="Show original upload"
        >
          Reset to Original
        </button>
        <div className="ml-auto text-sm text-gray-600">
          Full PDF.js Viewer below
        </div>
      </div>

      <div className="flex-1">
        <div className="w-full h-[70vh] border-b relative">
          <iframe
            key={viewerSrc} // Force re-render when src changes
            ref={iframeRef}
            src={viewerSrc}
            className="w-full h-full"
            title="PDF Viewer"
            sandbox="allow-same-origin allow-scripts"
          />
          {!pdfUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <p className="text-gray-500">Upload a PDF to view it here</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <label className="font-medium">Prompt</label>
        <textarea
          className="border rounded p-2 w-full h-28"
          placeholder={`Examples:\n- Replace all "2023" with "2025"\n- Change company name from "ABC Corp" to "XYZ Ltd"`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="flex gap-3">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={applyEdit}
          >
            Apply Edit & Preview
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded"
            onClick={downloadCurrent}
            disabled={!pdfUrl}
          >
            Save (Download)
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Edits are applied server-side to a copy; your original file remains
          unchanged. The preview refreshes automatically.
        </p>
      </div>
    </div>
  );
}
