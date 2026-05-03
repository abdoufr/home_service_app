import React, { useState, useEffect } from 'react';
import { 
  Settings, Users, Briefcase, ClipboardList, Clock, Zap, Tag, Trash2, 
  CheckCircle, UserCheck, MessageSquare, ShieldAlert, Plus, ShieldCheck, Mail
} from 'lucide-react';
import SupportChat from '../components/SupportChat';

export default function AdminDashboard({ t, lang }: { t: any, lang: string }) {
  const [settings, setSettings] = useState<{ autoApproveUsers: boolean; autoApproveWorkers: boolean } | null>(null);
  const [stats, setStats] = useState({ totalUsers: 0, totalServices: 0, totalOrders: 0, pendingUsers: 0 });
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'categories' | 'support'>('overview');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState('');
  
  const [selectedUserSupport, setSelectedUserSupport] = useState<string | null>(null);
  const [supportConvs, setSupportConvs] = useState<any[]>([]);

  const api = (path: string, opts?: RequestInit) =>
    fetch(`/api/admin${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });

  const loadAll = async () => {
    try {
      const [settingsRes, statsRes, pendingRes, usersRes, catRes, supportRes] = await Promise.all([
        api('/settings'),
        api('/stats'),
        api('/users?status=pending'),
        api('/users?status=all'),
        fetch('/api/services/categories', { credentials: 'include' }),
        api('/support/conversations')
      ]);
      setSettings(await settingsRes.json());
      setStats(await statsRes.json());
      setPendingUsers(await pendingRes.json());
      if (usersRes.ok) setAllUsers(await usersRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (supportRes.ok) setSupportConvs(await supportRes.json());
    } catch {
      setActionMsg('❌ Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const toggleSetting = async (key: 'autoApproveUsers' | 'autoApproveWorkers') => {
    if (!settings) return;
    const newValue = !settings[key];
    const res = await api('/settings', {
      method: 'PATCH',
      body: JSON.stringify({ [key]: newValue }),
    });
    if (res.ok) {
      setSettings({ ...settings, [key]: newValue });
      setActionMsg(`✅ Paramètre mis à jour`);
      setTimeout(() => setActionMsg(''), 3000);
    }
  };

  const approveUser = async (id: string) => {
    const res = await api(`/users/${id}/approve`, { method: 'PATCH' });
    if (res.ok) {
      setPendingUsers((prev) => prev.filter((u) => u.id !== id));
      setAllUsers((prev) => prev.map((u) => u.id === id ? { ...u, approved: true } : u));
      setStats((s) => ({ ...s, pendingUsers: s.pendingUsers - 1 }));
      setActionMsg('✅ Utilisateur approuvé');
      setTimeout(() => setActionMsg(''), 3000);
    }
  };

  const rejectUser = async (id: string) => {
    if (!window.confirm("Refuser cet utilisateur ?")) return;
    const res = await api(`/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPendingUsers((prev) => prev.filter((u) => u.id !== id));
      setAllUsers((prev) => prev.filter((u) => u.id !== id));
      setStats((s) => ({ ...s, pendingUsers: s.pendingUsers - 1 }));
      setActionMsg('🗑️ Utilisateur supprimé');
      setTimeout(() => setActionMsg(''), 3000);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!window.confirm("Supprimer cette catégorie ?")) return;
    const res = await api(`/categories/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setActionMsg('🗑️ Catégorie supprimée');
      setTimeout(() => setActionMsg(''), 3000);
    }
  };

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const res = await api('/categories', {
      method: 'POST',
      body: JSON.stringify({ name: newCatName })
    });
    if (res.ok) {
      const cat = await res.json();
      cat._count = { services: 0 };
      setCategories([...categories, cat]);
      setNewCatName('');
      setActionMsg('✅ Catégorie créée');
    }
  };

  if (loading) return (
    <div style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Zap className="spin" size={40} color="var(--primary)" />
    </div>
  );

  return (
    <div className="app-container animate-fade-in">
      <header className="section-header">
        <div>
          <h2 className="section-title"><ShieldCheck size={28} color="var(--primary)" /> {t.admin}</h2>
          <p className="section-sub">{t.overview}</p>
        </div>
        <div className="tab-switcher glass-panel" style={{ padding: '0.4rem', borderRadius: '100px' }}>
          <button className={`btn ${activeTab === 'overview' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('overview')} style={{ padding: '0.6rem 1.5rem' }}>{t.overview}</button>
          <button className={`btn ${activeTab === 'users' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('users')} style={{ padding: '0.6rem 1.5rem' }}>{t.users}</button>
          <button className={`btn ${activeTab === 'categories' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('categories')} style={{ padding: '0.6rem 1.5rem' }}>{t.categories}</button>
          <button className={`btn ${activeTab === 'support' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('support')} style={{ padding: '0.6rem 1.5rem' }}>Chat</button>
        </div>
      </header>

      {actionMsg && <div className="toast success animate-fade-in" style={{ position: 'static', maxWidth: 'none', marginBottom: '2rem' }}>{actionMsg}</div>}

      {activeTab === 'overview' && (
        <div className="animate-fade-in">
          <div className="stats-grid-modern" style={{ marginBottom: '3rem' }}>
            <div className="stat-card glass-panel">
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)' }}><Users size={24} /></div>
              <div className="stat-info">
                <span className="stat-label">Utilisateurs</span>
                <span className="stat-value">{stats.totalUsers}</span>
              </div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}><Briefcase size={24} /></div>
              <div className="stat-info">
                <span className="stat-label">Services</span>
                <span className="stat-value">{stats.totalServices}</span>
              </div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}><ClipboardList size={24} /></div>
              <div className="stat-info">
                <span className="stat-label">Commandes</span>
                <span className="stat-value">{stats.totalOrders}</span>
              </div>
            </div>
            <div className="stat-card glass-panel" style={{ background: 'linear-gradient(135deg, var(--accent-glow), transparent)' }}>
              <div className="stat-icon" style={{ background: 'var(--accent)', color: 'black' }}><Clock size={24} /></div>
              <div className="stat-info">
                <span className="stat-label">En attente</span>
                <span className="stat-value">{stats.pendingUsers}</span>
              </div>
            </div>
          </div>

          <div className="adaptive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))' }}>
            <div className="glass-panel">
              <h3 style={{ marginBottom: '1.5rem', fontWeight: '800' }}>Approbaton Automatique</h3>
              <div className="toggle-item" style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ display: 'block' }}>Clients</strong>
                  <small style={{ color: 'var(--text-sub)' }}>Activer l'approbation immédiate</small>
                </div>
                <button className={`btn btn-sm ${settings?.autoApproveUsers ? 'btn-primary' : 'btn-outline'}`} onClick={() => toggleSetting('autoApproveUsers')}>
                  {settings?.autoApproveUsers ? 'AUTO' : 'MANUEL'}
                </button>
              </div>
              <div className="toggle-item" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ display: 'block' }}>Prestataires</strong>
                  <small style={{ color: 'var(--text-sub)' }}>Nécessite une vérification</small>
                </div>
                <button className={`btn btn-sm ${settings?.autoApproveWorkers ? 'btn-primary' : 'btn-outline'}`} onClick={() => toggleSetting('autoApproveWorkers')}>
                  {settings?.autoApproveWorkers ? 'AUTO' : 'MANUEL'}
                </button>
              </div>
            </div>

            <div className="glass-panel">
              <h3 style={{ marginBottom: '1.5rem', fontWeight: '800' }}>Dernières Inscriptions</h3>
              <div className="table-responsive" style={{ border: 'none' }}>
                <table className="data-table">
                  <tbody>
                    {pendingUsers.length === 0 && <tr><td style={{ textAlign: 'center', color: 'var(--text-sub)' }}>Aucun utilisateur en attente</td></tr>}
                    {pendingUsers.map(u => (
                      <tr key={u.id}>
                        <td style={{ padding: '1rem 0' }}>
                          <strong>{u.name}</strong><br/>
                          <span className="badge-manual" style={{ fontSize: '0.65rem' }}>{u.role}</span>
                        </td>
                        <td style={{ textAlign: 'right', padding: '1rem 0' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-sm btn-primary" onClick={() => approveUser(u.id)}><CheckCircle size={14}/></button>
                            <button className="btn btn-sm btn-danger" onClick={() => rejectUser(u.id)} style={{ border: 'none' }}><Trash2 size={14}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="glass-panel animate-fade-in">
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>Utilisateur</th><th>Rôle</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {allUsers.map(u => (
                  <tr key={u.id}>
                    <td data-label="Utilisateur">
                      <strong>{u.name}</strong><br/>
                      <small style={{ color: 'var(--text-sub)' }}>{u.email}</small>
                    </td>
                    <td data-label="Rôle"><span className="badge-auto">{u.role}</span></td>
                    <td data-label="Status">
                      <span className={`badge ${u.approved ? 'badge-success' : 'badge-manual'}`}>{u.approved ? 'Approuvé' : 'En attente'}</span>
                    </td>
                    <td data-label="Actions">
                      <button className="btn btn-sm btn-danger" onClick={() => rejectUser(u.id)} style={{ border: 'none' }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="glass-panel animate-fade-in">
          <form onSubmit={createCategory} style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
            <input type="text" placeholder="Nom de la catégorie..." value={newCatName} onChange={e => setNewCatName(e.target.value)} style={{ background: 'var(--glass-bg)' }} />
            <button className="btn btn-primary"><Plus size={20} /> Créer</button>
          </form>
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>Catégorie</th><th>Services liés</th><th>Actions</th></tr></thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id}>
                    <td data-label="Catégorie"><strong>{c.name}</strong></td>
                    <td data-label="Services">{c._count?.services || 0}</td>
                    <td data-label="Actions">
                      <button className="btn btn-sm btn-danger" onClick={() => deleteCategory(c.id)} style={{ border: 'none' }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'support' && (
        <div className="glass-panel animate-fade-in">
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>Utilisateur</th><th>Dernier Message</th><th>Actions</th></tr></thead>
              <tbody>
                {supportConvs.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: '4rem' }}>Aucune conversation</td></tr>}
                {supportConvs.map(u => (
                  <tr key={u.id}>
                    <td data-label="Utilisateur">
                      <strong>{u.name}</strong><br/>
                      <small style={{ color: 'var(--text-sub)' }}>{u.email}</small>
                    </td>
                    <td data-label="Dernier Message" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.supportMessages[0]?.content || '...'}
                    </td>
                    <td data-label="Actions">
                      <button className="btn btn-sm btn-primary" onClick={() => setSelectedUserSupport(u.id)}>
                        <MessageSquare size={16} /> Répondre
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedUserSupport && (
        <SupportChat 
          isAdmin={true} 
          targetUserId={selectedUserSupport} 
          onClose={() => setSelectedUserSupport(null)} 
          t={t} 
          lang={lang} 
        />
      )}

      <style>{`
        .stats-grid-modern { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; }
        .stat-card { display: flex; align-items: center; gap: 1.25rem; padding: 1.5rem !important; }
        .stat-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .stat-info { display: flex; flex-direction: column; }
        .stat-label { font-size: 0.75rem; font-weight: 800; color: var(--text-sub); text-transform: uppercase; letter-spacing: 0.05em; }
        .stat-value { font-size: 1.5rem; font-weight: 900; color: var(--text-main); line-height: 1; margin-top: 0.2rem; }
        
        @media (max-width: 1024px) {
          .stats-grid-modern { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 480px) {
          .stats-grid-modern { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
