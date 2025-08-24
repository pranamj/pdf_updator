// app/components/ApiKeyInput.jsx
'use client';

import { useState } from 'react';

export default function ApiKeyInput({ apiKey, setApiKey }) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Gemini AI Configuration</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              placeholder="Enter your Gemini API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showKey ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-blue-500 mr-3 mt-0.5">ℹ️</div>
            <div className="text-sm">
              <p className="font-medium text-blue-800">How to get your API key:</p>
              <ol className="list-decimal list-inside mt-2 text-blue-700 space-y-1">
                <li>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">Google AI Studio</a></li>
                <li>Sign in with your Google account</li>
                <li>Click "Create API Key" and copy the generated key</li>
                <li>Paste it above to start editing your PDFs</li>
              </ol>
            </div>
          </div>
        </div>

        {apiKey && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <div className="text-green-500 mr-2">✅</div>
              <p className="text-sm text-green-700 font-medium">API Key configured successfully!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}