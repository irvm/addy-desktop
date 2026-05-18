import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Shield, Mail, XCircle, RefreshCcw, Plus, X, Trash2, Ghost, Power, Search, Copy, Check, LogOut } from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [stats, setStats] = useState<any>(null);
  const [aliases, setAliases] = useState<any[]>([]);
  const [usernames, setUsernames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [creating, setCreating] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to log out?')) return;
    try {
      await invoke('logout');
      onLogout();
    } catch (e) {
      alert('Logout failed: ' + String(e));
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
      // Optimistic UI update
      setAliases(prev => prev.map(a => a.id === id ? { ...a, active: !currentActive } : a));
      await invoke('toggle_alias_active', { id, active: !currentActive });
      fetchData();
    } catch (e) {
      alert(String(e));
      fetchData(); // Revert on error
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    fetchData();
    fetchUsernames();
  }, []);

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

  const filteredAliases = aliases.filter(a => 
    a.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading && !aliases.length) {
    return (
      <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="flex flex-col items-center gap-4">
          <RefreshCcw size={32} className="animate-spin" color="var(--accent-primary)" />
          <p className="text-gray font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in">
      <header className="flex justify-between items-center mb-6" style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--card-border)' }}>
        <div className="flex items-center gap-3">
          <div style={{ background: 'var(--accent-gradient)', padding: '0.5rem', borderRadius: '12px' }}>
            <Shield size={24} color="white" />
          </div>
          <h1>Addy Desktop</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} title="Refresh Data">
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={18} /> New Alias
          </button>
          <button onClick={handleLogout} title="Log Out" style={{ color: 'var(--danger)', background: 'rgba(202, 97, 128, 0.1)' }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid flex gap-4 mb-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="card card-hover">
          <div className="flex items-center gap-2 text-gray mb-3">
            <Shield size={18} color="var(--accent-primary)" /> <span className="font-semibold text-sm">Total Aliases</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', lineHeight: 1, color: 'var(--accent-primary)' }}>{stats?.data?.total_aliases || 0}</div>
        </div>
        <div className="card card-hover">
          <div className="flex items-center gap-2 text-gray mb-3">
            <Mail size={18} color="var(--success)" /> <span className="font-semibold text-sm">Emails Forwarded</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', lineHeight: 1, color: 'var(--success)' }}>{stats?.data?.total_emails_forwarded || 0}</div>
        </div>
        <div className="card card-hover">
          <div className="flex items-center gap-2 text-gray mb-3">
            <XCircle size={18} color="var(--danger)" /> <span className="font-semibold text-sm">Emails Blocked</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', lineHeight: 1, color: 'var(--danger)' }}>{stats?.data?.total_emails_blocked || 0}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 mt-6">
        <h2>Your Aliases</h2>
        <div className="flex items-center gap-2" style={{ position: 'relative', width: '250px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.8rem' }} />
          <input 
            type="text" 
            placeholder="Search aliases..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.2rem', paddingRight: '1rem', paddingBottom: '0.6rem', paddingTop: '0.6rem', fontSize: '0.85rem' }}
          />
        </div>
      </div>
      
      {error && <div style={{ background: 'rgba(202, 97, 128, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(202, 97, 128, 0.2)' }}>{error}</div>}

      <div className="flex flex-col gap-3">
        {filteredAliases.length === 0 ? (
          <div className="card flex flex-col items-center justify-center text-gray py-8 gap-2 text-center">
            <Ghost size={32} opacity={0.5} />
            <p>No aliases found.</p>
          </div>
        ) : (
          filteredAliases.map((alias) => (
            <div key={alias.id} className="card card-hover flex justify-between items-center" style={{ padding: '1.2rem 1.5rem', opacity: alias.active ? 1 : 0.6 }}>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '1.05rem', fontWeight: '600', color: alias.active ? 'var(--text-main)' : 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {alias.email}
                  </span>
                  <button 
                    onClick={() => copyToClipboard(alias.email, alias.id)}
                    style={{ background: 'transparent', border: 'none', padding: '4px', opacity: 0.7 }}
                    title="Copy to clipboard"
                  >
                    {copiedId === alias.id ? <Check size={14} color="var(--success)" /> : <Copy size={14} color="var(--accent-primary)" />}
                  </button>
                </div>
                {alias.description && (
                  <div className="text-sm text-gray flex items-center gap-2">
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: alias.active ? 'var(--success)' : 'var(--text-muted)' }}></div>
                    {alias.description}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleToggleActive(alias.id, alias.active)}
                  title={alias.active ? "Deactivate Alias" : "Activate Alias"}
                  style={{ background: alias.active ? 'rgba(0, 168, 204, 0.15)' : 'var(--btn-bg-muted)', color: alias.active ? 'var(--success)' : 'var(--text-muted)' }}
                >
                  <Power size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteAlias(alias.id)}
                  title="Delete Alias"
                  style={{ background: 'rgba(202, 97, 128, 0.15)', color: 'var(--danger)' }}
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={() => handleForgetAlias(alias.id)}
                  title="Forget Alias (Permanent)"
                  style={{ background: 'var(--btn-bg-muted)', color: 'var(--text-muted)' }}
                >
                  <Ghost size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div className="animate-fade-in" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(254, 253, 153, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(8px)'
        }}>
          <div className="card flex flex-col gap-5" style={{ 
            width: '100%', 
            maxWidth: '440px',
            border: '1px solid var(--card-border)',
            boxShadow: '0 25px 50px -12px rgba(202, 97, 128, 0.25)',
            transform: 'scale(1)',
          }}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <div style={{ background: 'rgba(202, 97, 128, 0.1)', padding: '0.5rem', borderRadius: '10px' }}>
                  <Plus size={20} color="var(--accent-primary)" />
                </div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Create New Alias</h2>
              </div>
              <button onClick={() => setShowModal(false)} style={{ padding: '0.4rem', borderRadius: '8px', background: 'var(--btn-bg-muted)' }}>
                <X size={18} color="var(--accent-primary)" />
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Select Domain</label>
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
              <label className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Description (Optional)</label>
              <input
                autoFocus
                placeholder="e.g. Netflix Account"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateAlias()}
              />
            </div>

            <button 
              onClick={handleCreateAlias} 
              disabled={creating} 
              className="btn-primary mt-4"
              style={{ padding: '0.9rem' }}
            >
              {creating ? 'Generating Alias...' : 'Create Alias'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
