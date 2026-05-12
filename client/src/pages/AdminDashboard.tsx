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
    <div className="animate-slide-up">
      <div className="tab-switcher glass-panel" style={{ marginBottom: '3rem', padding: '0.4rem', borderRadius: '100px', width: 'fit-content' }}>
        <button className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('overview')} style={{ padding: '0.6rem 2rem' }}>{t.overview}</button>
        <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('users')} style={{ padding: '0.6rem 2rem' }}>{t.users}</button>
        <button className={`btn ${activeTab === 'categories' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('categories')} style={{ padding: '0.6rem 2rem' }}>{t.categories}</button>
        <button className={`btn ${activeTab === 'support' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('support')} style={{ padding: '0.6rem 2rem' }}>Chat</button>
      </div>

      {actionMsg && <div className="toast success animate-fade-in" style={{ position: 'static', maxWidth: 'none', marginBottom: '2rem' }}>{actionMsg}</div>}

      {activeTab === 'overview' && (
        <div className="animate-slide-up">
          <div className="bento-grid" style={{ marginBottom: '3rem' }}>
            <div className="bento-card" style={{ gridColumn: 'span 3' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '1rem', borderRadius: '16px' }}><Users size={24} /></div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-sub)', textTransform: 'uppercase' }}>Utilisateurs</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>{stats.totalUsers}</div>
                </div>
              </div>
            </div>
            <div className="bento-card" style={{ gridColumn: 'span 3' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent)', padding: '1rem', borderRadius: '16px' }}><Briefcase size={24} /></div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-sub)', textTransform: 'uppercase' }}>Services</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>{stats.totalServices}</div>
                </div>
              </div>
            </div>
            <div className="bento-card" style={{ gridColumn: 'span 3' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '1rem', borderRadius: '16px' }}><ClipboardList size={24} /></div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-sub)', textTransform: 'uppercase' }}>Commandes</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>{stats.totalOrders}</div>
                </div>
              </div>
            </div>
            <div className="bento-card" style={{ gridColumn: 'span 3', background: 'linear-gradient(135deg, var(--accent), var(--accent-light))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'black' }}>
                <div style={{ background: 'rgba(0, 0, 0, 0.1)', padding: '1rem', borderRadius: '16px' }}><Clock size={24} /></div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase' }}>En attente</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>{stats.pendingUsers}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bento-grid">
            <div className="bento-card" style={{ gridColumn: 'span 6' }}>
              <h3 style={{ marginBottom: '2rem', fontWeight: '900', fontSize: '1.5rem' }}>Approbation Automatique</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1.1rem' }}>Clients</strong>
                    <small style={{ color: 'var(--text-sub)' }}>Activer l'approbation immédiate</small>
                  </div>
                  <button className={`btn ${settings?.autoApproveUsers ? 'btn-primary' : 'btn-outline'}`} onClick={() => toggleSetting('autoApproveUsers')}>
                    {settings?.autoApproveUsers ? 'AUTO' : 'MANUEL'}
                  </button>
                </div>
                <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1.1rem' }}>Prestataires</strong>
                    <small style={{ color: 'var(--text-sub)' }}>Nécessite une vérification</small>
                  </div>
                  <button className={`btn ${settings?.autoApproveWorkers ? 'btn-primary' : 'btn-outline'}`} onClick={() => toggleSetting('autoApproveWorkers')}>
                    {settings?.autoApproveWorkers ? 'AUTO' : 'MANUEL'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bento-card" style={{ gridColumn: 'span 6' }}>
              <h3 style={{ marginBottom: '2rem', fontWeight: '900', fontSize: '1.5rem' }}>Dernières Inscriptions</h3>
              <div className="deck-table-wrap">
                <table className="deck-table">
                  <tbody>
                    {pendingUsers.length === 0 && <tr><td style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-sub)' }}>Aucun utilisateur en attente</td></tr>}
                    {pendingUsers.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ fontWeight: '800' }}>{u.name}</div>
                          <span className="badge-manual" style={{ fontSize: '0.6rem' }}>{u.role}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => approveUser(u.id)}><CheckCircle size={14}/></button>
                            <button className="btn btn-outline btn-sm" onClick={() => rejectUser(u.id)} style={{ border: 'none', color: 'var(--danger)' }}><Trash2 size={14}/></button>
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
        <div className="deck-table-wrap animate-slide-up">
          <table className="deck-table">
            <thead><tr><th>Utilisateur</th><th>Rôle</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {allUsers.map(u => (
                <tr key={u.id}>
                  <td data-label="Utilisateur">
                    <div style={{ fontWeight: '800' }}>{u.name}</div>
                    <small style={{ color: 'var(--text-sub)', fontSize: '0.8rem' }}>{u.email}</small>
                  </td>
                  <td data-label="Rôle"><span className="badge-auto">{u.role}</span></td>
                  <td data-label="Status">
                    <span className={`badge ${u.approved ? 'badge-success' : 'badge-manual'}`}>{u.approved ? 'Approuvé' : 'En attente'}</span>
                  </td>
                  <td data-label="Actions">
                    <button className="btn btn-outline btn-sm" onClick={() => rejectUser(u.id)} style={{ border: 'none', color: 'var(--danger)' }}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="bento-grid animate-slide-up">
          <div className="bento-card" style={{ gridColumn: 'span 4' }}>
            <h3 style={{ marginBottom: '2rem', fontWeight: '900', fontSize: '1.5rem' }}>Nouvelle Catégorie</h3>
            <form onSubmit={createCategory}>
              <div className="input-group">
                <input type="text" placeholder="Nom de la catégorie..." value={newCatName} onChange={e => setNewCatName(e.target.value)} style={{ background: 'var(--bg-root)', height: '56px' }} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }}><Plus size={20} /> Créer</button>
            </form>
          </div>
          
          <div className="deck-table-wrap" style={{ gridColumn: 'span 8' }}>
            <table className="deck-table">
              <thead><tr><th>Catégorie</th><th>Services liés</th><th>Actions</th></tr></thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id}>
                    <td data-label="Catégorie"><strong style={{ fontSize: '1.1rem' }}>{c.name}</strong></td>
                    <td data-label="Services">{c._count?.services || 0}</td>
                    <td data-label="Actions">
                      <button className="btn btn-outline btn-sm" onClick={() => deleteCategory(c.id)} style={{ border: 'none', color: 'var(--danger)' }}><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'support' && (
        <div className="deck-table-wrap animate-slide-up">
          <table className="deck-table">
            <thead><tr><th>Utilisateur</th><th>Dernier Message</th><th>Actions</th></tr></thead>
            <tbody>
              {supportConvs.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-sub)' }}>Aucune conversation</td></tr>}
              {supportConvs.map(u => (
                <tr key={u.id}>
                  <td data-label="Utilisateur">
                    <div style={{ fontWeight: '800' }}>{u.name}</div>
                    <small style={{ color: 'var(--text-sub)' }}>{u.email}</small>
                  </td>
                  <td data-label="Dernier Message" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                    {u.supportMessages[0]?.content || '...'}
                  </td>
                  <td data-label="Actions">
                    <button className="btn btn-primary btn-sm" onClick={() => setSelectedUserSupport(u.id)}>
                      <MessageSquare size={16} /> Répondre
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  );
}
    </div>
  );
}
