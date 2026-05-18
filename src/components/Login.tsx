import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Key, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!apiKey) return;
    setLoading(true);
    setError('');
    try {
      await invoke('save_api_key', { apiKey });
      onLogin();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex flex-col items-center justify-center animate-fade-in" style={{ minHeight: '100vh', padding: '1rem' }}>
      <div className="card flex flex-col gap-6" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem 2rem' }}>
        
        <div className="flex flex-col items-center gap-3 text-center mb-2">
          <div style={{ background: 'rgba(202, 97, 128, 0.15)', padding: '1rem', borderRadius: '50%', marginBottom: '0.5rem' }}>
            <ShieldCheck size={40} color="var(--accent-primary)" />
          </div>
          <h1>Addy Desktop</h1>
          <p className="text-gray text-sm" style={{ maxWidth: '280px' }}>
            Securely connect your addy.io account using your Personal Access Token.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>API Key</label>
          <div className="flex items-center gap-2" style={{ position: 'relative' }}>
            <Key size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem' }} />
            <input
              type="password"
              placeholder="Paste your key here..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200 mt-2">
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                {error}
              </p>
            </div>
          )}
        </div>

        <button 
          onClick={handleSave} 
          disabled={loading || !apiKey}
          className="btn-primary"
          style={{ padding: '0.8rem', fontSize: '1rem', marginTop: '0.5rem' }}
        >
          {loading ? 'Connecting...' : 'Connect Account'}
        </button>

      </div>
    </div>
  );
};
