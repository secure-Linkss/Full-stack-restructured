import React from 'react';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 rounded-lg p-6 text-center">
        <div className="text-red-400 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-white mb-4">Oops! Something went wrong</h1>
        <p className="text-slate-300 mb-6">
          We're sorry, but something unexpected happened. Please try refreshing the page.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left mb-4">
            <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-300">
              Error details (Development)
            </summary>
            <pre className="mt-2 text-xs bg-slate-900 p-3 rounded overflow-auto max-h-32 text-red-300">
              {error?.message || 'Unknown error'}
            </pre>
          </details>
        )}
        
        <div className="space-y-3">
          <button
            onClick={resetErrorBoundary}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
