// app/components/EditingStatus.jsx
'use client';

export default function EditingStatus({ status, result, onDownload, onReset }) {
  if (!status || status === 'idle') return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          bgColor: 'bg-blue-500',
          icon: <div className="loading-spinner border-white border-t-transparent"></div>,
          title: 'Processing Your Request...',
          subtitle: 'AI is analyzing and editing your document'
        };
      case 'success':
        return {
          bgColor: 'bg-green-500',
          icon: <span className="text-2xl">✅</span>,
          title: 'Content Updated Successfully!',
          subtitle: result?.summary || 'Your document has been processed'
        };
      case 'error':
        return {
          bgColor: 'bg-red-500',
          icon: <span className="text-2xl">❌</span>,
          title: 'Processing Error',
          subtitle: result?.error || 'An unexpected error occurred'
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <div className="fixed bottom-6 right-6 max-w-md z-50">
      <div className={`${config.bgColor} text-white p-4 rounded-lg shadow-2xl border border-white/20`}>
        <div className="flex items-start">
          <div className="mr-3 flex-shrink-0 flex items-center justify-center w-8 h-8">
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white">{config.title}</p>
            <p className="text-sm text-white/90 mt-1">{config.subtitle}</p>
            
            {status === 'success' && result?.metadata && (
              <div className="text-xs text-white/75 mt-2 space-y-1">
                <p>📊 {result.metadata.totalElements} elements processed</p>
                {result.metadata.editedElements > 0 && (
                  <p>✏️ {result.metadata.editedElements} elements modified</p>
                )}
                {result.metadata.truncatedElements > 0 && (
                  <p>✂️ {result.metadata.truncatedElements} elements truncated to fit</p>
                )}
              </div>
            )}
            
            <div className="flex space-x-2 mt-3">
              {status === 'success' && (
                <button
                  onClick={onDownload}
                  className="bg-white text-green-600 px-3 py-2 rounded text-sm font-medium hover:bg-green-50 transition-colors flex items-center"
                >
                  <span className="mr-1">⬇️</span>
                  Download PDF
                </button>
              )}
              <button
                onClick={onReset}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  status === 'success'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-white text-red-600 hover:bg-red-50'
                }`}
              >
                {status === 'success' ? 'Edit More' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}