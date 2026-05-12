import { useState, useEffect } from 'react';
import { Plus, Trash2, Briefcase, ClipboardList, MessageCircle, Clock, CheckCircle, XCircle, TrendingUp, AlertCircle, User, MapPin } from 'lucide-react';
import ChatModal from '../components/ChatModal';
import MapPicker from '../components/MapPicker.js';

export default function WorkerDashboard({ userId, t, lang }: { userId: string, t: any, lang: string }) {
  const [services, setServices] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'services' | 'chat' | 'location'>('orders');
  const [profile, setProfile] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [activeChat, setActiveChat] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chatId = params.get('chat');
    if (chatId) {
      setActiveChat(chatId);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const [newService, setNewService] = useState({
    title: '',
    description: '',
    price: '',
    categoryId: ''
  });

  const fetchAll = async () => {
    try {
      const [srvRes, ordRes, catRes, meRes] = await Promise.all([
        fetch('/api/services/worker/me', { credentials: 'include' }),
        fetch('/api/services/orders/worker', { credentials: 'include' }),
        fetch('/api/services/categories', { credentials: 'include' }),
        fetch('/api/auth/me', { credentials: 'include' })
      ]);
      setServices(srvRes.ok ? await srvRes.json() : []);
      setOrders(ordRes.ok ? await ordRes.json() : []);
      setCategories(catRes.ok ? await catRes.json() : []);
      setProfile(meRes.ok ? await meRes.json() : null);
    } catch (e) { } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...newService, price: parseFloat(newService.price) })
    });
    if (res.ok) {
      setMsg(lang === 'ar' ? '✅ تم الإنشاء!' : '✅ Service créé !');
      setNewService({ title: '', description: '', price: '', categoryId: '' });
      fetchAll();
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm(lang === 'ar' ? "هل أنت متأكد؟" : "Confirm?")) return;
    const res = await fetch(`/api/services/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (res.ok) fetchAll();
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    const res = await fetch(`/api/services/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status })
    });
    if (res.ok) fetchAll();
  };

  const handleUpdateLocation = async (lat: number, lng: number) => {
    try {
      const res = await fetch('/api/auth/profile/location', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ latitude: lat, longitude: lng })
      });
      if (res.ok) {
        setMsg(lang === 'ar' ? '✅ تم تحديث الموقع!' : '✅ Localisation mise à jour !');
        fetchAll();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const activeOrder = orders.find(o => o.id === activeChat);

  if (loading) return (
    <div style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <TrendingUp className="spin" size={40} color="var(--primary)" />
    </div>
  );

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    completed: orders.filter(o => o.status === 'COMPLETED').length,
    earnings: orders.filter(o => o.status === 'COMPLETED').reduce((acc, o) => acc + o.service.price, 0)
  };

  // Filter orders that have chats or are active
  const chatOrders = orders.filter(o =>
    !o.workerChatClearedAt && (o.status === 'ACCEPTED' || o.status === 'COMPLETED' || o.status === 'CANCELLED')
  );

  return (
    <div className="app-container animate-fade-in">
      {activeChat && <ChatModal
        orderId={activeChat}
        orderStatus={activeOrder?.status || 'PENDING'}
        currentUserId={userId}
        recipientName={activeOrder?.client?.name || 'Client'}
        onClose={() => setActiveChat(null)}
        onDelete={fetchAll}
        t={t}
        lang={lang}
      />}

      <div className="tab-switcher glass-panel" style={{ marginBottom: '3rem', padding: '0.4rem', borderRadius: '100px', width: 'fit-content' }}>
        <button className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('orders')} style={{ padding: '0.6rem 1.5rem' }}>
          {t.orders}
        </button>
        <button className={`btn ${activeTab === 'services' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('services')} style={{ padding: '0.6rem 1.5rem' }}>
          {t.worker}
        </button>
        <button className={`btn ${activeTab === 'chat' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('chat')} style={{ padding: '0.6rem 1.5rem' }}>
          {t.chat}
        </button>
        <button className={`btn ${activeTab === 'location' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('location')} style={{ padding: '0.6rem 1.5rem' }}>
          <MapPin size={18} /> {lang === 'ar' ? 'موقعي' : 'Ma Position'}
        </button>
      </div>

      <div className="bento-grid" style={{ marginBottom: '3rem' }}>
        <div className="bento-card" style={{ gridColumn: 'span 3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '1rem', borderRadius: '16px' }}><ClipboardList size={24} /></div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-sub)', textTransform: 'uppercase' }}>{t.orders}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="bento-card" style={{ gridColumn: 'span 3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(251, 191, 36, 0.1)', color: 'var(--accent)', padding: '1rem', borderRadius: '16px' }}><Clock size={24} /></div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-sub)', textTransform: 'uppercase' }}>{t.pending}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>{stats.pending}</div>
            </div>
          </div>
        </div>
        <div className="bento-card" style={{ gridColumn: 'span 3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '1rem', borderRadius: '16px' }}><CheckCircle size={24} /></div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-sub)', textTransform: 'uppercase' }}>{t.stats}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>{stats.completed}</div>
            </div>
          </div>
        </div>
        <div className="bento-card" style={{ gridColumn: 'span 3', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'white' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '1rem', borderRadius: '16px' }}><TrendingUp size={24} /></div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>DZD</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900' }}>{stats.earnings}</div>
            </div>
          </div>
        </div>
      </div>

      {msg && <div className="toast success animate-fade-in" style={{ position: 'static', maxWidth: 'none', marginBottom: '2rem' }}>{msg}</div>}

      {activeTab === 'orders' && (
        <div className="deck-table-wrap animate-slide-up">
          <table className="deck-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>{t.service}</th>
                <th>{t.date}</th>
                <th>{t.status}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-sub)' }}>{t.noNotifs}</td></tr>
              )}
              {orders.map(o => (
                <tr key={o.id}>
                  <td data-label="Client">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="avatar-small" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>{o.client?.name?.[0] || '?'}</div>
                      <div>
                        <strong style={{ fontSize: '0.9rem' }}>{o.client?.name || 'Inconnu'}</strong>
                        {o.status === 'ACCEPTED' && <div style={{ fontSize: '0.7rem', color: 'var(--primary-light)' }}>📞 {o.client?.phone || 'N/A'}</div>}
                      </div>
                    </div>
                  </td>
                  <td data-label={t.service}>
                    <div style={{ fontWeight: '800' }}>{o.service?.title}</div>
                    <small className="badge-auto" style={{ fontSize: '0.65rem' }}>{o.service?.category?.name}</small>
                  </td>
                  <td data-label={t.date}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <Clock size={14} />
                      {o.scheduledAt ? new Date(o.scheduledAt).toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                    </div>
                  </td>
                  <td data-label={t.status}>
                    <span className={`badge ${o.status === 'PENDING' ? 'badge-manual' : o.status === 'ACCEPTED' ? 'badge-auto' : o.status === 'COMPLETED' ? 'badge-success' : 'badge-danger'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td data-label={t.actions}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {o.status === 'PENDING' && (
                        <>
                          <button className="btn btn-primary btn-sm" style={{ padding: '0.5rem 1rem' }} onClick={() => handleUpdateStatus(o.id, 'ACCEPTED')}>{t.approve}</button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleUpdateStatus(o.id, 'CANCELLED')} style={{ border: 'none', color: 'var(--danger)' }}><XCircle size={18} /></button>
                        </>
                      )}
                      {o.status === 'ACCEPTED' && (
                        <>
                          <button className="btn btn-primary btn-sm" style={{ padding: '0.5rem 1rem' }} onClick={() => handleUpdateStatus(o.id, 'COMPLETED')}><CheckCircle size={16} /> OK</button>
                          <button className="btn btn-outline btn-sm" onClick={() => setActiveChat(o.id)}><MessageCircle size={16} /></button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleUpdateStatus(o.id, 'CANCELLED')} style={{ border: 'none', color: 'var(--danger)' }}><Trash2 size={16} /></button>
                        </>
                      )}
                      {((o.status === 'CANCELLED' || o.status === 'COMPLETED') && !o.workerChatClearedAt) && (
                        <button className="btn btn-outline btn-sm" onClick={() => setActiveChat(o.id)}><MessageCircle size={16} /> Chat</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="bento-grid animate-slide-up">
          <div className="bento-card" style={{ gridColumn: 'span 4' }}>
            <h3 style={{ marginBottom: '2rem', fontWeight: '900', fontSize: '1.5rem' }}>{t.addService}</h3>
            <form onSubmit={handleCreateService}>
              <div className="input-group">
                <label>{t.title}</label>
                <input type="text" required value={newService.title} onChange={e => setNewService({ ...newService, title: e.target.value })} placeholder="..." />
              </div>
              <div className="input-group">
                <label>{t.categories}</label>
                <select required value={newService.categoryId} onChange={e => setNewService({ ...newService, categoryId: e.target.value })}>
                  <option value="">...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>{t.price} (DZD)</label>
                <input type="number" required value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })} placeholder="0" />
              </div>
              <div className="input-group">
                <label>{t.description}</label>
                <textarea required rows={4} value={newService.description} onChange={e => setNewService({ ...newService, description: e.target.value })} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }}><Plus size={20} /> {t.create}</button>
            </form>
          </div>

          <div style={{ gridColumn: 'span 8' }}>
            <h3 style={{ marginBottom: '2rem', fontWeight: '900', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Briefcase size={24} color="var(--primary)" /> {t.myActiveServices}
            </h3>
            <div className="bento-grid">
              {services.length === 0 && <div className="bento-card" style={{ gridColumn: 'span 12', textAlign: 'center', color: 'var(--text-sub)' }}>{t.noActiveServices}</div>}
              {services.map(s => (
                <div key={s.id} className="bento-card" style={{ gridColumn: 'span 6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase' }}>{s.category?.name}</span>
                    <button className="btn-icon-danger" onClick={() => handleDeleteService(s.id)} style={{ color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                  </div>
                  <h4 style={{ fontWeight: '800', fontSize: '1.3rem', marginBottom: '0.5rem' }}>{s.title}</h4>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary-light)', marginTop: 'auto' }}>{s.price} <small style={{ fontSize: '0.7rem' }}>DZD</small></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'location' && (
        <div className="animate-slide-up">
          <div className="bento-card" style={{ gridColumn: 'span 12' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: '900', fontSize: '1.8rem' }}>
              {lang === 'ar' ? 'تحديد موقع عملك' : 'Définir votre zone de travail'}
            </h3>
            <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>
              {lang === 'ar' ? 'سيتمكن الزبائن من رؤيتك على الخريطة.' : 'Les clients pourront vous voir sur la carte.'}
            </p>
            <MapPicker
              initialLocation={profile?.latitude ? { lat: profile.latitude, lng: profile.longitude } : undefined}
              onLocationSelect={handleUpdateLocation}
            />
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="bento-grid animate-slide-up">
          {chatOrders.length === 0 && (
            <div style={{ gridColumn: 'span 12', textAlign: 'center', padding: '5rem' }}>
              <MessageCircle size={64} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
              <p>{lang === 'ar' ? 'لا توجد محادثات نشطة' : 'Aucune conversation active'}</p>
            </div>
          )}
          {chatOrders.map(o => (
            <div key={o.id} className="bento-card" onClick={() => setActiveChat(o.id)} style={{ cursor: 'pointer', gridColumn: 'span 4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div className="avatar-small" style={{ width: '56px', height: '56px', fontSize: '1.4rem', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>{o.client?.name?.[0] || '?'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <strong style={{ fontSize: '1.2rem' }}>{o.client?.name || 'Inconnu'}</strong>
                    <span className={`badge ${o.status === 'ACCEPTED' ? 'badge-auto' : 'badge-manual'}`} style={{ fontSize: '0.6rem' }}>{o.status}</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{o.service?.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

<style>{`
        .stats-grid-modern { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; }
        .stat-card { display: flex; align-items: center; gap: 1.25rem; padding: 1.5rem !important; }
        .stat-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .stat-info { display: flex; flex-direction: column; }
        .stat-label { font-size: 0.75rem; font-weight: 800; color: var(--text-sub); text-transform: uppercase; letter-spacing: 0.05em; }
        .stat-value { font-size: 1.5rem; font-weight: 900; color: var(--text-main); line-height: 1; margin-top: 0.2rem; }
        .client-cell { display: flex; align-items: center; gap: 0.75rem; }
        .avatar-small { width: 36px; height: 36px; border-radius: 50%; background: var(--primary-dark); display: flex; align-items: center; justify-content: center; font-weight: 800; color: white; font-size: 0.8rem; }
        .phone-link { font-size: 0.75rem; color: var(--primary-light); margin-top: 0.2rem; }
        .date-cell { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }
        .action-buttons-worker { display: flex; gap: 0.5rem; align-items: center; }
        .services-worker-layout { display: grid; grid-template-columns: 380px 1fr; gap: 2.5rem; align-items: start; }
        .service-item-card { padding: 1.5rem !important; }
        .btn-icon-danger { background: transparent; border: none; color: var(--danger); cursor: pointer; padding: 0.5rem; border-radius: 8px; transition: 0.2s; }
        .btn-icon-danger:hover { background: rgba(239, 68, 68, 0.1); }
        .price-tag-modern { font-size: 1.25rem; font-weight: 800; color: var(--primary-light); margin-top: auto; }
        .empty-state-mini { padding: 3rem; text-align: center; color: var(--text-sub); border: 1px dashed var(--border); border-radius: var(--radius-lg); }

        .chat-order-card:hover { transform: translateY(-4px); border-color: var(--primary); }

        @media (max-width: 1024px) {
          .services-worker-layout { grid-template-columns: 1fr; }
          .stats-grid-modern { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 768px) {
          .tab-switcher { width: 100%; display: flex; }
          .tab-switcher button { flex: 1; padding: 0.6rem 0.5rem !important; font-size: 0.8rem; }
        }
        @media (max-width: 480px) {
          .stats-grid-modern { grid-template-columns: 1fr; }
          .stat-card { padding: 1.25rem !important; }
        }
      `}</style>

