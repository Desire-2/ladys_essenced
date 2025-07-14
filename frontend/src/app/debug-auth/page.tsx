'use client';

import { useAuth } from '../../contexts/AuthContext';

export default function DebugAuth() {
  const { user, loading, error } = useAuth();

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Auth Debug Page</h1>
      <div style={{ marginBottom: '20px' }}>
        <h3>Auth State:</h3>
        <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
        <p><strong>Error:</strong> {error || 'none'}</p>
        <p><strong>User:</strong> {user ? 'User object exists' : 'null'}</p>
      </div>
      
      {user && (
        <div style={{ marginBottom: '20px' }}>
          <h3>User Details:</h3>
          <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Local Storage:</h3>
        <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify({
            access_token: typeof window !== 'undefined' ? localStorage.getItem('access_token')?.substring(0, 50) + '...' : 'N/A',
            user_type: typeof window !== 'undefined' ? localStorage.getItem('user_type') : 'N/A',
            user_id: typeof window !== 'undefined' ? localStorage.getItem('user_id') : 'N/A',
          }, null, 2)}
        </pre>
      </div>
      
      <div>
        <button 
          onClick={() => window.location.reload()} 
          style={{ padding: '10px 20px', margin: '10px' }}
        >
          Reload Page
        </button>
        <button 
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }} 
          style={{ padding: '10px 20px', margin: '10px' }}
        >
          Clear Storage & Reload
        </button>
      </div>
    </div>
  );
}
