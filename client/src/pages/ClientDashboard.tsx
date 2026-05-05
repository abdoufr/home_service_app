import { useState, useEffect } from 'react';
import { ShoppingBag, Briefcase, MessageCircle, Search, Clock, MapPin, Star, Filter, ArrowRight, Trash2, User, Map as MapIcon } from 'lucide-react';
import ChatModal from '../components/ChatModal';
import WorkerMap from '../components/WorkerMap.js';

export default function ClientDashboard({ userId, t, lang }: { userId: string, t: any, lang: string }) {
  const [services, setServices] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'explore' | 'orders' | 'chat' | 'map'>('explore');
  const [workers, setWorkers] = useState<any[]>([]);
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [selectedCat, setSelectedCat] = useState('');
  const [orderDates, setOrderDates] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const fetchAll = async () => {
    try {
      const [srvRes, ordRes, catRes, workRes, meRes] = await Promise.all([
        fetch('/api/services', { credentials: 'include' }),
        fetch('/api/services/orders/client', { credentials: 'include' }),
        fetch('/api/services/categories', { credentials: 'include' }),
        fetch('/api/services/workers', { credentials: 'include' }),
        fetch('/api/auth/me', { credentials: 'include' })
      ]);
      setServices(srvRes.ok ? await srvRes.json() : []);
      setOrders(ordRes.ok ? await ordRes.json() : []);
      setCategories(catRes.ok ? await catRes.json() : []);
      setWorkers(workRes.ok ? await workRes.json() : []);
      setClientProfile(meRes.ok ? await meRes.json() : null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOrder = async (serviceId: string) => {
    const scheduledAt = orderDates[serviceId];
    if (!scheduledAt) {
      alert(lang === 'ar' ? "يرجى اختيار موعد." : "Veuillez choisir une date.");
      return;
    }

    const res = await fetch('/api/services/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ serviceId, scheduledAt })
    });
    if (res.ok) {
      setMsg(lang === 'ar' ? '✅ تم إرسال الطلب بنجاح!' : '✅ Commande envoyée avec succès !');
      fetchAll();
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!window.confirm(lang === 'ar' ? "هل أنت متأكد؟" : "Annuler?")) return;
    const res = await fetch(`/api/services/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: 'CANCELLED' })
    });
    if (res.ok) fetchAll();
  };

  if (loading) return (
    <div style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Clock className="spin" size={40} color="var(--primary)" />
    </div>
  );

  const filteredServices = services.filter(s => {
    const matchCat = selectedCat ? s.categoryId === selectedCat : true;
    const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.worker.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const activeOrder = orders.find(o => o.id === activeChat);

  // Filter orders that have chats or are active
  const chatOrders = orders.filter(o => 
    !o.clientChatClearedAt && (o.status === 'ACCEPTED' || o.status === 'COMPLETED' || o.status === 'CANCELLED')
  );

  return (
    <div className="app-container animate-fade-in">
      {activeChat && <ChatModal 
        orderId={activeChat} 
        orderStatus={activeOrder?.status || 'PENDING'} 
        currentUserId={userId} 
        recipientName={activeOrder?.service.worker.name}
        onClose={() => setActiveChat(null)} 
        onDelete={fetchAll} 
        t={t} 
        lang={lang} 
      />}
      
      <div className="tab-switcher glass-panel" style={{ marginBottom: '2rem', padding: '0.4rem', borderRadius: '100px', width: 'fit-content', margin: '0 auto 2.5rem' }}>
        <button className={`btn ${activeTab === 'explore' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('explore')} style={{ padding: '0.6rem 2rem' }}>
          {t.explorer}
        </button>
        <button className={`btn ${activeTab === 'orders' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('orders')} style={{ padding: '0.6rem 2rem' }}>
          {t.history}
        </button>
        <button className={`btn ${activeTab === 'chat' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('chat')} style={{ padding: '0.6rem 2rem' }}>
          {t.chat}
        </button>
        <button className={`btn ${activeTab === 'map' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('map')} style={{ padding: '0.6rem 2rem' }}>
          <MapIcon size={18} style={{ marginRight: '8px' }} /> {lang === 'ar' ? 'الخريطة' : 'Carte'}
        </button>
      </div>

      {msg && <div className="toast success animate-fade-in" style={{ position: 'static', maxWidth: 'none', marginBottom: '2rem' }}>{msg}</div>}

      {activeTab === 'explore' && (
        <div className="animate-fade-in">
          {/* Enhanced Search & Filter */}
          <div className="search-section" style={{ marginBottom: '2.5rem' }}>
            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
              <Search className="search-icon" size={20} />
              <input 
                type="text" 
                className="search-input" 
                placeholder={t.search} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="categories-pill-scroll">
              <button className={`pill ${selectedCat === '' ? 'active' : ''}`} onClick={() => setSelectedCat('')}>
                {t.allCategories}
              </button>
              {categories.map(c => (
                <button 
                  key={c.id} 
                  className={`pill ${selectedCat === c.id ? 'active' : ''}`} 
                  onClick={() => setSelectedCat(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="adaptive-grid">
            {filteredServices.length === 0 && (
              <div className="empty-state-full">
                <Search size={64} />
                <p>{t.noServices}</p>
              </div>
            )}
            {filteredServices.map(s => (
              <div key={s.id} className="card service-card">
                <div className="card-top">
                  <span className="category-badge">{s.category.name}</span>
                  <div className="rating">
                    <Star size={14} fill="var(--accent)" color="var(--accent)" />
                    <span>4.9</span>
                  </div>
                </div>
                <h3 className="service-title">{s.title}</h3>
                <p className="service-desc">{s.description}</p>
                
                <div className="worker-mini-profile">
                  <div className="avatar-small">{s.worker.name[0]}</div>
                  <div>
                    <span className="worker-name">{s.worker.name}</span>
                    <div className="price-tag">{s.price} <small>DZD</small></div>
                  </div>
                </div>

                <div className="card-actions">
                  <div className="date-picker-mini">
                    <Clock size={16} />
                    <input 
                      type="datetime-local" 
                      value={orderDates[s.id] || ''}
                      onChange={(e) => setOrderDates({ ...orderDates, [s.id]: e.target.value })}
                    />
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleOrder(s.id)}>
                    {t.order} <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="orders-section animate-fade-in">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.service}</th>
                  <th>{t.provider}</th>
                  <th>{t.date}</th>
                  <th>{t.price}</th>
                  <th>{t.status}</th>
                  <th>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '5rem' }}>{t.noServices}</td></tr>
                )}
                {orders.map(o => (
                  <tr key={o.id}>
                    <td data-label={t.service}>
                      <div style={{ fontWeight: '800' }}>{o.service.title}</div>
                      <small className="badge-auto" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>{o.service.category.name}</small>
                    </td>
                    <td data-label={t.provider}>{o.service.worker.name}</td>
                    <td data-label={t.date}>
                      <div className="date-cell">
                        <Clock size={14} />
                        {o.scheduledAt ? new Date(o.scheduledAt).toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                      </div>
                    </td>
                    <td data-label={t.price} style={{ fontWeight: '800', color: 'var(--primary-light)' }}>{o.service.price} DZD</td>
                    <td data-label={t.status}>
                      <span className={`badge ${o.status === 'PENDING' ? 'badge-manual' : o.status === 'ACCEPTED' ? 'badge-auto' : o.status === 'COMPLETED' ? 'badge-success' : 'badge-danger'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td data-label={t.actions}>
                      <div className="action-buttons">
                        {((o.status === 'ACCEPTED') || ((o.status === 'CANCELLED' || o.status === 'COMPLETED') && !o.clientChatClearedAt)) && (
                          <button className="btn btn-primary btn-sm" onClick={() => setActiveChat(o.id)}>
                            <MessageCircle size={16} /> {o.status === 'ACCEPTED' ? t.chat : t.viewChat}
                          </button>
                        )}
                        {(o.status === 'PENDING' || o.status === 'ACCEPTED') && (
                          <button className="btn btn-outline btn-sm btn-danger" onClick={() => handleCancel(o.id)} style={{ border: 'none' }}>
                            <Trash2 size={16} />
                          </button>
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

      {activeTab === 'map' && (
        <div className="animate-fade-in">
          <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>
              {lang === 'ar' ? 'العاملين القريبين منك' : 'Prestataires à proximité'}
            </h2>
            <WorkerMap 
              workers={workers} 
              clientLocation={clientProfile?.latitude ? { lat: clientProfile.latitude, lng: clientProfile.longitude } : null} 
            />
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="chat-tab-section animate-fade-in">
          <div className="adaptive-grid">
            {chatOrders.length === 0 && (
              <div className="empty-state-full">
                <MessageCircle size={64} style={{ opacity: 0.1 }} />
                <p>{lang === 'ar' ? 'لا توجد محادثات نشطة' : 'Aucune conversation active'}</p>
              </div>
            )}
            {chatOrders.map(o => (
              <div key={o.id} className="card chat-order-card" onClick={() => setActiveChat(o.id)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="avatar-small" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>{o.service.worker.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '1.1rem' }}>{o.service.worker.name}</strong>
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
        .search-icon { position: absolute; left: 1.25rem; top: 50%; transform: translateY(-50%); color: var(--text-sub); }
        .search-input { padding-left: 3.5rem !important; background: var(--glass-bg); border-radius: 100px; }
        .categories-pill-scroll { display: flex; gap: 0.75rem; overflow-x: auto; padding: 0.25rem; scrollbar-width: none; }
        .categories-pill-scroll::-webkit-scrollbar { display: none; }
        .pill { 
          white-space: nowrap; padding: 0.6rem 1.5rem; border-radius: 100px; border: 1px solid var(--border); 
          background: transparent; color: var(--text-muted); font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: 0.3s;
        }
        .pill.active { background: var(--primary); color: white; border-color: var(--primary); box-shadow: 0 4px 12px var(--primary-glow); }
        .service-card { display: flex; flex-direction: column; }
        .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .category-badge { font-size: 0.7rem; font-weight: 800; color: var(--primary-light); text-transform: uppercase; letter-spacing: 0.05em; }
        .rating { display: flex; alignItems: center; gap: 0.3rem; font-size: 0.8rem; font-weight: 800; color: var(--accent); }
        .service-title { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.5rem; }
        .service-desc { color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem; flex: 1; }
        .worker-mini-profile { display: flex; align-items: center; gap: 0.75rem; background: rgba(255,255,255,0.02); padding: 0.75rem; border-radius: 12px; margin-bottom: 1.5rem; }
        .avatar-small { width: 32px; height: 32px; border-radius: 50%; background: var(--primary-dark); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem; }
        .worker-name { display: block; font-size: 0.85rem; font-weight: 700; color: var(--text-main); }
        .price-tag { font-size: 1.1rem; font-weight: 800; color: var(--primary-light); }
        .date-picker-mini { 
          display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.04); 
          padding: 0.5rem 1rem; border-radius: 10px; margin-bottom: 1rem; border: 1px solid var(--border);
        }
        .date-picker-mini input { padding: 0; background: transparent; border: none; font-size: 0.85rem; }
        .date-picker-mini input:focus { box-shadow: none; }
        .empty-state-full { grid-column: 1/-1; padding: 5rem 2rem; text-align: center; color: var(--text-sub); }
        .empty-state-full svg { opacity: 0.1; margin-bottom: 1.5rem; }
        .action-buttons { display: flex; gap: 0.5rem; }
        .date-cell { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }
        
        .chat-order-card:hover { transform: translateY(-4px); border-color: var(--primary); }

        @media (max-width: 768px) {
          .tab-switcher { width: 100%; display: flex; }
          .tab-switcher button { flex: 1; padding: 0.6rem 0.5rem !important; font-size: 0.8rem; }
          .search-input { font-size: 0.9rem; }
        }
      `}</style>
    </div>
  );
}
