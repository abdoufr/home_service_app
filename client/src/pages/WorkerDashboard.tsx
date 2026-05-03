import { useState, useEffect } from 'react';
import { Plus, Trash2, Briefcase, ClipboardList, MessageCircle, Clock, CheckCircle, XCircle, TrendingUp, AlertCircle, User } from 'lucide-react';
import ChatModal from '../components/ChatModal';

export default function WorkerDashboard({ userId, t, lang }: { userId: string, t: any, lang: string }) {
  const [services, setServices] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'services' | 'chat'>('orders');
  
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
      const [srvRes, ordRes, catRes] = await Promise.all([
        fetch('http://localhost:3000/api/services/worker/me', { credentials: 'include' }),
        fetch('http://localhost:3000/api/services/orders/worker', { credentials: 'include' }),
        fetch('http://localhost:3000/api/services/categories', { credentials: 'include' })
      ]);
      setServices(srvRes.ok ? await srvRes.json() : []);
      setOrders(ordRes.ok ? await ordRes.json() : []);
      setCategories(catRes.ok ? await catRes.json() : []);
    } catch (e) {} finally {
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
    const res = await fetch('http://localhost:3000/api/services', {
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
    const res = await fetch(`http://localhost:3000/api/services/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (res.ok) fetchAll();
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    const res = await fetch(`http://localhost:3000/api/services/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status })
    });
    if (res.ok) fetchAll();
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
        recipientName={activeOrder?.client.name}
        onClose={() => setActiveChat(null)} 
        onDelete={fetchAll} 
        t={t} 
        lang={lang} 
      />}
      
      <div className="tab-switcher glass-panel" style={{ marginBottom: '2rem', padding: '0.4rem', borderRadius: '100px', width: 'fit-content', margin: '0 auto 2.5rem' }}>
        <button className={`btn ${activeTab === 'orders' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('orders')} style={{ padding: '0.6rem 1.5rem' }}>
          {t.orders}
        </button>
        <button className={`btn ${activeTab === 'services' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('services')} style={{ padding: '0.6rem 1.5rem' }}>
          {t.worker}
        </button>
        <button className={`btn ${activeTab === 'chat' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('chat')} style={{ padding: '0.6rem 1.5rem' }}>
          {t.chat}
        </button>
      </div>

      {/* Modern Stats Grid */}
      <div className="stats-grid-modern" style={{ marginBottom: '3rem' }}>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)' }}><ClipboardList size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">{t.orders}</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(251, 191, 36, 0.1)', color: 'var(--accent)' }}><Clock size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">{t.pending}</span>
            <span className="stat-value">{stats.pending}</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}><CheckCircle size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">{t.stats}</span>
            <span className="stat-value">{stats.completed}</span>
          </div>
        </div>
        <div className="stat-card glass-panel" style={{ background: 'linear-gradient(135deg, var(--primary-glow), transparent)' }}>
          <div className="stat-icon" style={{ background: 'var(--primary)', color: 'white' }}><TrendingUp size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">DZD</span>
            <span className="stat-value">{stats.earnings}</span>
          </div>
        </div>
      </div>

      {msg && <div className="toast success animate-fade-in" style={{ position: 'static', maxWidth: 'none', marginBottom: '2rem' }}>{msg}</div>}

      {activeTab === 'orders' && (
        <div className="orders-section animate-fade-in">
          <div className="table-responsive">
            <table className="data-table">
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
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '5rem' }}>{t.noNotifs}</td></tr>
                )}
                {orders.map(o => (
                  <tr key={o.id}>
                    <td data-label="Client">
                      <div className="client-cell">
                        <div className="avatar-small">{o.client.name[0]}</div>
                        <div>
                          <strong>{o.client.name}</strong>
                          {o.status === 'ACCEPTED' && <div className="phone-link">📞 {o.client.phone || 'N/A'}</div>}
                        </div>
                      </div>
                    </td>
                    <td data-label={t.service}>
                      <div style={{ fontWeight: '700' }}>{o.service.title}</div>
                      <small className="badge-auto" style={{ fontSize: '0.65rem' }}>{o.service.category.name}</small>
                    </td>
                    <td data-label={t.date}>
                      <div className="date-cell">
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
                      <div className="action-buttons-worker">
                        {o.status === 'PENDING' && (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={() => handleUpdateStatus(o.id, 'ACCEPTED')}>{t.approve}</button>
                            <button className="btn btn-outline btn-sm btn-danger" onClick={() => handleUpdateStatus(o.id, 'CANCELLED')} style={{ border: 'none' }}><XCircle size={18} /></button>
                          </>
                        )}
                        {o.status === 'ACCEPTED' && (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={() => handleUpdateStatus(o.id, 'COMPLETED')}><CheckCircle size={16} /> OK</button>
                            <button className="btn btn-outline btn-sm" onClick={() => setActiveChat(o.id)}><MessageCircle size={16} /></button>
                            <button className="btn btn-outline btn-sm btn-danger" onClick={() => handleUpdateStatus(o.id, 'CANCELLED')} style={{ border: 'none' }}><Trash2 size={16} /></button>
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
        </div>
      )}

      {activeTab === 'services' && (
        <div className="services-worker-layout animate-fade-in">
          <div className="glass-panel add-service-form">
            <h3 style={{ marginBottom: '1.5rem', fontWeight: '800' }}>{t.addService}</h3>
            <form onSubmit={handleCreateService}>
              <div className="input-group">
                <label>{t.title}</label>
                <input type="text" required value={newService.title} onChange={e => setNewService({...newService, title: e.target.value})} placeholder="..." />
              </div>
              <div className="input-group">
                <label>{t.categories}</label>
                <select required value={newService.categoryId} onChange={e => setNewService({...newService, categoryId: e.target.value})}>
                  <option value="">...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>{t.price} (DZD)</label>
                <input type="number" required value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} placeholder="0" />
              </div>
              <div className="input-group">
                <label>{t.description}</label>
                <textarea required rows={4} value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }}><Plus size={20}/> {t.create}</button>
            </form>
          </div>

          <div className="active-services-list">
            <h3 style={{ marginBottom: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Briefcase size={22} color="var(--primary)" /> {t.myActiveServices}
            </h3>
            <div className="adaptive-grid">
              {services.length === 0 && <div className="empty-state-mini">{t.noActiveServices}</div>}
              {services.map(s => (
                <div key={s.id} className="card service-item-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="category-badge">{s.category.name}</span>
                    <button className="btn-icon-danger" onClick={() => handleDeleteService(s.id)}><Trash2 size={16} /></button>
                  </div>
                  <h4 style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{s.title}</h4>
                  <div className="price-tag-modern">{s.price} <small>DZD</small></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="chat-tab-section animate-fade-in">
          <div className="adaptive-grid">
            {chatOrders.length === 0 && (
              <div className="empty-state-full" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem' }}>
                <MessageCircle size={64} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                <p>{lang === 'ar' ? 'لا توجد محادثات نشطة' : 'Aucune conversation active'}</p>
              </div>
            )}
            {chatOrders.map(o => (
              <div key={o.id} className="card chat-order-card" onClick={() => setActiveChat(o.id)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="avatar-small" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>{o.client.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '1.1rem' }}>{o.client.name}</strong>
                      <span className={`badge ${o.status === 'ACCEPTED' ? 'badge-auto' : 'badge-manual'}`} style={{ fontSize: '0.6rem' }}>{o.status}</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>{o.service.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
    </div>
  );
}
