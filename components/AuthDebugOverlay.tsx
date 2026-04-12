import React from 'react';

/**
 * A highly visible diagnostic overlay to track authentication state in real-time.
 * Helps identify silent failures in the OAuth handshake.
 */
interface AuthDebugOverlayProps {
  logs: string[];
  isLoading: boolean;
  user: any;
  onRetry: () => void;
}

const AuthDebugOverlay: React.FC<AuthDebugOverlayProps> = ({ logs, isLoading, user, onRetry }) => {
  // Only visible on localhost or if a specific debug flag is in the URL
  const isDebugMode = window.location.hostname.includes('localhost') || 
                      window.location.search.includes('debug=true') ||
                      localStorage.getItem('auth_debug') === 'true';

  if (!isDebugMode) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-brand-dark/95 border-b border-red-500 p-2 shadow-2xl font-mono text-[10px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-4">
          <span className="text-white font-bold">AUTH DIAGNOSTICS:</span>
          <span className={user ? 'text-green-400' : 'text-red-400'}>
            USER: {user ? `${user.email} (${user.role})` : 'NULL'}
          </span>
          <span className={isLoading ? 'text-blue-400' : 'text-gray-400'}>
            LOADING: {isLoading ? 'TRUE' : 'FALSE'}
          </span>
        </div>
        <button 
          onClick={onRetry}
          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
        >
          FORCE RETRY SESSION
        </button>
      </div>
      
      <div className="max-h-32 overflow-y-auto bg-black/50 p-2 rounded border border-white/10">
        {logs.map((log, i) => (
          <div key={i} className="text-gray-300 border-l border-brand-cyan pl-2 mb-1">
            <span className="text-brand-cyan/50 italic mr-2">[{new Date().toLocaleTimeString()}]</span>
            {log}
          </div>
        ))}
        {logs.length === 0 && <div className="text-gray-600 italic italic">No auth logs captured yet...</div>}
      </div>
      
      <div className="mt-2 text-[8px] text-gray-500 flex gap-2">
        <span>URL: {window.location.href}</span>
        <span>|</span>
        <span>LS ReturnTo: {localStorage.getItem('authReturnTo') || 'NONE'}</span>
      </div>
    </div>
  );
};

export default AuthDebugOverlay;
