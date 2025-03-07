
import { createRoot } from 'react-dom/client'
import { useState, useEffect } from 'react'
import App from './App.tsx'
import './index.css'

// Simple error boundary component
const AppWithErrorHandling = () => {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Global error handler
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      setError(event.error);
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
        <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h1>
        <div className="bg-black/40 p-4 rounded-lg max-w-2xl overflow-auto">
          <p className="mb-2 text-red-300">{error.message}</p>
          <details>
            <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">Show error details</summary>
            <pre className="mt-2 p-2 bg-black/60 rounded text-xs text-gray-300 overflow-auto">
              {error.stack}
            </pre>
          </details>
        </div>
        <p className="mt-4 text-gray-400">
          You may need to set your environment variables. Check for:
        </p>
        <ul className="list-disc list-inside text-gray-400 mt-2">
          <li>VITE_SUPABASE_URL</li>
          <li>VITE_SUPABASE_ANON_KEY</li>
        </ul>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-6 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          Refresh the page
        </button>
      </div>
    );
  }

  return <App />;
};

createRoot(document.getElementById("root")!).render(<AppWithErrorHandling />);
