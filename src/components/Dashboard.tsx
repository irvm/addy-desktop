import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Shield, Mail, XCircle, CheckCircle, RefreshCcw, Plus, X, Trash2, Ghost, Power } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [aliases, setAliases] = useState<any[]>([]);
  const [usernames, setUsernames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await invoke('get_stats');
      const aliasesRes = await invoke('get_aliases');
      setStats(statsRes);
      // @ts-ignore
      setAliases(aliasesRes.data || []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const fetchUsernames = async () => {
    try {
      const res: any = await invoke('get_available_domains');
      setUsernames(res.usernames || []);
    } catch (e) {
      console.error('Failed to fetch account info', e);
    }
  };

  const handleCreateAlias = async () => {
    if (!selectedDomain) {
      alert('Please select a domain');
      return;
    }
    setCreating(true);
    try {
      await invoke('create_alias', { 
        domain: selectedDomain, 
        description: newDescription || null 
      });
      setNewDescription('');
      setShowModal(false);
      fetchData();
    } catch (e) {
      alert(String(e));
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await invoke('toggle_alias_active', { id, active: !currentActive });
      fetchData();
    } catch (e) {
      alert(String(e));
    }
  };

  const handleDeleteAlias = async (id: string) => {
    if (!confirm('Are you sure you want to delete this alias?')) return;
    try {
      await invoke('delete_alias', { id });
      fetchData();
    } catch (e) {
      alert(String(e));
    }
  };

  const handleForgetAlias = async (id: string) => {
    if (!confirm('Are you sure you want to FORGET this alias? This action is permanent and cannot be undone.')) return;
    try {
      await invoke('forget_alias', { id });
      fetchData();
    } catch (e) {
      alert(String(e));
    }
  };

  useEffect(() => {
    fetchData();
    fetchUsernames();
  }, []);

  // Free users domain logic
  const availableDomains = [
    'anonaddy.me',
    'anonaddy.com',
    ...usernames.flatMap(u => [
      `${u.username}.anonaddy.me`,
      `${u.username}.anonaddy.com`
    ])
  ];

  useEffect(() => {
    if (availableDomains.length > 0 && !selectedDomain) {
      setSelectedDomain(availableDomains[0]);
    }
  }, [usernames]);

  if (loading && !aliases.length) return <div className="container">Loading dashboard...</div>;

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-4">
        <h1>Addy Desktop</h1>
        <div className="flex gap-2">
          <button onClick={fetchData} className="flex items-center gap-2">
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2" style={{ backgroundColor: '#646cff' }}>
            <Plus size={16} /> New Alias
          </button>
        </div>
      </div>

      <div className="grid flex gap-4 mb-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="card">
          <div className="flex items-center gap-2 text-gray mb-4">
            <Shield size={20} /> Total Aliases
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats?.data?.total_aliases || 0}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-gray mb-4">
            <Mail size={20} /> Emails Forwarded
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats?.data?.total_emails_forwarded || 0}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-gray mb-4">
            <XCircle size={20} /> Emails Blocked
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats?.data?.total_emails_blocked || 0}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h2>Recent Aliases</h2>
        {error && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{error}</span>}
      </div>
      
      <div className="flex flex-col gap-2">
        {aliases.map((alias) => (
          <div key={alias.id} className="card flex justify-between items-center">
            <div>
              <div style={{ fontWeight: '600', color: alias.active ? 'inherit' : '#94a3b8' }}>{alias.email}</div>
              <div className="text-sm text-gray">{alias.description || 'No description'}</div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleToggleActive(alias.id, alias.active)}
                title={alias.active ? "Deactivate" : "Activate"}
                style={{ background: 'none', border: 'none', color: alias.active ? '#22c55e' : '#ef4444', cursor: 'pointer' }}
              >
                <Power size={18} />
              </button>
              <button 
                onClick={() => handleDeleteAlias(alias.id)}
                title="Delete"
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <Trash2 size={18} />
              </button>
              <button 
                onClick={() => handleForgetAlias(alias.id)}
                title="Forget"
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <Ghost size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(10px)'
        }}>
          <div className="flex flex-col gap-4" style={{ 
            width: '100%', 
            maxWidth: '420px',
            background: '#1e293b',
            padding: '2rem',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            color: 'white',
            border: '2px solid #4f46e5'
          }}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#4f46e5' }}></div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>New Alias</h2>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: '#334155', border: 'none', padding: '5px', borderRadius: '50%', display: 'flex', cursor: 'pointer' }}>
                <X size={20} color="white" />
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold" style={{ color: '#646cff' }}>Select Domain</label>
              <select 
                value={selectedDomain} 
                onChange={(e) => setSelectedDomain(e.target.value)}
              >
                {availableDomains.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold" style={{ color: '#646cff' }}>Description (Optional)</label>
              <input
                autoFocus
                placeholder="e.g. Amazon Shopping"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                style={{ 
                  background: '#0f172a', color: 'white', padding: '0.8rem', 
                  borderRadius: '12px', border: '1px solid #334155',
                  fontSize: '1rem', outline: 'none'
                }}
              />
            </div>

            <button 
              onClick={handleCreateAlias} 
              disabled={creating} 
              style={{ 
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: 'white', 
                fontWeight: 'bold',
                padding: '1rem',
                fontSize: '1.1rem',
                marginTop: '1rem',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              {creating ? 'Generating...' : 'Create Alias'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
