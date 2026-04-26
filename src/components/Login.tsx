import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Key } from 'lucide-react';

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
    <div className="container flex flex-col items-center justify-center" style={{ minHeight: '80vh' }}>
      <div className="card flex flex-col gap-4" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="flex items-center gap-2">
          <Key size={24} color="#646cff" />
          <h2 style={{ margin: 0 }}>Addy.io Login</h2>
        </div>
        <p className="text-gray text-sm">Enter your API key from addy.io settings to get started.</p>
        <input
          type="password"
          placeholder="API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        {error && <p style={{ color: '#ef4444', fontSize: '0.8rem' }}>{error}</p>}
        <button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Connect Account'}
        </button>
      </div>
    </div>
  );
};
